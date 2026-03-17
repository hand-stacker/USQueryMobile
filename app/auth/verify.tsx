import React, { useContext, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateVerificationStatus } from "../encrypted-storage/functions";
import { authRequest } from "../hooks/authRequest";
import useResendVerificationCode from "../hooks/useResendVerificationCode";
import { useVerifyEmail } from "../hooks/useVerifyEmail";
import { useFavoritesStore } from "../store/favoriteSubjectsStore";
import { useStarredBillsStore } from "../store/starredBillsStore";
import { useStarredMembersStore } from "../store/starredMembersStore";
import { ThemeContext } from "../theme/themeContext";

interface VerifyProps {
  navigation: any;
  route: any;
}

export default function VerifyEmail({ navigation, route }: VerifyProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const email = route?.params?.email;
  const fromLogin = route?.params?.fromLogin || false;
  const [code, setCode] = useState("");
  const { verifyEmail, ok, loading, data, errors: verifyErrors } = useVerifyEmail(email,code);
  const { resend, ok: resendOk, loading: resendLoading, data: resendData , errors: resendErrors} = useResendVerificationCode(email);
  const setFavorites = useFavoritesStore(s => s.setFavorites);
  const setStarrMem = useStarredMembersStore(s => s.setStars);
  const setStarrBills = useStarredBillsStore(s => s.setStars);
  const setLoggedIn = useFavoritesStore(s => s.setIsLoggedIn);
  const [errors, setErrors] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [resendCount, setResendCount] = useState(0);
  const maxResend = 5;
  const onSubmit = async () => {
    try {
      await verifyEmail(email, code);
      if (ok) {
        if (fromLogin) {
          await updateVerificationStatus(true);
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
          Alert.alert("Verified and Logged in", "Your account is now activated.", [
            { text: "OK", onPress: () => navigation.navigate("Bill_FYP") },
          ]); 
          return;
        }
        try { setLoggedIn(true); } catch (e) {}
        Alert.alert("Verified", "Your account is now activated.", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      }
      else {
        const errs = [];
        if (verifyErrors) {
          for (const key in verifyErrors) {
            if (Array.isArray(verifyErrors[key])) {
              verifyErrors[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
            } else {
              errs.push(`${key}: ${verifyErrors[key]}`);
            } 
          }
        }
        setErrors(errs);
      }
    } catch (err) {
      Alert.alert("Verification error", "Network or unexpected error occurred.");
    }

    
  };

  const onResend = () => {
    if (resendCount >= maxResend) return;
    const next = resendCount + 1;
    setResendCount(next);
    try {
      resend(email);
      if (ok) {
        const alrts = [];
        alrts.push(`Verification code resent (${next}/${maxResend}).`);
        setAlerts(alrts);
      }
      else {
        const errs = [];
        if (resendErrors) {
          for (const key in resendErrors) {
            if (Array.isArray(resendErrors[key])) {
              resendErrors[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
            } else {
              errs.push(`${key}: ${resendErrors[key]}`);
              if (resendErrors[key] === "Daily resend limit reached.") {
                setResendCount(maxResend);
              }
            } 
          }
        }
        setErrors(errs);
      }
    } catch (err) {
      Alert.alert("Resend error", "Network or unexpected error occurred.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Email Verification</Text>
      <Text style={styles.instructions}>
        Enter the verification code sent to {email}.
      </Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(t) => setCode(t)}
        placeholderTextColor="#888"
        placeholder="Add your verification code here"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading &&
        <View style={styles.button}>
          <Text style={styles.buttonText}>Verifying…</Text>
        </View>
      }
      {!loading &&
        <Pressable style={styles.button} onPress={onSubmit}>
          <Text style={styles.buttonText}>Verify</Text>
        </Pressable>
      }
      {errors?.length > 0 && (
        <View style={styles.errorBox}>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>
              • {e}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.resendRow}>
        <Text style={styles.helpText}>Didn't receive a code?</Text>
        <Pressable
          onPress={onResend}
          disabled={resendCount >= maxResend}
          style={[styles.resendButton, resendCount >= maxResend && styles.disabled]}
        >
          <Text style={styles.resendText}>
            {resendCount >= maxResend
              ? "Resend limit reached"
              : `Resend (${resendCount}/${maxResend})`}
          </Text>
        </Pressable>
      </View>
      {alerts?.length > 0 && (
        <View style={styles.alertBox}>
          {alerts.map((a, i) => (
            <Text key={i} style={styles.alertText}>
              • {a}
            </Text>
          ))}
        </View>
      )}
      
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.text,
  },
  instructions: {
    color: theme.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    borderRadius: 8,
    color: theme.text,
  },
  button: {
    marginTop: 16,
    backgroundColor: theme.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: theme.innerText,
    fontWeight: "600",
  },
  resendRow: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helpText: {
    color: theme.text,
    fontWeight: "500",
    
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.primary,
    borderRadius: 6,
  },
  resendText: {
    color: theme.innerText,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: theme.secondary,
    borderRadius: 6,
    padding: 10,
  },
  errorText: {
    color: theme.text,
    fontSize: 13,
  },
  alertBox: {
    marginTop: 12,
    backgroundColor: theme.secondary,
    borderRadius: 6,
    padding: 10,
  },
  alertText: {
    color: theme.text,
    fontSize: 13,
  },
});
