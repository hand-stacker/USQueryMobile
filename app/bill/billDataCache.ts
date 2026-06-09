import { retrieveUserSession } from "@/app/encrypted-storage/functions";
import { authRequest } from "@/app/hooks/authRequest";

const BILL_QUERY_BASE_URL = "https://www.usquery.com";
const GRAPHQL_URL = "https://www.usquery.com/api/v1.0/graphql/";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const GET_HISTORY_QUERY = `query GetChatHistory($billId: Int!, $accessToken: String!) {
  getChatHistory(billId: $billId, accessToken: $accessToken) {
    sessionId messages { role content } error
  }
}`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface BillPrefetchData {
  isLoggedIn: boolean;
  tier: number;
  predUsage: { display: string; val: number; limit: number } | null;
  chatUsage: { display: "count" | "donut" | "none"; val: number | null; limit?: number } | null;
  predDist: {
    exists: boolean;
    house_dist: Record<string, number> | null;
    senate_dist: Record<string, number> | null;
    credits_remaining: number | null;
    member_reveal_unlocked: boolean;
    generated_at?: string | null;
  };
  chatHistory: {
    sessionId: string;
    messages: Array<{ role: string; content: string }>;
  } | null;
  fetchedAt: number;
}

const EMPTY_PRED_DIST: BillPrefetchData["predDist"] = {
  exists: false,
  house_dist: null,
  senate_dist: null,
  credits_remaining: null,
  member_reveal_unlocked: false,
};

const LOGGED_OUT_ENTRY = (fetchedAt: number): BillPrefetchData => ({
  isLoggedIn: false,
  tier: 0,
  predUsage: null,
  chatUsage: null,
  predDist: EMPTY_PRED_DIST,
  chatHistory: null,
  fetchedAt,
});

// ── Cache store ──────────────────────────────────────────────────────────────

const _cache = new Map<string, BillPrefetchData>();

/**
 * Returns cached data for the given bill if it exists and is under 5 minutes
 * old. Returns null on a cache miss or expired entry.
 */
export function getBillCache(billId: string): BillPrefetchData | null {
  const entry = _cache.get(billId);
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    _cache.delete(billId);
    return null;
  }
  return entry;
}

export function clearBillCache(billId: string): void {
  _cache.delete(billId);
}

// ── Fetch logic ──────────────────────────────────────────────────────────────

async function doFetch(billId: string): Promise<BillPrefetchData> {
  const session = await retrieveUserSession();

  if (!session?.accessToken) {
    return LOGGED_OUT_ENTRY(Date.now());
  }

  const billIdNum = parseInt(String(billId), 10);

  const [statusRes, predUsageRes, chatUsageRes, predDistRes, histRes] = await Promise.allSettled([
    authRequest("subscription/status/"),
    authRequest("/bill-query/prediction/usage/", {}, { baseUrl: BILL_QUERY_BASE_URL }),
    authRequest("/bill-query/chat/usage/", {}, { baseUrl: BILL_QUERY_BASE_URL }),
    authRequest(
      `/bill-query/prediction/generate/${billId}/?generate=false`,
      { method: "POST" },
      { baseUrl: BILL_QUERY_BASE_URL }
    ),
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({
        query: GET_HISTORY_QUERY,
        variables: { billId: billIdNum, accessToken: session.accessToken },
      }),
    }).then(r => r.json()),
  ]);

  // Subscription tier
  const tier = statusRes.status === "fulfilled" ? (statusRes.value?.tier ?? 0) : 0;

  // Prediction usage limits
  const puv = predUsageRes.status === "fulfilled" ? predUsageRes.value : null;
  const predUsage: BillPrefetchData["predUsage"] =
    puv?.display === "count" && puv?.val != null
      ? { display: puv.display, val: puv.val, limit: puv.limit ?? 10 }
      : null;

  // Chat usage limits
  const chatUsage: BillPrefetchData["chatUsage"] =
    chatUsageRes.status === "fulfilled" && chatUsageRes.value?.display
      ? chatUsageRes.value
      : null;

  // Prediction distribution (only if one already exists — generate=false)
  const pdv = predDistRes.status === "fulfilled" ? predDistRes.value : null;
  const predDist: BillPrefetchData["predDist"] =
    pdv?.exists && pdv?.house_dist && pdv?.senate_dist
      ? {
          exists: true,
          house_dist: pdv.house_dist,
          senate_dist: pdv.senate_dist,
          credits_remaining: pdv.credits_remaining ?? null,
          member_reveal_unlocked: pdv.member_reveal_unlocked ?? false,
          generated_at: pdv.generated_at ?? null,
        }
      : EMPTY_PRED_DIST;

  // Chat history
  let chatHistory: BillPrefetchData["chatHistory"] = null;
  if (histRes.status === "fulfilled") {
    const hist = histRes.value?.data?.getChatHistory;
    if (hist?.sessionId && !hist?.error) {
      chatHistory = { sessionId: hist.sessionId, messages: hist.messages ?? [] };
    }
  }

  return { isLoggedIn: true, tier, predUsage, chatUsage, predDist, chatHistory, fetchedAt: Date.now() };
}

/**
 * Pre-fetches subscription status, usage limits, prediction distribution, and
 * chat history for the given bill. All five requests fire concurrently.
 * Results are stored in a module-level cache with a 5-minute TTL.
 * Retries the full fetch once on failure; on second failure stores a minimal
 * fallback so the carousel unblocks and child screens use their own loaders.
 */
export async function prefetchBillData(billId: string): Promise<void> {
  try {
    _cache.set(billId, await doFetch(billId));
  } catch {
    try {
      _cache.set(billId, await doFetch(billId));
    } catch {
      _cache.set(billId, LOGGED_OUT_ENTRY(Date.now()));
    }
  }
}
