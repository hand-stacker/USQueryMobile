import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { client } from "../api/apollo";

const GET_RECENT_VOTES = gql`
  query GetVotes(
    $after: String,
    $bill_type: String,
    $congress_num: Int,
    $first: Int,
    $subject_list: [Int!]
    ) {
    getRecentVotes(
        after: $after,
        billType: $bill_type,
        congressNum: $congress_num,
        first: $first,
        subjectList: $subject_list
    ) {
    edges {
      node {
        dateTime
        id
        result
        bill {
          id
        }
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

export function useGetRecentVotes(after?: string, bill_type?: string, first?: number, congress_num?: number, subject_list?: number[]) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_RECENT_VOTES, {
    variables: { after, bill_type, first, congress_num, subject_list },
    client,
  });

  if (error) {
    console.error("useGetRecentVotes error:", error);
  }
  const votes = data?.getRecentVotes ?? { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
  const pageInfo = votes.pageInfo ?? { endCursor: null, hasNextPage: false };

  const [loadingMore, setLoadingMore] = useState(false);
  const lastLoadRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 700;

  const loadMore = async () => {
    if (loadingMore || !pageInfo.hasNextPage) return;
    const now = Date.now();
    if (lastLoadRef.current && now - lastLoadRef.current < DEBOUNCE_MS) {
      return;
    }
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          after: pageInfo.endCursor,
          bill_type,
          first,
          congress_num,
          subject_list,
        },
        updateQuery: (prev : any, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) return prev;
          return {
            ...fetchMoreResult,
            getRecentVotes: {
              ...fetchMoreResult.getRecentVotes,
              edges: [
                ...prev.getRecentVotes.edges, 
                ...fetchMoreResult.getRecentVotes.edges
              ],
            },
          };
        },
      });
    } catch (err) {
      console.error('loadMore error', err);
    } finally {
      setLoadingMore(false);
      lastLoadRef.current = now;
    }
  };

  return {
    votes,
    pageInfo,
    hasNextPage: !!pageInfo?.hasNextPage,
    loading,
    error,
    refetch,
    loadMore,
    loadingMore,
  };
}

export default useGetRecentVotes;