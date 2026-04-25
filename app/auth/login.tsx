import React, { useCallback, useContext, useEffect, useState } from "react";
import AppleSignInButton from "../components/AppleSignInButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeUserSession, retrieveUserSession, storeUserSession } from "../encrypted-storage/functions";
import { authRequest } from "../hooks/authRequest";
import { useAppleSignIn } from "../hooks/useAppleSignIn";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { useLogin } from "../hooks/useLogin";
import { useFavoritesStore } from "../store/favoriteSubjectsStore";
import { useStarredBillsStore } from "../store/starredBillsStore";
import { useStarredMembersStore } from "../store/starredMembersStore";
import { ThemeContext } from '../theme/themeContext';

interface LoginProps {
  navigation: any;
}
const numToAccountType = (num: number) => {
  switch(num) {
    case 0: return "Free";
    case 1: return "Premium";
    case 2: return "Congressional";
    default: return "Custom";
  }
};

export default function Login({ navigation }: LoginProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const {login, ok, loading, data, errors : loginErrors} = useLogin();
  const { signIn: googleSignIn, loading: googleLoading, ok: googleOk, data: googleData, errors: googleErrors } = useGoogleSignIn();
  const { signIn: appleSignIn, loading: appleLoading, ok: appleOk, data: appleData, errors: appleErrors } = useAppleSignIn();
  const [userSession, setUserSession] = useState<null | { refreshToken?: string; accessToken?: string; email?: string; isVerified?: boolean }>(null);
  const setFavorites = useFavoritesStore(s => s.setFavorites);
  const setStarrMem = useStarredMembersStore(s => s.setStars);
  const setStarrBills = useStarredBillsStore(s => s.setStars);
  const clearFavorites = useFavoritesStore(s => s.clearFavorites);
  const clearStarrMem = useStarredMembersStore(s => s.clearStars);
  const clearStarrBills = useStarredBillsStore(s => s.clearStars);
  const setLoggedIn = useFavoritesStore(s => s.setIsLoggedIn);
  
  useEffect(() => {
    let mounted = true;
    retrieveUserSession()
      .then((s:any) => {
        if (mounted) setUserSession(s);
      })
      .catch((err) => console.error("Error loading user session:", err));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (googleOk && googleData) {
      handleAuthSuccess(googleData, true);
    }
  }, [googleOk, googleData]);

  useEffect(() => {
    if (appleOk && appleData) {
      handleAuthSuccess(appleData, true);
    }
  }, [appleOk, appleData]);

  useEffect(() => {
    const oauthErrs: string[] = [];
    if (googleErrors) {
      for (const key in googleErrors) {
        if (Array.isArray(googleErrors[key])) {
          googleErrors[key].forEach((msg: string) => oauthErrs.push(`Google: ${msg}`));
        } else {
          oauthErrs.push(`Google: ${googleErrors[key]}`);
        }
      }
    }
    if (appleErrors) {
      for (const key in appleErrors) {
        if (Array.isArray(appleErrors[key])) {
          appleErrors[key].forEach((msg: string) => oauthErrs.push(`Apple: ${msg}`));
        } else {
          oauthErrs.push(`Apple: ${appleErrors[key]}`);
        }
      }
    }
    if (oauthErrs.length > 0) {
      setErrors(oauthErrs);
    }
  }, [googleErrors, appleErrors]);

  const handleAuthSuccess = async (authData: any, isOAuth = false) => {
    await storeUserSession(authData.email, authData.access, authData.refresh, authData.is_verified);
    if (!isOAuth && !authData.is_verified) {
      navigation.navigate("Verify", { email: authData.email, fromLogin: true });
      return;
    }
    setLoggedIn(true);
    try {
      const userPrefs = await authRequest("notif/get-preferences/");
      setFavorites(userPrefs.subject_ids);
      setStarrMem(userPrefs.membership_ids.map((id: any) => String(id)));
      setStarrBills(userPrefs.bill_ids.map((id: any) => String(id)));
    } catch (prefErr) {
      console.error("Failed to load user preferences:", prefErr);
      // Proceed; preferences are optional and shouldn't block login
    }
    const message = isOAuth && authData.is_new_user ? "Account created and logged in" : "You are now logged in from this device.";
    Alert.alert("Success", message, [
      {
        text: "Continue",
        onPress: () => navigation.navigate("Bill_FYP"),
      },
    ]);
  };

  const onSubmit = async() => {
    try {
      const result = await login(email, password);
      if (result.ok && result.data) {
        await handleAuthSuccess(result.data);
      } else {
        const errs: string[] = [];
        const source = result.errors ?? loginErrors ?? {};
        for (const key in source) {
          // @ts-ignore -- source may be null or different shapes
          if (Array.isArray(source[key])) {
            // @ts-ignore
            source[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
          } else {
            // @ts-ignore
            errs.push(`${key}: ${source[key]}`);
          }
        }
        setErrors(errs);
        return;
      }
    } catch (err:any) {
      console.error("Login flow error:", err);
      Alert.alert("Login error", err?.message ?? "Network or unexpected error occurred.");
    }
  };
  const handleOpenLink = useCallback((url?: string) => {
    if (!url) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(normalized).catch(() => {});
  }, []);

  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  useEffect(() => {
    const fetchDetails = async () => {
      if (userSession === null) return;
      try {
        const result = await authRequest("auth/view-details/");
        setUserDetails(result);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [userSession]);
  if (userSession != null) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>You are already logged in!</Text>
        <Pressable style={styles.button} onPress={ async () => {
          Alert.alert("Log out?", "You are about to log out of " + userSession.email, [
            {
              text: "Continue",
              onPress: async () => {
                  if (userSession?.refreshToken) {
                    await authRequest("auth/token/blacklist/", { method: "POST", body: JSON.stringify({ refresh: userSession.refreshToken }) });
                  }
                  await removeUserSession();
                  clearFavorites();
                  clearStarrMem();
                  clearStarrBills();
                  setUserSession(null);
                  setLoggedIn(false);
                  navigation.navigate("Login");
                },
            },
            { text: "Cancel",
              onPress: () => {
                return;
              }
            },
          ]);
        }}>
          <Text style={styles.buttonText}>Log out of {userSession.email}?</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handleOpenLink('www.usquery.com/api/auth/delete/')} >
          <Text style={[styles.buttonText, {}]}>Delete my account</Text>
        </Pressable>
        <View style={styles.card}>
          {detailsLoading ? (<ActivityIndicator />): (
            <>
            <Text style={styles.label}>Account Details</Text>
            <Text style={styles.text}>• Account Type: {numToAccountType(userDetails?.user_type ?? 0)}</Text>
            <Text style={styles.text}>• Starred Bill Limit: {userDetails?.bill_limit ?? "N/A"}</Text>
            <Text style={styles.text}>• Starred Member Limit: {userDetails?.member_limit ?? "N/A"}</Text>
            <Text style={styles.text}>• Device Limit: {userDetails?.device_limit ?? "N/A"}</Text>
            </>
            )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Enter your credentials</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(t) => setEmail(t.trim().toLowerCase())}
        placeholder="you@example.com"
        placeholderTextColor={theme.subtext}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        placeholderTextColor={theme.subtext}
      />


      {errors.length > 0 && (
        <View style={styles.errorBox}>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>
              • {e}
            </Text>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Logging in...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </Pressable>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>or</Text>
      </View>

      <GoogleSignInButton onPress={googleSignIn} loading={googleLoading} />

      <AppleSignInButton onPress={appleSignIn} loading={appleLoading} display={false} />

      <Pressable style={styles.button} onPress={() => navigation.navigate("Reset_Password")}>
        <Text style={styles.buttonText}>Reset your password</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.buttonText}>Register a new account</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({ 
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: '24%',
    backgroundColor: theme.background,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: theme.text,
  },
  text: {
    fontSize: 12,
    marginBottom: 6,
    color: theme.text,
  },
  input: {
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    minHeight: 50,
    marginBottom: 20,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    color: theme.innerText,
    fontWeight: "600",
  },
  divider: {
    alignItems: "center",
    marginVertical: 10,
  },
  dividerText: {
    color: theme.subtext,
    fontSize: 14,
  },
  errorBox: {
    marginBottom: 12,
    backgroundColor: theme.secondary,
    borderRadius: 6,
    borderColor: theme.border,
    borderWidth: 1,
    padding: 10,
  },
  errorText: {
    color: theme.text,
    fontSize: 13,
  },
  card: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
});
