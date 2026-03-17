import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/themeContext";
interface ResetPasswordProps {
  navigation: any;
}

export default function ResetPassword({ navigation }: ResetPasswordProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async() => {
    setLoading(true);
    try {
      const result = await fetch("https://usquery.com/api/auth/password-reset-api/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email,
        }),
        });
      setLoading(false);
      if (result.ok) {
        Alert.alert("Password Reset", "Your password has been reset. Please check your email for further instructions.", [
          {
            text: "Continue",
          },
        ]);
      } else {
        const errs: string[] = [];
        const source = result.errors ?? {};
        for (const key in source) {
          if (Array.isArray(source[key])) {
            source[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
          } else {
            errs.push(`${key}: ${source[key]}`);
          }
        }
        setErrors(errs);
        return;
      }
    } catch (err:any) {
      console.error("Password reset error:", err);
      Alert.alert("Password reset error", err?.message ?? "Network or unexpected error occurred.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Password Reset</Text>

      <Text style={styles.label}>Enter your email address to receive a link to reset your password.</Text>
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
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Resetting password...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.buttonText}>Log In</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    color: theme.titleText,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: theme.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    borderRadius: 8,
  },
  button: {
    marginTop: 24,
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
    color: theme.innerText,
    fontWeight: "600",
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
});