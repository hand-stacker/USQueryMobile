import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../../constants/auth";

type OAuthData = {
  access: string;
  refresh: string;
  is_verified: boolean;
  email: string;
  user_id?: number;
  is_new_user?: boolean;
};

type OAuthError = Record<string, string[]> | null;

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OAuthData | null>(null);
  const [errors, setErrors] = useState<OAuthError | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const signIn = async () => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Google sign-in failed"] };
    let resultOk = false;
    let resultData: OAuthData | null = null;
    let resultErrors: OAuthError | null = null;
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      if (!idToken) {
        throw new Error("No ID token received");
      }
      const res = await fetch("https://www.usquery.com/api/auth/oauth/google/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: idToken }),
      });
      const json = await res.json();
      if (res.ok) {
        setData(json as OAuthData);
        setOk(true);
        resultOk = true;
        resultData = json as OAuthData;
      } else {
        if (json && typeof json === "object") {
          setErrors(json as OAuthError);
          resultErrors = json as OAuthError;
        } else {
          setErrors(fallback);
          resultErrors = fallback;
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors(fallback);
      resultErrors = fallback;
    } finally {
      setLoading(false);
    }
    return { ok: resultOk, data: resultData, errors: resultErrors };
  };

  return { signIn, loading, data, errors, ok };
}