import { useCallback, useEffect, useState } from "react";

interface UseGetMembershipsResult {
  members: any | null;
  loading: boolean;
  error: Error | null;
  refetch: (mem_list: string[] | Number[]) => void;
}

export function useGetMemberships(mem_list : string[] | Number[]): UseGetMembershipsResult {
  const [members, setMembers] = useState<any | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = async(mem_list: string[] | Number[])=> {
    if (!mem_list || (Array.isArray(mem_list) && mem_list.length === 0)) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }
    const ids = Array.isArray(mem_list) ? mem_list.join(',') : String(mem_list);
    const url = `https://www.usquery.com/api/v1.0/memberships?membershipIds=${ids}&format=json`;
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
    fetchMembers(mem_list);
  }, [mem_list]);

  const refetch = useCallback((mem_list: string[] | Number[]) => fetchMembers(mem_list), [mem_list]);

  return { members, loading, error, refetch };
}

export default useGetMemberships;
