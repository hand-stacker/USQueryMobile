import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";

type OAuthData = {
  access: string;
  refresh: string;
  is_verified: boolean;
  email: string;
  user_id?: number;
  is_new_user?: boolean;
};

type OAuthError = Record<string, string[]> | null;

export function useAppleSignIn() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OAuthData | null>(null);
  const [errors, setErrors] = useState<OAuthError | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  const signIn = async () => {
    setLoading(true);
    setErrors(null);
    setData(null);
    setOk(false);
    const fallback = { error: ["Apple sign-in failed"] };
    let resultOk = false;
    let resultData: OAuthData | null = null;
    let resultErrors: OAuthError | null = null;
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const identityToken = credential.identityToken;
      const email = credential.email;
      if (!identityToken) {
        throw new Error("No identity token received");
      }
      const res = await fetch("https://www.usquery.com/api/auth/oauth/apple/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity_token: identityToken, email: email }),
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
      console.error("Apple sign-in error:", error);
      setErrors(fallback);
      resultErrors = fallback;
    } finally {
      setLoading(false);
    }
    return { ok: resultOk, data: resultData, errors: resultErrors };
  };

  return { signIn, loading, data, errors, ok };
}