import { nativeApplicationVersion } from 'expo-application';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORE_URL } from '../../constants/storeLinks';
import { getAppVersion } from '../api/appVersion';
import { useAppVersionStore } from '../store/appVersionStore';
import { ThemeContext } from '../theme/themeContext';
import { compareVersions } from '../utils/compareVersions';

/**
 * Prompts the user to update when the released version (app-version API) is
 * newer than the installed binary. "Maybe Later" mutes the prompt for that
 * released version; it re-appears when an even newer version ships. Skipped
 * on launches where the What's New modal is about to show, so the two never
 * stack.
 */
export default function UpdateAvailableModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const lastSeenVersion = useAppVersionStore((s) => s.lastSeenVersion);
  const dismissedUpdateVersion = useAppVersionStore((s) => s.dismissedUpdateVersion);
  const setDismissedUpdateVersion = useAppVersionStore((s) => s.setDismissedUpdateVersion);
  const hydrated = useAppVersionStore((s) => s._hasHydrated);

  const [visible, setVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (!hydrated || checked.current) return;
    checked.current = true;

    (async () => {
      const installed = nativeApplicationVersion;
      if (!installed) return; // not available (e.g. web)

      // What's New is about to show for this launch — let it have the screen.
      if (!lastSeenVersion || compareVersions(lastSeenVersion, installed) < 0) return;

      const latest = await getAppVersion();
      if (!latest) return; // offline / API down — try again next launch
      if (compareVersions(installed, latest) >= 0) return; // up to date
      if (dismissedUpdateVersion === latest) return; // already dismissed this one

      setLatestVersion(latest);
      setVisible(true);
    })();
  }, [hydrated]);

  if (!visible) return null;

  const handleUpdate = async () => {
    setVisible(false);
    await Linking.openURL(STORE_URL);
  };

  const handleLater = () => {
    if (latestVersion) setDismissedUpdateVersion(latestVersion);
    setVisible(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleLater}>
      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Available</Text>

          <Text style={styles.body}>
            A new version of My Congress{latestVersion ? ` (v${latestVersion})` : ''} is ready.
            Update now to get the latest features and fixes.
          </Text>

          <Pressable style={[styles.button, styles.primary]} onPress={handleUpdate}>
            <Text style={styles.primaryText}>Update Now</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.ghost]} onPress={handleLater}>
            <Text style={styles.ghostText}>Maybe Later</Text>
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
  ghost: {
    backgroundColor: theme.secondary,
  },
  ghostText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
