import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authRequest } from '../hooks/authRequest';
import { ThemeContext } from '../theme/themeContext';

interface CheckoutSuccessProps {
  navigation: any;
  route: any;
}

export default function CheckoutSuccess({ navigation, route }: CheckoutSuccessProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  // instant=true when a plan was modified server-side without opening a browser (upgrade/downgrade of existing sub)
  const instant: boolean = route.params?.instant ?? false;
  const paramMessage: string | undefined = route.params?.message;

  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(instant);

  const checkStatus = async () => {
    setChecking(true);
    setStatusMsg(null);
    try {
      const result = await authRequest('subscription/status/');
      if (result.tier > 0) {
        setStatusMsg(`You're now on the ${result.tier_name} plan!`);
        setConfirmed(true);
      } else {
        setStatusMsg(
          'No paid subscription detected yet. If you just completed payment, wait a moment and try again.'
        );
      }
    } catch {
      setStatusMsg('Could not check status. Please view your Account page.');
    } finally {
      setChecking(false);
    }
  };

  const iconName = confirmed ? 'checkmark-circle' : 'time-outline';
  const iconColor = confirmed ? '#2ea87e' : theme.primary;

  const title = instant ? 'Plan Updated!' : confirmed ? 'Payment Confirmed!' : 'Complete Your Payment';

  const body =
    paramMessage ??
    (instant
      ? 'Your subscription has been updated successfully.'
      : 'Finish your checkout in the browser. Once your payment is confirmed, tap "Check My Status" below.');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.card}>
        <Ionicons name={iconName} size={72} color={iconColor} style={styles.icon} />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        {!instant && (
          <Pressable
            style={[styles.btn, styles.btnPrimary, checking && { opacity: 0.75 }]}
            onPress={checkStatus}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color={theme.innerText} />
            ) : (
              <Text style={[styles.btnText, { color: theme.innerText }]}>Check My Status</Text>
            )}
          </Pressable>
        )}

        {statusMsg !== null && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        )}

        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.btnText, { color: theme.text }]}>View My Account</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnSecondary, { marginBottom: 0 }]} onPress={() => navigation.navigate('Bill_FYP')}>
          <Text style={[styles.btnText, { color: theme.text }]}>Go to Bills</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: '8%',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 28,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 5,
    },
    icon: { marginBottom: 16 },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    body: {
      color: theme.subtext,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: 24,
    },
    btn: {
      width: '100%',
      minHeight: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      paddingVertical: 12,
    },
    btnPrimary: { backgroundColor: theme.primary },
    btnSecondary: { backgroundColor: theme.secondary },
    btnText: { fontSize: 16, fontWeight: '600' },
    statusBox: {
      width: '100%',
      backgroundColor: theme.secondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    statusText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
