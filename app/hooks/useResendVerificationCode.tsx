import { useEffect, useState } from "react";

type VerifyData = {
  detail:string;
};

type VerifyError = Record<string, string[]> | null;

export function useResendVerificationCode(email: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerifyData | null>(null);
  const [errors, setErrors] = useState<VerifyError | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  const resend = async (email: string) => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Verification failed"] };
    try {
      const res = await fetch("https://www.usquery.com/api/auth/resend-verification/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email : email }),
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
    resend(email);
  }, [email]);


  return {
    resend,
    ok,
    loading,
    data,
    errors,
  } as const;
}

export default useResendVerificationCode;
