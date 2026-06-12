import React, { useContext, useEffect, useRef, useState } from 'react';
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
import { nativeApplicationVersion } from 'expo-application';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseButton from '../components/CloseButton';
import { DEMO_FEATURES } from '../demos';
import { useAppVersionStore } from '../store/appVersionStore';
import { ThemeContext } from '../theme/themeContext';
import { compareVersions } from '../utils/compareVersions';
import { loadTextAsset } from '../utils/loadTextAsset';

/**
 * Shown once per app update. Displays the features listed in app/demos/index.ts
 * in a swipeable carousel. Visibility: the store's lastSeenVersion is missing
 * or older than the running app version (expo config / app.json, falling back
 * to the binary version in production); once shown, the store is updated to
 * that version so it never re-appears for it.
 */
export default function WhatsNewModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const isDark = theme.name === 'dark';

  const lastSeenVersion = useAppVersionStore((s) => s.lastSeenVersion);
  const setLastSeenVersion = useAppVersionStore((s) => s.setLastSeenVersion);
  const hydrated = useAppVersionStore((s) => s._hasHydrated);

  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const checked = useRef(false);

  const { height: windowHeight } = useWindowDimensions();
  // Fixed stage height so the title/description/CTA line up across pages
  // even though the screenshots have different aspect ratios.
  const imageAreaHeight = Math.min(320, Math.round(windowHeight * 0.38));

  useEffect(() => {
    if (!hydrated || checked.current) return;
    checked.current = true;

    (async () => {
      // expoConfig.version tracks app.json (correct in dev and for OTA updates);
      // nativeApplicationVersion is the binary's baked-in version, used as fallback.
      const current = Constants.expoConfig?.version ?? nativeApplicationVersion;
      if (!current) return; // not available (e.g. web)

      const isNewVersion = !lastSeenVersion || compareVersions(lastSeenVersion, current) < 0;
      if (!isNewVersion || DEMO_FEATURES.length === 0) return;

      const texts = await Promise.all(
        DEMO_FEATURES.map((f) =>
          loadTextAsset(f.description).catch(() => '')
        )
      );
      setDescriptions(texts);
      setVersion(current);
      setVisible(true);
      setLastSeenVersion(current);
    })();
  }, [hydrated]);

  if (!visible) return null;

  const close = () => setVisible(false);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPage(Math.max(0, Math.min(next, DEMO_FEATURES.length - 1)));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>What&apos;s New</Text>
              {version && (
                <View style={styles.versionChip}>
                  <Text style={styles.versionChipText}>v{version}</Text>
                </View>
              )}
            </View>
            <CloseButton onPress={close} size={18} style={styles.closeButton} />
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
                {DEMO_FEATURES.map((feature, i) => {
                  const source = isDark ? feature.image.dark : feature.image.light;
                  const asset = Image.resolveAssetSource(source);
                  const ratio =
                    asset && asset.width > 0 && asset.height > 0
                      ? asset.width / asset.height
                      : 3 / 4;
                  // Explicit width AND height (never intrinsic pixel size) so the
                  // screenshot scales to fit the stage at its natural shape.
                  const contentWidth = pageWidth - 8; // page horizontal padding
                  const imageWidth = Math.min(contentWidth, imageAreaHeight * ratio);
                  const imageHeight = imageWidth / ratio;
                  return (
                    <View key={feature.key} style={[styles.page, { width: pageWidth }]}>
                      <View style={[styles.imageArea, { height: imageAreaHeight }]}>
                        <Image
                          source={source}
                          style={[styles.image, { width: imageWidth, height: imageHeight }]}
                        />
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{descriptions[i]}</Text>
                      <feature.Button onDone={close} />
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {DEMO_FEATURES.length > 1 && (
            <View style={styles.dots}>
              {DEMO_FEATURES.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          )}

          <Pressable style={styles.gotItButton} onPress={close}>
            <Text style={styles.gotItText}>Got It</Text>
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
  versionChip: {
    backgroundColor: theme.primary + '22',
    borderWidth: 1,
    borderColor: theme.primary + '55',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  versionChipText: {
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
  gotItButton: {
    minHeight: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
    marginTop: 14,
  },
  gotItText: {
    color: theme.innerText,
    fontSize: 16,
    fontWeight: '600',
  },
});
