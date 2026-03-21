const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Cloudflare Pages base URL for published landing pages */
export const PAGES_BASE_URL = 'https://braza-commerce-pages.pages.dev';

/** Build the public URL for a published landing page */
export function getPageUrl(slug: string): string {
  return `${PAGES_BASE_URL}/${slug}/`;
}

/** Build the URL with Facebook Ads dynamic macros ready to paste */
export function getPageUrlForAds(slug: string): string {
  return `${PAGES_BASE_URL}/${slug}/?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  } catch (error) {
    // In development, log the error
    if (typeof window !== 'undefined') {
      console.warn(`[apiFetch] ${path} failed:`, (error as Error).message);
    }
    throw error;
  }
}

export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body,
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}
