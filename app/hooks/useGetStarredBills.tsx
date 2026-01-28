import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect, useRef, useState } from "react";
import { client } from "../api/apollo";
import { refreshAccessToken, retrieveUserSession } from "../encrypted-storage/functions";

const GET_STARRED_BILLS = gql`
  query GetStarredBills(
    $after: String,
    $first: Int,
    $access_token: String,
    ) {
    getStarredBills(
        after: $after,
        first: $first,
        accessToken: $access_token,
    ) {
    edges {
      node {
        id
        isAiGenerated
        originDate
        latestAction
        title
        summary
        subjects {
          name
        }
        status
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
  }
`;

let tokenRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export function useGetStarredBills(after?: string, first?: number) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await retrieveUserSession();
        if (mounted) setSession(s);
      } catch (err) {
        console.error("retrieveUserSession error", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { data, loading, error, refetch, fetchMore } = useQuery(GET_STARRED_BILLS, {
    variables: { after, first, access_token: session?.accessToken },
    client,
    skip: !session,
  });

  // Helper to ensure only one refresh runs at a time and return the new token
  const ensureRefreshed = async () => {
    if (tokenRefreshing && refreshPromise) return refreshPromise;
    tokenRefreshing = true;
    refreshPromise = (async () => {
      try {
        const newToken = await refreshAccessToken();
        const newSession = await retrieveUserSession();
        setSession(newSession);
        return newToken;
      } finally {
        tokenRefreshing = false;
      }
    })();
    return refreshPromise;
  };

  // Attempt to refresh+retry once if the query returned an auth-related error
  const retriedRef = useRef(false);
  if (error) {
    const messages = (error.errors || []).map((e: any) => e.message || '').join(' ');
    const combined = `${messages} ${error.message || ''}`;
    const isAuthError = /Invalid access token|user not found/i.test(combined);
    if (isAuthError && !retriedRef.current) {
      retriedRef.current = true;
      (async () => {
        try {
          const newToken = await ensureRefreshed();
          if (refetch) {
            await refetch({ after, first, access_token: newToken });
          }
        } catch (err) {
          console.error('Token refresh+refetch failed', err);
        }
      })();
    } else if (!isAuthError) {
      console.error('useGetStarredBills error:', error);
    }
  }
  const bills = data?.getStarredBills ?? { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
  const pageInfo = bills.pageInfo ?? { endCursor: null, hasNextPage: false };

  const [loadingMore, setLoadingMore] = useState(false);
  const lastLoadRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 700;

  const loadMore = async () => {
    if (loadingMore || !pageInfo?.hasNextPage) return;
    const now = Date.now();
    if (lastLoadRef.current && now - lastLoadRef.current < DEBOUNCE_MS) return;
    lastLoadRef.current = now;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          after: pageInfo.endCursor,
          first,
          access_token: session?.accessToken,
        },
        updateQuery: (prev: any, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) return prev;
          return {
            ...fetchMoreResult,
            getStarredBills: {
              ...fetchMoreResult.getStarredBills,
              edges: [
                ...prev.getStarredBills.edges,
                ...fetchMoreResult.getStarredBills.edges,
              ],
            },
          };
        },
      });
    } catch (error :any) {
      // If it's an auth error, try refreshing token once and retry fetchMore
    const messages = (error.errors || []).map((e: any) => e.message || '').join(' ');
    const combined = `${messages} ${error.message || ''}`;
    const isAuthError = /Invalid access token|user not found/i.test(combined);
      if (isAuthError) {
        try {
          const newToken = await ensureRefreshed();
          await fetchMore({
            variables: {
              after: pageInfo.endCursor,
              first,
              access_token: newToken,
            },
            updateQuery: (prev: any, { fetchMoreResult }: any) => {
              if (!fetchMoreResult) return prev;
              return {
                ...fetchMoreResult,
                getStarredBills: {
                  ...fetchMoreResult.getStarredBills,
                  edges: [
                    ...prev.getStarredBills.edges,
                    ...fetchMoreResult.getStarredBills.edges,
                  ],
                },
              };
            },
          });
        } catch (error2) {
          console.error('loadMore retry error', error2);
        }
      } else {
        console.error('loadMore error', error);
      }
    } finally {
      setLoadingMore(false);
      lastLoadRef.current = Date.now();
    }
  };

  return {
    bills,
    pageInfo,
    hasNextPage: !!pageInfo?.hasNextPage,
    loading,
    error,
    refetch,
    loadMore,
    loadingMore,
  };
}

export default useGetStarredBills;