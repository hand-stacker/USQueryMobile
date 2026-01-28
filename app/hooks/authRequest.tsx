import { refreshAccessToken, removeUserSession, retrieveUserSession } from "../encrypted-storage/functions";
const API_BASE_URL = "https://www.usquery.com/api/";

async function authorizedFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    let session = await retrieveUserSession();
    let headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
    };
    let f = await fetch(`${API_BASE_URL}${endpoint}`, {
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
): Promise<any> {
    let response = await authorizedFetch(endpoint, options);

    if (response.status !== 401) {
        return response.json();
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
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newAccessToken}`,
                },
            }
        );

        if (!retryResponse.ok) {
            throw new Error("Retry failed");
        }

        return retryResponse.json();
    } catch (error) {
        // Refresh failed → logout
        await removeUserSession();
        throw new Error("Session expired. Please log in again.");
    }
}