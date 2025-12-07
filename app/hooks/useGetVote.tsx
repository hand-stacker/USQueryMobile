import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { client } from "../api/apollo";

const GET_VOTE = gql`
  query GetVote($vote_id: Int!) {
    getVote(voteId: $vote_id) {
        bill {
            id
        }
        dateTime
        nays {
            id
            member {
                fullName
                imageLink
            }
            party
            state
            geoid
            house
            districtNum
        }
        novt {
            id
            member {
                fullName
                imageLink
            }
            party
            state
            geoid
            house
            districtNum
        }
        pres {
            id
            member {
                fullName
                imageLink
            }
            party
            state
            geoid
            house
            districtNum
        }
        yeas {
            id
            member {
                fullName
                imageLink
            }
            party
            state
            geoid
            house
            districtNum
        }
        question
        title
        result
    }
  }
`;

export function useGetVote(vote_id: number) {
  const { data, loading, error, refetch } = useQuery(GET_VOTE, {
    variables: { vote_id },
    client,
  });

  if (error) {
    console.error("useGetVote error:", error);
  }
  console.log(data);
  return {
    // idk how to get rid of red underline, we expect this to be possibly undefined
    bills: data?.getVote ?? { edges: [], pageInfo: [] },
    loading,
    error,
    refetch,
  };
}

export default useGetVote;