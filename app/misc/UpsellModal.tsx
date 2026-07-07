import React, { useContext, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseButton from '../components/CloseButton';
import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest } from '../hooks/authRequest';
import { navigate, navigationRef } from '../navigation/navigationRef';
import { useUpsellStore } from '../store/upsellStore';
import { ThemeContext } from '../theme/themeContext';

// Reuse the What's New demo screenshots so the upsell stays visually consistent.
import billChatDark from '../demos/bill_chat/bill_chat_dk.jpg';
import billChatLight from '../demos/bill_chat/bill_chat_li.jpg';
import votePredDark from '../demos/vote_predictions/vote_predictions_dk.jpg';
import votePredLight from '../demos/vote_predictions/vote_predictions_li.jpg';

// ── Trigger configuration ──────────────────────────────────────────────────────
// Detail pages that can trigger the upsell (deepest active route name).
const QUALIFYING_ROUTES = ['Bill_info', 'Member_info', 'Vote_info'];
// Chance the modal shows on a qualifying navigation when all conditions are met.
const SHOW_PROBABILITY = 1;
const DAY_MS = 24 * 60 * 60 * 1000;
// After a dismiss, mute for a week; after tapping Upgrade, mute for a month
// (they've already seen Plans; the tier check ends it entirely once they buy).
const DISMISS_SNOOZE_MS = 7 * DAY_MS;
const UPGRADE_SNOOZE_MS = 30 * DAY_MS;

// Session-scoped, in-memory only (reset on app restart — "once per app session").
let shownThisSession = false;
let rolling = false;
// Cached subscription tier for the session: null = unresolved, -1 = logged out
// or lookup failed (never show), 0 = free, 1 = Plus, 2 = Premium.
let cachedTier: number | null = null;

async function resolveTier(): Promise<number> {
  if (cachedTier !== null) return cachedTier;
  const session = await retrieveUserSession();
  if (!session?.accessToken) {
    cachedTier = -1;
    return cachedTier;
  }
  try {
    const res = await authRequest('subscription/status/');
    cachedTier = res?.tier ?? 0;
  } catch {
    cachedTier = -1;
  }
  return cachedTier as number;
}

interface Slide {
  key: string;
  title: string;
  body: string;
  image: { light: any; dark: any };
}

const SLIDES: Slide[] = [
  {
    key: 'vote_predictions',
    title: 'AI Vote Predictions',
    body: "See how likely Congress is to pass any active bill — and each member's odds of voting Yes.",
    image: { light: votePredLight, dark: votePredDark },
  },
  {
    key: 'bill_chat',
    title: 'Ask AI About Any Bill',
    body: "Chat with AI about a bill's impact, key provisions, and status. Clear answers, no legalese.",
    image: { light: billChatLight, dark: billChatDark },
  },
];

/**
 * One-per-session subscription upsell for free-tier users. On navigation into a
 * bill/member/vote detail page, if the user is logged in on the free tier, isn't
 * snoozed, and a 33% roll passes, a swipeable carousel promotes Vote Predictions
 * and Bill Chat with a call to action to upgrade. Mirrors WhatsNewModal's layout.
 */
export default function UpsellModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const isDark = theme.name === 'dark';

  const setSnoozedUntil = useUpsellStore((s) => s.setUpsellSnoozedUntil);

  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const { height: windowHeight } = useWindowDimensions();
  const imageAreaHeight = Math.min(320, Math.round(windowHeight * 0.38));

  useEffect(() => {
    const evaluate = () => {
      const { _hasHydrated, upsellSnoozedUntil } = useUpsellStore.getState();
      if (!_hasHydrated || shownThisSession || rolling) return;
      if (Date.now() < upsellSnoozedUntil) return;

      const routeName = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()?.name
        : undefined;
      if (!routeName || !QUALIFYING_ROUTES.includes(routeName)) return;

      // Roll before the (async) tier lookup so most visits cost nothing.
      if (Math.random() >= SHOW_PROBABILITY) return;

      rolling = true;
      resolveTier()
        .then((tier) => {
          // Only logged-in free-tier users; guard the flag in case another
          // navigation resolved first.
          if (tier === 0 && !shownThisSession) {
            shownThisSession = true;
            setVisible(true);
          }
        })
        .finally(() => {
          rolling = false;
        });
    };

    const unsubscribe = navigationRef.addListener('state', evaluate);
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setSnoozedUntil(Date.now() + DISMISS_SNOOZE_MS);
    setVisible(false);
  };

  const upgrade = () => {
    setSnoozedUntil(Date.now() + UPGRADE_SNOOZE_MS);
    setVisible(false);
    navigate('Plans');
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPage(Math.max(0, Math.min(next, SLIDES.length - 1)));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={dismiss}>
      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Unlock More</Text>
              <View style={styles.planChip}>
                <Text style={styles.planChipText}>Plus & Premium</Text>
              </View>
            </View>
            <CloseButton onPress={dismiss} size={18} style={styles.closeButton} />
          </View>

          <View
            style={styles.carousel}
            onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
          >
            {pageWidth > 0 && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
              >
                {SLIDES.map((slide) => {
                  const source = isDark ? slide.image.dark : slide.image.light;
                  const asset = Image.resolveAssetSource(source);
                  const ratio =
                    asset && asset.width > 0 && asset.height > 0
                      ? asset.width / asset.height
                      : 3 / 4;
                  const contentWidth = pageWidth - 8;
                  const imageWidth = Math.min(contentWidth, imageAreaHeight * ratio);
                  const imageHeight = imageWidth / ratio;
                  return (
                    <View key={slide.key} style={[styles.page, { width: pageWidth }]}>
                      <View style={[styles.imageArea, { height: imageAreaHeight }]}>
                        <Image
                          source={source}
                          style={[styles.image, { width: imageWidth, height: imageHeight }]}
                        />
                      </View>
                      <Text style={styles.featureTitle}>{slide.title}</Text>
                      <Text style={styles.featureDescription}>{slide.body}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          <Text style={styles.pitch}>Upgrade to unlock these features and more.</Text>

          <Pressable style={styles.upgradeButton} onPress={upgrade}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </Pressable>
          <Pressable style={styles.laterButton} onPress={dismiss}>
            <Text style={styles.laterText}>Maybe Later</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.titleText,
  },
  planChip: {
    backgroundColor: theme.primary + '22',
    borderWidth: 1,
    borderColor: theme.primary + '55',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  planChipText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    marginBottom: 0,
  },
  carousel: {
    flexShrink: 1,
  },
  page: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  imageArea: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  image: {
    resizeMode: 'contain',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    overflow: 'hidden',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.titleText,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 14,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: theme.primary,
  },
  pitch: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.subtext,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  upgradeButton: {
    minHeight: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  upgradeText: {
    color: theme.innerText,
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    minHeight: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  laterText: {
    color: theme.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
});
