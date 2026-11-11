/**
 * Shared App URL resolver for FSBO Compass
 * Reads from APP_URL / VITE_APP_URL environment variable with fallback to window.location.origin
 */

export function getAppUrl(): string {
  // 1. Check Vite env var if provided at build or runtime
  const clientEnvUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.APP_URL;
  if (clientEnvUrl && typeof clientEnvUrl === 'string' && clientEnvUrl.trim()) {
    const trimmed = clientEnvUrl.trim().replace(/\/+$/, '');
    if (!trimmed.includes('run.app') && !trimmed.includes('ai.studio')) {
      return trimmed;
    }
  }

  // 2. Browser window origin (if custom domain)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    if (!origin.includes('run.app') && !origin.includes('ai.studio') && !origin.includes('localhost')) {
      return origin;
    }
  }

  // 3. Fallback canonical custom domain
  return 'https://fsbocompass.com';
}

export function getPropertyWebsiteUrl(slug: string): string {
  const base = getAppUrl();
  return `${base}/p/${slug}`;
}
