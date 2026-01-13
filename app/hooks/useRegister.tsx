import { useEffect, useState } from "react";

type RegisterData = {
  status?: string;
  email?: string;
  [key: string]: any;
};

type RegisterErrors = Record<string, string[]> | null;

export function useRegister(email: string, password: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RegisterData | null>(null);
  const [errors, setErrors] = useState<RegisterErrors>(null);
  const [ok, setOk] = useState<boolean>(false);
  const register = async (email: string, password: string) => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Registration failed"] };

    try {
      const res = await fetch("https://usquery.com/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email : email, password  : password }),
      });

      const json = await res.json();

      if (res.ok) {
        setOk(true);
        setData(json as RegisterData);
      }
      if (!res.ok) {
        // API returns validation errors as an object of arrays (e.g. { email: [..] })
        if (json && typeof json === "object") {
          setErrors(json as RegisterErrors);
        } else {
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
      register(email, password);
    }, [email, password]);

  return {
    register,
    ok,
    loading,
    data,
    errors,
  } as const;
}

export default useRegister;
