import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { client } from "../api/apollo";

const GET_BILLS_BY_KEYWORD = gql`
  query GetBillsByKeyword(
    $after: String,
    $bill_type: String,
    $congress_num: Int,
    $first: Int,
    $keyword: String
    $sort: String = ""
    ) {
    getBillsByKeyword(
        after: $after,
        billType: $bill_type,
        congressNum: $congress_num,
        first: $first,
        keyword: $keyword
        sort: $sort
    ) {
    edges {
      node {
        id
        isAiGenerated
        originDate
        latestAction
        title
        subjects {
          name
        }
        status
        statusCode
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

export function useGetBillsByKeyword(after?: string, bill_type?: string, first?: number, congress_num?: number, keyword?: string, sort?: string) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_BILLS_BY_KEYWORD, {
    variables: { after, bill_type, first, congress_num, keyword, sort },
    client,
  });

  if (error) {
    console.error("useGetBillsByKeyword error:", error);
  }

  const bills = data?.getBillsByKeyword ?? { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
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
          keyword,
          sort,
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

export default useGetBillsByKeyword;
