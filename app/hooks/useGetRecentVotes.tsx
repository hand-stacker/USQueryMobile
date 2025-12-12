import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { client } from "../api/apollo";

const GET_RECENT_VOTES = gql`
  query GetBill($after: String, $first: Int, $subject_list: [Int!]) {
    getRecentVotes(after: $after, first: $first, subjectList: $subject_list) {
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

export function useGetRecentVotes(after?: string, first?: number, subject_list?: number[]) {
  const { data, loading, error, refetch } = useQuery(GET_RECENT_VOTES, {
    variables: { after, first, subject_list },
    client,
  });

  if (error) {
    console.error("useGetRecentVotes error:", error);
  }
  return {
    // idk how to get rid of red underline, we expect this to be possibly undefined
    bills: data?.getRecentVotes ?? { edges: [], pageInfo: [] },
    loading,
    error,
    refetch,
  };
}

export default useGetRecentVotes;