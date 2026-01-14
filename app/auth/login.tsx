import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeUserSession, retrieveUserSession, storeUserSession } from "../encrypted-storage/functions";
import { useLogin } from "../hooks/useLogin";

interface LoginProps {
  navigation: any;
}

export default function Login({ navigation }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const {login, ok, loading, data, errors : loginErrors} = useLogin( email, password);
  const [userSession, setUserSession] = useState<null | { accessToken?: string; email?: string; isVerified?: boolean }>(null);

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

  const onSubmit = async() => {
    // TODO: Call registration API. For now navigate to verification screen.
    try {
      await login(email, password);
      if (ok) {
        // TODO: store access token in zustand and refresh token in secure storage
        console.log("Login result:", { ok, data, loginErrors });
        await storeUserSession(data!.email, data!.access, data!.refresh, data!.is_verified);
        if (!data!.is_verified) {
          navigation.navigate("Verify", { email: email, fromLogin: true });
          return;
        }
        Alert.alert("Logged In", "You are now logged in from this device.", [
          {
            text: "Continue",
            onPress: () => navigation.navigate("Bill_FYP"),
          },
        ]);
      } else {
        const errs = [];
        for (const key in loginErrors) {
          if (Array.isArray(loginErrors[key])) {
            loginErrors[key].forEach((msg: string) => errs.push(`${key}: ${msg}`));
          } else {
            errs.push(`${key}: ${loginErrors[key]}`);
          }
        }
        setErrors(errs);
        return;
      }


    } catch (err) {
      Alert.alert("Registration error", "Network or unexpected error occurred.");
    }
  };
  if (userSession != null) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>You are already logged in!</Text>
        <Pressable style={styles.button} onPress={ async () => {
          Alert.alert("Log out?", "You are about to log out of " + userSession.email, [
            {
              text: "Continue",
              onPress: async () => {
                await removeUserSession();
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Enter your credentials</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
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
        <Text style={styles.buttonText}>Log In</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.buttonText}>Register a new account</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
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
});
