/**
 * Configuration and environment utilities for the web client.
 * Ensures robust protocol resolution whether running locally, in Docker,
 * or deployed on Render (where service hosts may be bare domains).
 */

/**
 * Configuration and environment utilities for the web client.
 * Ensures robust protocol and domain resolution whether running locally, in Docker,
 * or deployed on Render (where service hosts may be bare service names like 'sms-backend-api').
 */

export function normalizeApiUrl(raw?: string): string {
  const fallback = 'http://localhost:4000';
  let url = (raw || '').trim();
  if (!url) return fallback;

  // Prepend protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    url = isLocal ? `http://${url}` : `https://${url}`;
  }

  // Guard against bare internal service names from Render blueprints (e.g. 'sms-backend-api')
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (!host.includes('.') && host !== 'localhost' && host !== '127.0.0.1') {
      parsed.hostname = `${host}.onrender.com`;
      url = parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname);
    }
  } catch {
    // If URL parsing fails, retain url as-is
  }

  return url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
}

export const API_BASE_URL = getApiBaseUrl();
