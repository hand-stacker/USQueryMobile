import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { client } from "../api/apollo";

const GET_BILL = gql`
  query GetBill($bill_id: Int!) {
    getBills(billId: $bill_id) {
        isAiGenerated
        latestAction
        summary
        title
        originDate
        policyArea
        actions {
            text
            actionDate
        }
        status
        subjects {
            name
        }
    }
  }
`;

export function useGetBill(bill_id: number) {
  const { data, loading, error, refetch } = useQuery(GET_BILL, {
    variables: { bill_id },
    client,
  });

  if (error) {
    console.error("useGetBill error:", error);
  }
  console.log(data);
  return {
    // idk how to get rid of red underline, we expect this to be possibly undefined
    bills: data?.getBill ?? { edges: [], pageInfo: [] },
    loading,
    error,
    refetch,
  };
}

export default useGetBill;