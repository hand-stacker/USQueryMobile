import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { client } from "../api/apollo";

// NOTE: bill_type is a *chamber* filter here, not a bill-type filter:
// '!' = both, 'h' = House, anything else = Senate. Same as getRecentVotes.
// VoteConnection has no `error` member — requesting one fails validation.
// Never request yeas/nays/pres/novt from a list query; they expand to hundreds
// of membership records per vote.
const GET_VOTES_BY_KEYWORD = gql`
  query GetVotesByKeyword(
    $after: String,
    $bill_type: String,
    $congress_num: Int,
    $first: Int,
    $keyword: String!
    $sort: String = ""
    ) {
    getVotesByKeyword(
        after: $after,
        billType: $bill_type,
        congressNum: $congress_num,
        first: $first,
        keyword: $keyword
        sort: $sort
    ) {
    edges {
      cursor
      node {
        id
        title
        question
        dateTime
        result
        bill {
          id
          title
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

export function useGetVotesByKeyword(after?: string, bill_type?: string, first?: number, congress_num?: number, keyword?: string, sort?: string, options?: { skip?: boolean }) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_VOTES_BY_KEYWORD, {
    variables: { after, bill_type, first, congress_num, keyword, sort },
    client,
    skip: options?.skip,
  });

  if (error) {
    console.error("useGetVotesByKeyword error:", error);
  }

  const votes = data?.getVotesByKeyword ?? { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
  const pageInfo = votes.pageInfo ?? { endCursor: null, hasNextPage: false };

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
            getVotesByKeyword: {
              ...fetchMoreResult.getVotesByKeyword,
              edges: [
                ...prev.getVotesByKeyword.edges,
                ...fetchMoreResult.getVotesByKeyword.edges,
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

export default useGetVotesByKeyword;
