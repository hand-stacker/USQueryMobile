import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeContext } from '../theme/themeContext';

interface Props {
  onPress: () => void;
  loading?: boolean;
  label?: string;
  display?: boolean;
}

export default function AppleSignInButton({ onPress, loading = false, label = 'Sign in with Apple', display = true }: Props) {
  const { theme } = useContext(ThemeContext);
  const [pressed, setPressed] = useState(false);

  if (!display) return null;

  const isDark = theme.name === 'dark';
  const bg = isDark ? '#FFFFFF' : '#000000';
  const bgPressed = isDark ? '#e8e8e8' : '#1a1a1a';
  const fg = isDark ? '#000000' : '#FFFFFF';

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: pressed ? bgPressed : bg },
        isDark && styles.borderDark,
        loading && styles.disabled,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={loading}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <Ionicons name="logo-apple" size={22} color={fg} />
        )}
        <Text style={[styles.text, { color: fg }]}>
          {loading ? 'Signing in...' : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 50,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderDark: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  disabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
});
