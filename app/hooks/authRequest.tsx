import { refreshAccessToken, removeUserSession, retrieveUserSession } from "../encrypted-storage/functions";
const API_BASE_URL = "https://www.usquery.com/api/";

async function authorizedFetch(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = API_BASE_URL,
): Promise<{ response: Response; hadToken: boolean }> {
    let session = await retrieveUserSession();
    const hadToken = !!session?.accessToken;
    let headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(hadToken
            ? { Authorization: `Bearer ${session!.accessToken}` }
            : {}),
    };
    let f = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
    return { response: f, hadToken };
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export interface ApiResponse {
    /** HTTP status, or 0 when the request never reached the server. */
    status: number;
    /** True for 2xx. */
    ok: boolean;
    /** Parsed JSON body, or null when the body was empty/not JSON. */
    data: any;
    /** False when the body could not be parsed as JSON (proxy error page, etc). */
    parsed: boolean;
}

function readBody(response: Response): Promise<ApiResponse> {
    return response.text().then((text) => {
        try {
            return { status: response.status, ok: response.ok, data: JSON.parse(text), parsed: true };
        } catch {
            return { status: response.status, ok: response.ok, data: null, parsed: false };
        }
    });
}

/**
 * Like `authRequest`, but surfaces the HTTP status instead of collapsing every
 * response to its JSON body. Needed wherever the status is part of the API
 * contract rather than just a transport detail — the Apple IAP verify endpoint
 * distinguishes retryable failures (500/503) from permanent ones (400/409) by
 * status alone, and the Stripe endpoints signal "this subscription is
 * App Store managed" with a 409.
 *
 * Only a failed token refresh throws (as "Session expired"); every other
 * outcome, including 4xx/5xx and unparseable bodies, is returned.
 */
export async function authRequestWithStatus(
    endpoint: string,
    options: RequestInit = {},
    config: { baseUrl?: string } = {},
): Promise<ApiResponse> {
    const baseUrl = config.baseUrl ?? API_BASE_URL;
    const { response, hadToken } = await authorizedFetch(endpoint, options, baseUrl);

    if (response.status !== 401) {
        return readBody(response);
    }

    // A 401 on a request we never attached a token to just means the endpoint
    // requires auth — there is no session to refresh and none to sign out of.
    if (!hadToken) {
        return readBody(response);
    }

    // 401 → try refresh
    if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
            .finally(() => {
                isRefreshing = false;
            });
    }

    let newAccessToken: string;
    try {
        newAccessToken = await refreshPromise!;
    } catch {
        // Refresh failed → logout; let caller handle UI/alerts
        await removeUserSession();
        throw new Error("Session expired");
    }

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
    return readBody(retryResponse);
}

export async function authRequest(
    endpoint: string,
    options: RequestInit = {},
    config: { baseUrl?: string } = {},
): Promise<any> {
    const result = await authRequestWithStatus(endpoint, options, config);
    if (!result.parsed) {
        throw new Error(`Server error (${result.status})`);
    }
    return result.data;
}
