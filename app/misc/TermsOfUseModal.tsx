import React, { useContext, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TERMS_OF_USE_URL } from '../../constants/iap';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { ThemeContext } from '../theme/themeContext';

/**
 * Third and last of the first-run modals: Disclaimer -> Privacy Policy -> Terms.
 * Shows once, when the user has not yet accepted, and never again — see
 * docs/legal/README.md for why we deliberately do not re-prompt on every
 * update (continued use is acceptance, per section 12 of the Terms).
 *
 * This surfaces the clauses that actually matter to a user of this app rather
 * than the full agreement; the Accept button is explicit that it binds them to
 * the whole document, which is one tap away and also lives under
 * Options -> Terms of Use.
 */
export default function TermsOfUseModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const termsAccepted = useAppSettingsStore(s => s.termsAccepted);
  const setTermsAccepted = useAppSettingsStore(s => s.setTermsAccepted);
  const privacyAccepted = useAppSettingsStore(s => s.privacyAccepted);
  const disclaimerAccepted = useAppSettingsStore(s => s.disclaimerAccepted);
  const hydrated = useAppSettingsStore(s => s._hasHydrated);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hydrated && disclaimerAccepted && privacyAccepted && !termsAccepted) {
      setVisible(true);
    } else if (hydrated && termsAccepted) {
      setVisible(false);
    }
  }, [hydrated, disclaimerAccepted, privacyAccepted, termsAccepted]);

  if (!hydrated || !disclaimerAccepted || !privacyAccepted || termsAccepted) return null;

  const handleAccept = () => {
    setTermsAccepted(true);
    setVisible(false);
  };

  return (
    // onRequestClose is required on Android; kept inert on purpose so the
    // hardware back button cannot dismiss a consent gate without a choice.
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => {}}>
      <SafeAreaView style={styles.overlay} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.title}>Terms of Use</Text>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.text}>
              These Terms are an agreement between you and USQuery LLC covering your use of My Congress. Here are the points that matter most.
            </Text>

            <Text style={styles.header}>Independent App</Text>

            <Text style={styles.text}>
              My Congress is an independent, third-party app and is not affiliated with, endorsed by, or authorized by the U.S. government or any government entity. Congressional data is sourced from official government sources, including congress.gov (Library of Congress), senate.gov, and house.gov, and may be delayed or incomplete. For an official record, consult the primary government source.
            </Text>

            <Text style={styles.header}>AI-Generated Content</Text>

            <Text style={styles.text}>
              Vote Predictions and the AI chatbot produce machine-generated estimates. A prediction is not a forecast of how any member of Congress will actually vote, and output may be inaccurate or incomplete even when it looks confident. It is provided for information and education only, and is not legal, financial, electoral, or other professional advice.
            </Text>

            <Text style={styles.header}>Subscriptions</Text>

            <Text style={styles.text}>
              Paid tiers renew automatically until cancelled. On iOS, payment is charged to your Apple ID and you manage or cancel the subscription in your Apple ID account settings; refunds are handled by Apple. On Android and the web, billing runs through Stripe and you manage it in the billing portal. Prices are always shown before you purchase.
            </Text>

            <Text style={styles.header}>Your Account</Text>

            <Text style={styles.text}>
              Accounts are for a single person. Do not scrape our APIs, resell our data, or use it to build a competing product. You can delete your account at any time from within the app.
            </Text>

            <Text style={styles.header}>Liability</Text>

            <Text style={styles.text}>
              The Service is provided "AS IS", without warranty. Our liability is limited as set out in the full Terms, which are governed by the laws of the State of California.
            </Text>

            <Text style={styles.header}>The Full Terms</Text>

            <Text style={styles.text}>
              The summary above is not the whole agreement. The complete Terms of Use, including the sections required by Apple, are available below and any time from Options.
            </Text>

            <Pressable onPress={() => Linking.openURL(TERMS_OF_USE_URL).catch(() => {})}>
              <Text style={styles.link}>Read the full Terms of Use</Text>
            </Pressable>
          </ScrollView>

          <Text style={styles.finePrint}>
            By tapping Accept you agree to the full Terms of Use.
          </Text>

          <Pressable style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptText}>Accept Terms of Use</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.overlay,
  },
  container: {
    width: '88%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: theme.background,
    padding: 22,
    borderRadius: 12,
    elevation: 6,
    shadowColor: theme.shadow,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.titleText,
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollView: {
    flexShrink: 1,
    marginBottom: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 14,
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: theme.text,
    marginBottom: 12,
  },
  link: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: theme.primary,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  finePrint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 10,
  },
  acceptButton: {
    marginTop: 8,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: theme.innerText,
    fontSize: 16,
    fontWeight: '600',
  },
});
