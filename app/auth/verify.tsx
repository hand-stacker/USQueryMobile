import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateVerificationStatus } from "../encrypted-storage/functions";
import useResendVerificationCode from "../hooks/useResendVerificationCode";
import { useVerifyEmail } from "../hooks/useVerifyEmail";

interface VerifyProps {
  navigation: any;
  route: any;
}

export default function VerifyEmail({ navigation, route }: VerifyProps) {
  const email = route?.params?.email;
  const fromLogin = route?.params?.fromLogin || false;
  const [code, setCode] = useState("");
  const { verifyEmail, ok, loading, data, errors: verifyErrors } = useVerifyEmail(email,code);
  const { resend, ok: resendOk, loading: resendLoading, data: resendData , errors: resendErrors} = useResendVerificationCode(email);
  
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
          Alert.alert("Verified and Logged in", "Your account is now activated.", [
            { text: "OK", onPress: () => navigation.navigate("Bill_FYP") },
          ]); 
          return;
        }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructions: {
    color: "#444",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
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
    color: "#444",
    fontWeight: "500",
    
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#b5c9f3",
    borderRadius: 6,
  },
  resendText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: "#fff1f2",
    borderRadius: 6,
    padding: 10,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  alertBox: {
    marginTop: 12,
    backgroundColor: "#f5f1ff",
    borderRadius: 6,
    padding: 10,
  },
  alertText: {
    color: "#1c2eb9",
    fontSize: 13,
  },
});
