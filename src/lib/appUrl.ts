/**
 * Shared App URL resolver for FSBO Compass
 * Reads from APP_URL / VITE_APP_URL environment variable with fallback to window.location.origin
 */

export function getAppUrl(): string {
  // 1. Check Vite env var if provided at build or runtime
  const clientEnvUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.APP_URL;
  if (clientEnvUrl && typeof clientEnvUrl === 'string' && clientEnvUrl.trim()) {
    return clientEnvUrl.trim().replace(/\/+$/, '');
  }

  // 2. Browser window origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 3. Fallback
  return 'https://fsbocompass.com';
}

export function getPropertyWebsiteUrl(slug: string): string {
  const base = getAppUrl();
  return `${base}/p/${slug}`;
}
