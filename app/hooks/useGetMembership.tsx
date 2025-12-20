import { useCallback, useEffect, useState } from "react";

interface UseGetMembershipResult {
  member: any | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGetMembership(membershipId?: string): UseGetMembershipResult {
  const [member, setMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchMember = async(membershipId: any)=> {
    if (!membershipId) {
      setMember(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    const url = `https://www.usquery.com/api/v1.0/membership-by-id/${membershipId}?format=json`;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      setMember(json);
    } catch (err: any) {
      setError(err);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMember(membershipId);
  }, [membershipId]);

  const refetch = useCallback(() => fetchMember(membershipId), [membershipId]);

  return { member, loading, error, refetch };
}

export default useGetMembership;
