import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppleSignInButton from "../components/AppleSignInButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { removeUserSession, retrieveUserSession, storeUserSession } from "../encrypted-storage/functions";
import { authRequest } from "../hooks/authRequest";
import { openStripeUrl } from "../hooks/openStripeUrl";
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

export default function Login({ navigation }: LoginProps) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
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
    setUserSession({ email: authData.email, refreshToken: authData.refresh, accessToken: authData.access, isVerified: authData.is_verified });
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
        text: "Ok",
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

  const [userDetails, setUserDetails] = useState<any>(null);
  const [planLimits, setPlanLimits] = useState<{ predictions: number | null; chat: number | null } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const result = await authRequest("subscription/portal/", { method: "POST" });
      if (result.portal_url) {
        // In-app browser that returns to the app via the deep link rather than
        // stranding the user on the logged-out web manage page.
        await openStripeUrl(result.portal_url);
      } else {
        Alert.alert("Error", result.error ?? "Could not open billing portal.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };
  useEffect(() => {
    const fetchDetails = async () => {
      if (userSession === null) return;
      try {
        const [status, plans] = await Promise.all([
          authRequest("subscription/status/"),
          authRequest("subscription/plans/").catch(() => null),
        ]);
        setUserDetails(status);
        if (plans?.tiers && status?.tier != null) {
          const tierEntry = plans.tiers.find((t: any) => t.id === status.tier);
          if (tierEntry) {
            setPlanLimits({ predictions: tierEntry.predictions_per_day, chat: tierEntry.chat_messages_per_day });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [userSession]);
  if (userSession != null) {
    const tier: number = userDetails?.tier ?? 0;
    const hasPaidPlan = tier > 0;
    const predictionsText: string | null = (() => {
      if (tier === 0) return null;
      if (!planLimits) return tier === 1 ? "10/day" : "Unlimited";
      if (planLimits.predictions === 0) return null;
      if (planLimits.predictions === null) return "Unlimited";
      return `${planLimits.predictions}/day`;
    })();
    const chatText: string | null = (() => {
      if (tier === 0) return null;
      if (!planLimits) return tier === 1 ? "10/day" : "7.5M tokens/mo";
      if (planLimits.chat === 0) return null;
      if (planLimits.chat === null) return tier >= 2 ? "7.5M tokens/mo" : "Unlimited";
      return `${planLimits.chat}/day`;
    })();
    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Negative margin + matching content padding keeps the card's side
            shadows from being clipped at the scroll view's edges. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ marginHorizontal: -12 }}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          <Text style={styles.title}>Manage Subscription</Text>

          <View style={styles.card}>
            {detailsLoading ? (
              <ActivityIndicator style={{ paddingVertical: 24 }} />
            ) : (
              <>
                {/* ── Current Plan ── */}
                <Text style={styles.sectionLabel}>CURRENT PLAN</Text>
                <Text style={styles.planName}>{userDetails?.tier_name ?? "Free"}</Text>

                <View style={styles.sectionDivider} />

                {/* ── Billing Status ── */}
                <Text style={styles.sectionLabel}>BILLING STATUS</Text>
                {userDetails?.cancel_at_period_end && userDetails?.period_end ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠ Cancels at end of billing period on {fmtDate(userDetails.period_end)}
                    </Text>
                    <Text style={styles.warningSubtext}>
                      You'll keep access until that date. After that your account reverts to Free.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.statusText}>
                      {hasPaidPlan ? "Active subscription" : "Free plan"}
                    </Text>
                    {hasPaidPlan && userDetails?.period_end && (
                      <Text style={styles.nextBillingText}>
                        Next billing date: {fmtDate(userDetails.period_end)}
                      </Text>
                    )}
                  </>
                )}

                <View style={styles.sectionDivider} />

                {/* ── Limits grid ── */}
                <Text style={styles.sectionLabel}>YOUR LIMITS</Text>
                <View style={styles.limitRow}>
                  <LimitCell value={String(userDetails?.starred_members_limit ?? "—")} label="Starred Members" theme={theme} />
                  <LimitCell value={String(userDetails?.starred_bills_limit ?? "—")} label="Starred Bills" theme={theme} />
                </View>
                <View style={[styles.limitRow, { marginTop: 8 }]}>
                  <LimitCell value={predictionsText ?? "—"} label="Predictions" dim={!predictionsText} theme={theme} />
                  <LimitCell value={chatText ?? "—"} label="AI Chats" dim={!chatText} theme={theme} />
                </View>

                <View style={styles.sectionDivider} />

                {/* ── Actions ── */}
                <View style={styles.actionRow}>
                  <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => navigation.navigate("Plans")}>
                    <Text style={[styles.actionBtnText, { color: theme.innerText }]}>View All Plans</Text>
                  </Pressable>
                  {hasPaidPlan && (
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnPrimary, portalLoading && { opacity: 0.7 }]}
                      onPress={openPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={[styles.actionBtnText, { color: theme.innerText }]}>Billing Portal</Text>}
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>

          <Pressable style={[styles.button, { marginTop: 4 }]} onPress={async () => {
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
              { text: "Cancel", onPress: () => {} },
            ]);
          }}>
            <Text style={styles.buttonText}>Log out of {userSession.email}?</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => handleOpenLink("www.usquery.com/api/auth/delete/")}>
            <Text style={styles.buttonText}>Delete my account</Text>
          </Pressable>
        </ScrollView>
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

      <AppleSignInButton onPress={appleSignIn} loading={appleLoading} display={Platform.OS === 'ios'} />

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

function LimitCell({ value, label, dim, theme }: { value: string; label: string; dim?: boolean; theme: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.secondary, borderRadius: 10, padding: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: dim ? theme.subtext : theme.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 4, textAlign: 'center', fontWeight: '400' }}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
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
    fontWeight: '400',
  },
  text: {
    fontSize: 12,
    marginBottom: 6,
    color: theme.text,
    fontWeight: '400',
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
    maxWidth: 480,
    alignSelf: 'center',
    minHeight: 50,
    marginBottom: 20,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: '400',
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
    fontWeight: '400',
  },
  card: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  // ── Manage Subscription card styles ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.subtext,
    marginBottom: 6,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
    opacity: 0.5,
  },
  statusText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '400',
  },
  nextBillingText: {
    fontSize: 12,
    color: theme.subtext,
    marginTop: 4,
    fontWeight: '400',
  },
  warningBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
  },
  warningSubtext: {
    color: theme.subtext,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '400',
  },
  limitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionBtnPrimary: {
    backgroundColor: theme.primary,
  },
  actionBtnSecondary: {
    backgroundColor: theme.accent,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
