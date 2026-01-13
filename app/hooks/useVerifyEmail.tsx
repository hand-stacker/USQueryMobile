import { useEffect, useState } from "react";

type VerifyData = {
  detail:string;
};

type VerifyError = Record<string, string[]> | null;

export function useVerifyEmail(email: string, code: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerifyData | null>(null);
  const [errors, setErrors] = useState<VerifyError | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  const verifyEmail = async (email: string, code: string) => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Verification failed"] };
    try {
      const res = await fetch("https://usquery.com/api/auth/verify-email/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email : email, code: code }),
      });

      // API returns {detail: "..."} no matter if error or success
      const json = await res.json();
      if (res.ok) {
        setData(json as VerifyData);
        setOk(true);
      }
      if (!res.ok) {
        if (json && typeof json === "object") {
          setErrors(json as VerifyError);
        }
        else {
          setErrors(fallback);
        }
      }

    } catch (e: any) {
      setErrors(fallback);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    verifyEmail(email, code);
  }, [email, code]);


  return {
    verifyEmail,
    ok,
    loading,
    data,
    errors,
  } as const;
}

export default useVerifyEmail;
