import React, { useContext, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegister } from "../hooks/useRegister";
import { ThemeContext } from "../theme/themeContext";

interface RegisterProps {
  navigation: any;
}

export default function RegisterAccount({ navigation}: RegisterProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { register, ok, loading, data, errors: registerErrors } = useRegister(email,password);

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
    color: theme.text,
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
    color: theme.text,
  },
  button: {
    marginTop: 24,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
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