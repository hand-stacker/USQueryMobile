import { refreshAccessToken, removeUserSession, retrieveUserSession } from "../encrypted-storage/functions";
const API_BASE_URL = "https://www.usquery.com/api/";

async function authorizedFetch(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = API_BASE_URL,
): Promise<Response> {
    let session = await retrieveUserSession();
    let headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
    };
    let f = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
    return f;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export async function authRequest(
    endpoint: string,
    options: RequestInit = {},
    config: { baseUrl?: string } = {},
): Promise<any> {
    const baseUrl = config.baseUrl ?? API_BASE_URL;
    let response = await authorizedFetch(endpoint, options, baseUrl);

    if (response.status !== 401) {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            throw new Error(`Server error (${response.status})`);
        }
    }

    // 401 → try refresh
    if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
            .finally(() => {
                isRefreshing = false;
            });
    }

    try {
        const newAccessToken = await refreshPromise;
        // Retry original request with new token
        const retryResponse = await fetch(
            `${baseUrl}${endpoint}`,
            {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newAccessToken}`,
                },
            }
        );

        const retryText = await retryResponse.text();
        try {
            return JSON.parse(retryText);
        } catch {
            throw new Error(`Server error (${retryResponse.status})`);
        }
    } catch (error) {
        // Refresh failed → logout; let caller handle UI/alerts
        await removeUserSession();
        throw new Error("Session expired");
    }
}