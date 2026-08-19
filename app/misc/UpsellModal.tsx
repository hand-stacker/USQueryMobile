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
import { resolveSubscriptionTier, TIER_FREE } from '../hooks/subscriptionTier';
import { navigate, navigationRef } from '../navigation/navigationRef';
import { useUpsellStore } from '../store/upsellStore';
import { ThemeContext } from '../theme/themeContext';
import { MODAL_PRIORITY, useModalSlot } from './modalQueue';

// The upsell owns its own screenshots so it stays independent of the per-release
// What's New demos in app/demos/ (which are swapped out each version).
import billChatDark from './upsell_assets/bill_chat_dk.jpg';
import billChatLight from './upsell_assets/bill_chat_li.jpg';
import votePredDark from './upsell_assets/vote_predictions_dk.jpg';
import votePredLight from './upsell_assets/vote_predictions_li.jpg';

// ── Trigger configuration ──────────────────────────────────────────────────────
// Detail pages that can trigger the upsell (deepest active route name).
const QUALIFYING_ROUTES = ['Bill_info', 'Member_info', 'Vote_info'];
// Detail pages the user must have opened, ever, before the upsell is eligible
// at all. Gives a new user room to actually use the app first.
const MIN_QUALIFYING_VIEWS = 10;
// Chance the modal shows on a qualifying navigation once eligible. With the
// warm-up above, a free user typically first sees it somewhere past their
// twentieth detail page.
const SHOW_PROBABILITY = 0.12;
const DAY_MS = 24 * 60 * 60 * 1000;
// After a dismiss, mute for three weeks; after tapping Upgrade, mute for a
// quarter (they've already seen Plans; the tier check ends it entirely once
// they buy).
const DISMISS_SNOOZE_MS = 21 * DAY_MS;
const UPGRADE_SNOOZE_MS = 90 * DAY_MS;

// Session-scoped, in-memory only (reset on app restart — "once per app session").
let shownThisSession = false;
let rolling = false;

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
    body: "See how likely Congress is to pass any active bill, and each member's odds of voting Yes.",
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
 * bill/member/vote detail page, if the user is logged in on the free tier, has
 * opened at least MIN_QUALIFYING_VIEWS detail pages, isn't snoozed, and the roll
 * passes, a swipeable carousel promotes Vote Predictions and Bill Chat with a
 * call to action to upgrade. Mirrors WhatsNewModal's layout.
 *
 * The tier comes from app/hooks/subscriptionTier.ts, which is invalidated on
 * sign-in, sign-out and every purchase — so a user who upgrades stops seeing
 * this immediately rather than at the next app launch.
 */
export default function UpsellModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const isDark = theme.name === 'dark';

  const setSnoozedUntil = useUpsellStore((s) => s.setUpsellSnoozedUntil);

  const [wanted, setWanted] = useState(false);
  const visible = useModalSlot('upsell', MODAL_PRIORITY.upsell, wanted);
  const [page, setPage] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const { height: windowHeight } = useWindowDimensions();
  const imageAreaHeight = Math.min(320, Math.round(windowHeight * 0.38));

  useEffect(() => {
    let lastRoute: string | undefined;

    const evaluate = () => {
      const store = useUpsellStore.getState();
      if (!store._hasHydrated) return;

      const routeName = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()?.name
        : undefined;
      // The listener fires on every state change, including ones that leave the
      // route alone (tab bar, params, going back into the same screen), so only
      // count a route we just arrived on.
      const arrived = !!routeName && routeName !== lastRoute;
      lastRoute = routeName;
      if (!arrived || !QUALIFYING_ROUTES.includes(routeName!)) return;

      // Count up to the threshold and then stop, so this isn't writing to
      // storage on every detail page for the life of the install.
      if (store.upsellQualifyingViews < MIN_QUALIFYING_VIEWS) {
        store.bumpUpsellQualifyingViews();
        return;
      }

      if (shownThisSession || rolling) return;
      if (Date.now() < store.upsellSnoozedUntil) return;

      // Roll before the (async) tier lookup so most visits cost nothing.
      if (Math.random() >= SHOW_PROBABILITY) return;

      rolling = true;
      resolveSubscriptionTier()
        .then((tier) => {
          // Only logged-in free-tier users — anyone on Plus or Premium, and
          // anyone signed out, never sees this. Guard the flag in case another
          // navigation resolved first.
          if (tier === TIER_FREE && !shownThisSession) {
            shownThisSession = true;
            setWanted(true);
          }
        })
        .finally(() => {
          rolling = false;
        });
    };

    const unsubscribe = navigationRef.addListener('state', evaluate);
    return unsubscribe;
  }, []);

  const dismiss = () => {
    setSnoozedUntil(Date.now() + DISMISS_SNOOZE_MS);
    setWanted(false);
  };

  const upgrade = () => {
    setSnoozedUntil(Date.now() + UPGRADE_SNOOZE_MS);
    setWanted(false);
    // Switch to the Settings (options) tab, then open Plans within its stack.
    navigate('Settings', { screen: 'Plans' });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPage(Math.max(0, Math.min(next, SLIDES.length - 1)));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={dismiss}>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
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
              style={[styles.carousel, { minHeight: imageAreaHeight + 96 }]}
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
          </ScrollView>
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
  scrollContent: {
    // Lets the CTA breathe at the very bottom when the content scrolls.
    paddingBottom: 2,
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
    // minHeight is applied inline from the responsive image-area height so the
    // nested horizontal (paging) ScrollView always has a definite height and
    // never collapses inside the outer vertical ScrollView.
    width: '100%',
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
