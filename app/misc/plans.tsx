import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest } from '../hooks/authRequest';
import { ThemeContext } from '../theme/themeContext';


interface PlansProps {
  navigation: any;
}

interface Tier {
  id: number;
  name: string;
  price: string;
  price_period: string;
  starred_members_limit: number;
  starred_bills_limit: number;
  predictions_per_day: number | null;
  chat_messages_per_day: number | null;
}

interface PlansData {
  stripe_configured: boolean;
  subscriptions_enabled: boolean;
  tiers: Tier[];
}

interface SubStatus {
  tier: number;
  tier_name: string;
  cancel_at_period_end: boolean;
  period_end: string | null;
}

export default function PlansScreen({ navigation }: PlansProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  // null = idle, -1 = cancel in flight, -2 = reactivate in flight, N = upgrading tier N
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const session = await retrieveUserSession();
      const loggedIn = !!session?.accessToken;
      setIsLoggedIn(loggedIn);

      const plans: PlansData = await authRequest('subscription/plans/');
      setPlansData(plans);
      if (loggedIn) {
        try {
          const status: SubStatus = await authRequest('subscription/status/');
          setSubStatus(status);
        } catch {
          // Non-fatal: user may not have a subscription yet
        }
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // -3 = portal URL fetch in flight
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const result = await authRequest('subscription/portal/', { method: 'POST' });
      if (result.portal_url) {
        await Linking.openURL(result.portal_url);
      } else {
        Alert.alert('Error', result.error ?? 'Could not open billing portal.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (tierId: number) => {
    setActionLoading(tierId);
    try {
      const result = await authRequest('subscription/create-checkout/', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId }),
      });

      if (result.checkout_url) {
        await Linking.openURL(result.checkout_url);
        navigation.navigate('Checkout_Success');
      } else if (result.modified) {
        navigation.navigate('Checkout_Success', {
          instant: true,
          message: result.message,
        });
      } else {
        Alert.alert('Error', result.error ?? 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not complete the action. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your plan stays active until the end of the current billing period. After that your account reverts to Free.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(-1);
            try {
              const result = await authRequest('subscription/cancel/', { method: 'POST' });
              if (result.cancelled) {
                Alert.alert('Done', result.message);
                await loadData();
              } else {
                Alert.alert('Error', result.error ?? 'Could not cancel subscription.');
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not cancel subscription.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    setActionLoading(-2);
    try {
      const result = await authRequest('subscription/reactivate/', { method: 'POST' });
      if (result.reactivated) {
        Alert.alert('Reactivated', result.message);
        await loadData();
      } else {
        Alert.alert('Error', result.error ?? 'Could not reactivate subscription.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not reactivate subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const predictionsLabel = (val: number | null) =>
    val === null
      ? { label: 'Unlimited vote predictions', included: true }
      : val === 0
      ? { label: 'Vote predictions', included: false }
      : { label: `${val} vote predictions/day`, included: true };

  const chatLabel = (val: number | null) =>
    val === null
      ? { label: 'Unlimited AI chats', included: true }
      : val === 0
      ? { label: 'AI chatbot', included: false }
      : { label: `${val} AI chats/day`, included: true };

  const renderCardActions = (tier: Tier) => {
    const currentTier = subStatus?.tier ?? 0;
    const isCurrent = isLoggedIn && currentTier === tier.id;
    const isUpgrade = isLoggedIn && tier.id > currentTier;
    const isDowngrade = isLoggedIn && tier.id < currentTier;
    const canSubscribe = plansData?.subscriptions_enabled && plansData?.stripe_configured;
    const cancelPending = subStatus?.cancel_at_period_end ?? false;

    if (isCurrent) {
      return (
        <View>
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
          {tier.id > 0 && (
            <>
              {cancelPending ? (
                <Pressable
                  style={[styles.btn, styles.btnOutline, { marginTop: 10 }]}
                  onPress={handleReactivate}
                  disabled={actionLoading === -2}
                >
                  {actionLoading === -2 ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.primary }]}>Reactivate Subscription</Text>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.btn, styles.btnDanger, { marginTop: 10 }]}
                  onPress={handleCancel}
                  disabled={actionLoading === -1}
                >
                  {actionLoading === -1 ? (
                    <ActivityIndicator color={theme.subtext} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.subtext }]}>Cancel Subscription</Text>
                  )}
                </Pressable>
              )}
              <Pressable
                style={[styles.btn, styles.btnSecondary, { marginTop: 8 }, portalLoading && { opacity: 0.75 }]}
                onPress={openPortal}
                disabled={portalLoading}
              >
                {portalLoading
                  ? <ActivityIndicator color={theme.text} />
                  : <Text style={[styles.btnText, { color: theme.text }]}>Manage via Portal</Text>}
              </Pressable>
            </>
          )}
        </View>
      );
    }

    if (isDowngrade) {
      return (
        <Pressable
          style={[styles.btn, styles.btnSecondary, portalLoading && { opacity: 0.75 }]}
          onPress={openPortal}
          disabled={portalLoading}
        >
          {portalLoading
            ? <ActivityIndicator color={theme.text} />
            : <Text style={[styles.btnText, { color: theme.text }]}>Switch via Portal</Text>}
        </Pressable>
      );
    }

    if (!isLoggedIn) {
      if (tier.id === 0) return null;
      return (
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.btnText, { color: theme.innerText }]}>Sign In to Upgrade</Text>
        </Pressable>
      );
    }

    if (isUpgrade) {
      if (!canSubscribe) {
        return (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={[styles.btnText, { color: theme.subtext }]}>Coming Soon</Text>
          </View>
        );
      }
      return (
        <Pressable
          style={[styles.btn, styles.btnPrimary, actionLoading === tier.id && { opacity: 0.75 }]}
          onPress={() => handleUpgrade(tier.id)}
          disabled={actionLoading === tier.id}
        >
          {actionLoading === tier.id ? (
            <ActivityIndicator color={theme.innerText} />
          ) : (
            <Text style={[styles.btnText, { color: theme.innerText }]}>Upgrade to {tier.name}</Text>
          )}
        </Pressable>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.title}>Plans & Pricing</Text>
        <Text style={styles.subtitle}>Unlock predictions, starred content, and more.</Text>

        {!plansData?.subscriptions_enabled && (
          <View style={styles.infoBanner}>
            <Ionicons name="construct-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { flex: 1 }]}>
              New subscriptions are temporarily unavailable while we finish building promised features. Check back soon!
            </Text>
          </View>
        )}

        {subStatus?.cancel_at_period_end && subStatus?.period_end && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { flex: 1, color: '#F59E0B' }]}>
              Your subscription cancels on{' '}
              {new Date(subStatus.period_end).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              . You keep access until then.
            </Text>
          </View>
        )}

        {plansData?.tiers.map((tier) => (
          <View key={tier.id} style={[styles.card, tier.id === 1 && styles.cardHighlight]}>
            {tier.id === 1 && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}

            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierPrice}>{tier.price}</Text>
            <Text style={styles.tierPricePeriod}>{tier.price_period}</Text>

            <View style={styles.featureList}>
              <FeatureRow label={`${tier.starred_members_limit} starred members`} included theme={theme} />
              <FeatureRow label={`${tier.starred_bills_limit} starred bills`} included theme={theme} />
              <FeatureRow {...predictionsLabel(tier.predictions_per_day)} theme={theme} />
              <FeatureRow {...chatLabel(tier.chat_messages_per_day)} theme={theme} />
            </View>

            {renderCardActions(tier)}
          </View>
        ))}

        <View style={[styles.card, { marginBottom: 0 }]}>
          <Text style={styles.aboutTitle}>About the Limits</Text>
          <Text style={styles.aboutText}>
            <Text style={{ fontWeight: '600' }}>Vote Predictions</Text>
            {
              ' — Simulated votes on any bill, powered by a neural network trained on congressional voting history.\n\n'
            }
            <Text style={{ fontWeight: '600' }}>Starred Content</Text>
            {' — Save members and bills you care about. Get push notifications on new activity.\n\n'}
            <Text style={{ fontWeight: '600' }}>AI Chatbot</Text>
            {' — Ask questions about bills and their potential impact, grounded in real congressional data.'}
          </Text>
          <Text style={styles.finePrint}>
            Prices in USD · Billed monthly · Cancel anytime · Payments processed securely by Stripe
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ label, included, theme }: { label: string; included: boolean; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={included ? '#2ea87e' : theme.subtext}
        style={{ marginRight: 10 }}
      />
      <Text style={{ color: included ? theme.text : theme.subtext, fontSize: 14, flex: 1 }}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: '18%',
      paddingTop: '10%',
    },
    title: {
      color: theme.text,
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.subtext,
      fontSize: 15,
      marginBottom: 20,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.secondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(245,158,11,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    bannerText: {
      fontSize: 13,
      color: theme.text,
      lineHeight: 18,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHighlight: {
      borderWidth: 2,
      borderColor: theme.primary,
    },
    popularBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginBottom: 12,
    },
    popularBadgeText: {
      color: theme.innerText,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    tierName: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    tierPrice: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 2,
    },
    tierPricePeriod: {
      color: theme.subtext,
      fontSize: 13,
      marginBottom: 16,
    },
    featureList: {
      marginBottom: 16,
    },
    btn: {
      minHeight: 46,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    btnPrimary: { backgroundColor: theme.primary },
    btnSecondary: { backgroundColor: theme.secondary },
    btnOutline: { borderWidth: 1, borderColor: theme.primary },
    btnDanger: { borderWidth: 1, borderColor: theme.border },
    btnDisabled: { backgroundColor: theme.secondary, opacity: 0.6 },
    btnText: { fontSize: 15, fontWeight: '600' },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 10,
    },
    currentBadgeText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    aboutTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    aboutText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 12,
    },
    finePrint: {
      color: theme.subtext,
      fontSize: 11,
      textAlign: 'center',
    },
  });
