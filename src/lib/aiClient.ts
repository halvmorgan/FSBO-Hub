import { auth } from './firebase';

export class AiCreditLimitError extends Error {
  public readonly upgradeRequired = true;
  public readonly creditsUsed?: number;
  public readonly maxCredits?: number;

  constructor(message: string, creditsUsed?: number, maxCredits?: number) {
    super(message);
    this.name = 'AiCreditLimitError';
    this.creditsUsed = creditsUsed;
    this.maxCredits = maxCredits;
  }
}

export interface PostAiOptions {
  currentPlan?: string;
  creditsUsed?: number;
  maxCredits?: number;
  onCreditsSynced?: (creditsUsed: number) => void;
  maxRetries?: number;
}

const TRANSIENT_STATUSES = new Set([502, 503, 504, 429]);

function isNetworkFetchError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    err?.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  );
}

export function normalizeFriendlyAiError(err: any): string {
  if (err instanceof AiCreditLimitError) {
    return err.message;
  }
  const msg = String(err?.message || '').trim();
  const lower = msg.toLowerCase();
  if (
    !msg ||
    isNetworkFetchError(err) ||
    lower.includes('unexpected token') ||
    lower.includes('json') ||
    lower.includes('http 50') ||
    lower.includes('http 40')
  ) {
    return 'Something went wrong — please try again';
  }
  return msg;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared AI request helper with:
 * - Trial/plan credit pre-check
 * - Firebase Auth ID token header for persisted per-user credit tracking
 * - Automatic retry (up to 2 retries on transient network / 502 / 503 / 504 failures)
 * - Clean user-facing errors (never raw "Failed to fetch")
 */
export async function postAiJson<T = any>(
  url: string,
  body: Record<string, any>,
  opts: PostAiOptions = {}
): Promise<T> {
  const {
    currentPlan = 'trial',
    creditsUsed,
    maxCredits,
    onCreditsSynced,
    maxRetries = 2,
  } = opts;

  if (
    typeof creditsUsed === 'number' &&
    typeof maxCredits === 'number' &&
    maxCredits > 0 &&
    creditsUsed >= maxCredits
  ) {
    const msg =
      currentPlan === 'trial'
        ? "You've used all 3 free trial AI generations. Upgrade your plan to keep going."
        : `You've used all ${maxCredits} AI credits for this period. Upgrade your plan to continue.`;
    throw new AiCreditLimitError(msg, creditsUsed, maxCredits);
  }

  const fbUser = auth.currentUser;
  let idToken: string | null = null;
  if (fbUser) {
    try {
      idToken = await fbUser.getIdToken();
    } catch {
      idToken = null;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-plan': currentPlan,
  };
  if (fbUser?.uid) {
    headers['x-user-id'] = fbUser.uid;
  }
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const totalAttempts = Math.max(1, maxRetries + 1);
  let lastError: any = null;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        if (res.status === 403 && data?.upgradeRequired) {
          if (typeof data.creditsUsed === 'number' && onCreditsSynced) {
            onCreditsSynced(data.creditsUsed);
          }
          const limitMsg =
            currentPlan === 'trial'
              ? "You've used all 3 free trial AI generations. Upgrade your plan to keep going."
              : data.error || 'AI credit limit reached. Please upgrade your plan to continue.';
          throw new AiCreditLimitError(limitMsg, data.creditsUsed, data.maxCredits);
        }

        // Retry transient 502/503/504/429 server responses automatically before showing an error
        if (TRANSIENT_STATUSES.has(res.status) && attempt < totalAttempts) {
          await wait(attempt * 1000);
          continue;
        }

        if (res.status === 401 && data?.isAiKeyMissing) {
          throw new Error('AI service is temporarily unavailable — please try again shortly.');
        }

        const serverMsg = data?.isAiBusy || res.status === 503
          ? 'AI is busy right now — please try again in a moment.'
          : data?.error || data?.message || 'Something went wrong — please try again';

        throw new Error(serverMsg);
      }

      if (typeof data?.creditsUsed === 'number' && onCreditsSynced) {
        onCreditsSynced(data.creditsUsed);
      } else if (typeof creditsUsed === 'number' && onCreditsSynced) {
        onCreditsSynced(creditsUsed + 1);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof AiCreditLimitError) {
        throw err;
      }

      lastError = err;
      if (isNetworkFetchError(err) && attempt < totalAttempts) {
        await wait(attempt * 1000);
        continue;
      }

      if (isNetworkFetchError(err)) {
        throw new Error('Something went wrong — please try again');
      }

      throw new Error(normalizeFriendlyAiError(err));
    }
  }

  throw new Error(normalizeFriendlyAiError(lastError));
}
