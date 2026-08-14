import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { ThemeContext } from '../theme/themeContext';

interface Props {
  onPress: () => void;
  loading?: boolean;
  /**
   * SIGN_IN renders "Sign in with Apple", SIGN_UP renders "Sign up with Apple".
   * Apple owns the wording — the system button localizes it for us.
   */
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
}

// Kept in lockstep with GoogleSignInButton so the two options read as equals.
// App Review guideline 4 requires Sign in with Apple to be presented as an
// equivalent option (same size and shape) to every other sign-in choice.
export const SIGN_IN_BUTTON_HEIGHT = 50;
export const SIGN_IN_BUTTON_RADIUS = 8;

/**
 * Sign in with Apple, drawn by the system so it always matches the current
 * Human Interface Guidelines. Renders nothing off iOS or on iOS versions
 * without Sign in with Apple support.
 */
export default function AppleSignInButton({
  onPress,
  loading = false,
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
}: Props) {
  const { theme } = useContext(ThemeContext);
  const [available, setAvailable] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (mounted) setAvailable(ok);
      })
      .catch(() => {
        if (mounted) setAvailable(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (Platform.OS !== 'ios' || !available) return null;

  const isDark = theme.name === 'dark';

  return (
    <View style={styles.wrapper}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={buttonType}
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={SIGN_IN_BUTTON_RADIUS}
        style={styles.button}
        onPress={() => {
          if (!loading) onPress();
        }}
      />
      {/* The system button has no loading state; cover it while the request is
          in flight so it can't be tapped twice. */}
      {loading && (
        <View style={[styles.overlay, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
          <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: SIGN_IN_BUTTON_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIGN_IN_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
