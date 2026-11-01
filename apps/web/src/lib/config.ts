/**
 * Configuration and environment utilities for the web client.
 * Ensures robust protocol resolution whether running locally, in Docker,
 * or deployed on Render (where service hosts may be bare domains).
 */

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  let url = raw.trim();

  // Guard against bare hostnames without protocol (e.g. from Render blueprint)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('onrender.com') || (!url.includes('localhost') && !url.includes('127.0.0.1'))) {
      url = `https://${url}`;
    } else {
      url = `http://${url}`;
    }
  }

  return url.replace(/\/+$/, '');
}

export const API_BASE_URL = getApiBaseUrl();
