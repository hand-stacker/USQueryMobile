import React, { useContext, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORE_URL } from '../../constants/storeLinks';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { ThemeContext } from '../theme/themeContext';
import { useConsentComplete } from './ConsentGateModal';
import { MODAL_PRIORITY, useModalSlot } from './modalQueue';

export default function ReviewModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const reviewStatus = useAppSettingsStore(s => s.reviewStatus);
  const setReviewStatus = useAppSettingsStore(s => s.setReviewStatus);
  const reviewCountdown = useAppSettingsStore(s => s.reviewCountdown);
  const setReviewCountdown = useAppSettingsStore(s => s.setReviewCountdown);
  const hydrated = useAppSettingsStore(s => s._hasHydrated);

  const consentComplete = useConsentComplete();
  const [wanted, setWanted] = useState(false);
  const visible = useModalSlot('review', MODAL_PRIORITY.review, wanted);
  const processed = useRef(false);

  useEffect(() => {
    if (!hydrated || !consentComplete || processed.current || reviewStatus !== 'pending') return;
    processed.current = true;

    if (reviewCountdown <= 1) {
      setReviewCountdown(0);
      setWanted(true);
    } else {
      setReviewCountdown(reviewCountdown - 1);
    }
  }, [hydrated, consentComplete]);

  const handleReview = async () => {
    setReviewStatus('reviewed');
    setWanted(false);
    await Linking.openURL(STORE_URL);
  };

  const handleLater = () => {
    setReviewCountdown(7);
    setWanted(false);
  };

  const handleNever = () => {
    setReviewStatus('never');
    setWanted(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleLater}>
      <SafeAreaView style={styles.overlay} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.title}>Enjoying My Congress?</Text>

          <Text style={styles.body}>
            If you're finding the app useful, we'd love it if you left us a review. It really helps!
          </Text>

          <Pressable style={[styles.button, styles.primary]} onPress={handleReview}>
            <Text style={styles.primaryText}>Write a Review</Text>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable style={[styles.button, styles.ghost]} onPress={handleNever}>
              <Text style={styles.ghostText}>Never</Text>
            </Pressable>
            
            <Pressable style={[styles.button, styles.ghost]} onPress={handleLater}>
              <Text style={styles.ghostText}>Maybe Later</Text>
            </Pressable>
          </View>
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
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '400',
  },
  button: {
    minHeight: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  primary: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: theme.primary,
    marginBottom: 10,
  },
  primaryText: {
    color: theme.innerText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ghost: {
    flex: 1,
    backgroundColor: theme.secondary,
  },
  ghostText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
