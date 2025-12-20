import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { client } from "../api/apollo";

const GET_SUBJECTS = gql`
  query Subjects{
        getSubjectSet {
        name
        id
        }
    }
`;

export function useGetSubjects() {
  const { data, loading, error, refetch } = useQuery(GET_SUBJECTS, {
    client,
  });

  if (error) {
    console.error("useGetSubjects error:", error);
  }
  return {
    subjects: data?.getSubjectSet ?? [],
    loading,
    error,
    refetch,
  };
}

export default useGetSubjects;