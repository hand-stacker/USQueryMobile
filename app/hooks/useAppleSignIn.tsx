import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { Alert } from "react-native";

type OAuthData = {
  access: string;
  refresh: string;
  is_verified: boolean;
  email: string;
  user_id?: number;
  is_new_user?: boolean;
};

type OAuthError = Record<string, string[]> | null;

const SIGN_IN_TIMEOUT_MS = 15_000;

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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Apple sign-in timed out. Please try again.")),
          SIGN_IN_TIMEOUT_MS
        )
      );
      const credential = await Promise.race([
        AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        }),
        timeoutPromise,
      ]);
      const identityToken = credential.identityToken;
      const email = credential.email;
      if (!identityToken) {
        throw new Error("No identity token received from Apple.");
      }
      const res = await fetch("https://www.usquery.com/api/auth/oauth/apple/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity_token: identityToken, email: email ?? null }),
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
        Alert.alert("Sign In Failed", "Could not sign in with Apple. Please try again.");
      }
    } catch (error: any) {
      if (error?.code === "ERR_CANCELED") {
        return { ok: false, data: null, errors: null };
      }
      console.error("Apple sign-in error:", error);
      Alert.alert("Sign In Failed", error?.message ?? "Apple sign-in failed. Please try again.");
      setErrors(fallback);
      resultErrors = fallback;
    } finally {
      setLoading(false);
    }
    return { ok: resultOk, data: resultData, errors: resultErrors };
  };

  return { signIn, loading, data, errors, ok };
}
