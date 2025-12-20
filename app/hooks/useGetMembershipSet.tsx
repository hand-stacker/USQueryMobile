import { useCallback, useEffect, useState } from "react";

interface UseGetMembershipSetResult {
  members: any | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGetMembershipSet(congress: number, chamber: string, state: string): UseGetMembershipSetResult {
  const [members, setMembers] = useState<any | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchMembers = async(congress: number, chamber: string, state: string)=> {
    if (!congress || !chamber || !state) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    const url = `https://www.usquery.com/api/v1.0/membership-set/${congress}/${chamber}/${state}?format=json`;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      setMembers(json);
    } catch (err: any) {
      setError(err);
      setMembers(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMembers(congress, chamber, state);
  }, [congress, chamber, state]);

  const refetch = useCallback(() => fetchMembers(congress, chamber, state), [congress, chamber, state]);

  return { members, loading, error, refetch };
}

export default useGetMembershipSet;
