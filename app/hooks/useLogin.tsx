import { useEffect, useState } from "react";

type LoginData = {
  access:string;
  refresh:string;
  is_verified: boolean;
  email: string;
  user_id?: number;
};

type LoginError = Record<string, string[]> | null;

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LoginData | null>(null);
  const [errors, setErrors] = useState<LoginError | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Login failed"] };
    let resultOk = false;
    let resultData: LoginData | null = null;
    let resultErrors: LoginError | null = null;
    try {
      const res = await fetch("https://www.usquery.com/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email : email, password: password }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json as LoginData);
        setOk(true);
        resultOk = true;
        resultData = json as LoginData;
      }
      if (!res.ok) {
        if (json && typeof json === "object") {
          setErrors(json as LoginError);
          resultErrors = json as LoginError;
        }
        else {
          setErrors(fallback);
          resultErrors = fallback;
        }
      }

    } catch (e: any) {
      setErrors(fallback);
      resultErrors = fallback;
    } finally {
      setLoading(false);
      return { ok: resultOk, data: resultData, errors: resultErrors };
    }
  };
  // The hook no longer auto-runs login when email/password change.
  // Callers should invoke `login(email, password)` explicitly (e.g. on form submit).
  return {
    login,
    ok,
    loading,
    data,
    errors,
  } as const;
}

export default useLogin;
