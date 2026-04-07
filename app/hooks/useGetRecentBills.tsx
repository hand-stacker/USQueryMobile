import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { client } from "../api/apollo";

const GET_RECENT_BILLS = gql`
  query GetRecommendedBills(
    $after: String,
    $bill_type: String,
    $congress_num: Int,
    $first: Int,
    $subject_list: [Int!]
    $truncate: Boolean! = false
    ) {
    getRecommendedBills(
        after: $after,
        billType: $bill_type,
        congressNum: $congress_num,
        first: $first,
        subjectList: $subject_list,
        truncate: $truncate
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

export function useGetRecentBills(after?: string, bill_type?: string, first?: number, congress_num?: number, subject_list?: number[], truncate: boolean = false) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_RECENT_BILLS, {
    variables: { after, bill_type, first, congress_num, subject_list, truncate },
    client,
  });

  if (error) {
    console.error("useGetRecentBills error:", error);
  }

  const bills = data?.getRecommendedBills ?? { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
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
          bill_type,
          first,
          congress_num,
          subject_list,
          truncate,
        },
        updateQuery: (prev: any, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) return prev;
          return {
            ...fetchMoreResult,
            getRecommendedBills: {
              ...fetchMoreResult.getRecommendedBills,
              edges: [
                ...prev.getRecommendedBills.edges,
                ...fetchMoreResult.getRecommendedBills.edges,
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

export default useGetRecentBills;
