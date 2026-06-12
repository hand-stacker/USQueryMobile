const APP_VERSION_URL = 'https://www.usquery.com/api/auth/app-version/';

/** Fetches the current released app version, e.g. "1.0.4". Returns null on failure. */
export async function getAppVersion(): Promise<string | null> {
  try {
    const response = await fetch(APP_VERSION_URL);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}
