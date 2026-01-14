import { useEffect, useState } from "react";

type LoginData = {
  access:string;
  refresh:string;
  is_verified: boolean;
  email: string;
  user_id?: number;
};

type LoginError = Record<string, string[]> | null;

export function useLogin(email: string, password: string) {
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
    try {
      const res = await fetch("https://usquery.com/api/auth/login/", {
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
      }
      if (!res.ok) {
        if (json && typeof json === "object") {
          setErrors(json as LoginError);
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
    login(email, password);
  }, [email, password]);


  return {
    login,
    ok,
    loading,
    data,
    errors,
  } as const;
}

export default useLogin;
