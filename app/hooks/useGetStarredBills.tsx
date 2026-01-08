import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { client } from "../api/apollo";

const GET_STARRED_BILLS = gql`
  query GetStarredBills(
    $after: String,
    $first: Int,
    $starred_list: [Int!]
    ) {
    getStarredBills(
        after: $after,
        first: $first,
        starredList: $starred_list
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

export function useGetStarredBills(after?: string, first?: number, starred_list?: number[]) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_STARRED_BILLS, {
    variables: { after, first, starred_list },
    client,
  });

  if (error) {
    console.error("useGetStarredBills error:", error);
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
          starred_list,
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
    } catch (err) {
      console.error('loadMore error', err);
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