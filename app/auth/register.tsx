import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppleSignInButton from "../components/AppleSignInButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { storeUserSession } from "../encrypted-storage/functions";
import { authRequest } from "../hooks/authRequest";
import { useAppleSignIn } from "../hooks/useAppleSignIn";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { useRegister } from "../hooks/useRegister";
import { useFavoritesStore } from "../store/favoriteSubjectsStore";
import { useStarredBillsStore } from "../store/starredBillsStore";
import { useStarredMembersStore } from "../store/starredMembersStore";
import { ThemeContext } from "../theme/themeContext";

interface RegisterProps {
  navigation: any;
}

export default function RegisterAccount({ navigation}: RegisterProps) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  const scrollRef = useRef<ScrollView | null>(null);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { register, ok, loading, data, errors: registerErrors } = useRegister(email,password);
  const { signIn: googleSignIn, loading: googleLoading, ok: googleOk, data: googleData, errors: googleErrors } = useGoogleSignIn();
  const { signIn: appleSignIn, loading: appleLoading, ok: appleOk, data: appleData, errors: appleErrors } = useAppleSignIn();
  const setFavorites = useFavoritesStore(s => s.setFavorites);
  const setStarrMem = useStarredMembersStore(s => s.setStars);
  const setStarrBills = useStarredBillsStore(s => s.setStars);
  const setLoggedIn = useFavoritesStore(s => s.setIsLoggedIn);

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);
  const isStrongPassword = (p: string) => {
    return (
      p.length >= 8 &&
      /[A-Z]/.test(p) &&
      /[a-z]/.test(p) &&
      /[0-9]/.test(p) &&
      /[^A-Za-z0-9]/.test(p)
    );
  };
  const validate = () => {
    const errs: string[] = [];
    if (!isValidEmail(email)) errs.push("Enter a valid email address.");
    if (email !== emailConfirm) errs.push("Email addresses do not match.");
    if (!isStrongPassword(password))
      errs.push(
        "Password must be 8+ chars, include upper/lowercase, a number and a symbol."
      );
    if (password !== passwordConfirm) errs.push("Passwords do not match.");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleAuthSuccess = async (authData: any, isOAuth = false) => {
    await storeUserSession(authData.email, authData.access, authData.refresh, authData.is_verified);
    if (!authData.is_verified) {
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
    }
    const message = isOAuth && authData.is_new_user ? "Account created and logged in" : "You are now logged in from this device.";
    Alert.alert("Success", message, [
      {
        text: "Continue",
        onPress: () => navigation.navigate("Bill_FYP"),
      },
    ]);
  };

  useEffect(() => {
    if (errors.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [errors]);

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

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      await register(email, password);

      if (ok) {
        Alert.alert("Registration", "Verification code sent to your email.", [
          {
            text: "Continue",
            onPress: () => navigation.navigate("Verify", { email: email }),
          },
        ]);
      } else {
        const errs = [];
        for (const key in registerErrors) {
          if (Array.isArray(registerErrors[key])) {
            registerErrors[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
          } else {
            errs.push(`${key}: ${registerErrors[key]}`);
          }
        }
        setErrors(errs);
        return;
      }
    } catch (err) {
      Alert.alert("Registration error", "Network or unexpected error occurred.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />

        <Text style={styles.label}>Confirm Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={emailConfirm}
          onChangeText={setEmailConfirm}
          placeholder="you@example.com"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Choose a password"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="Repeat password"
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

        <Pressable style={styles.button} onPress={onSubmit}>
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>or</Text>
        </View>

        <GoogleSignInButton onPress={googleSignIn} loading={googleLoading} label="Sign up with Google" />

        <AppleSignInButton onPress={appleSignIn} loading={appleLoading} label="Sign up with Apple" display={false} />
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 12,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
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
});