import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseButton from '../components/CloseButton';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';
import { ThemeContext } from '../theme/themeContext';
import { useConsentComplete } from './ConsentGateModal';
import { MODAL_PRIORITY, useModalSlot } from './modalQueue';

export default function WelcomeFavoritesModal() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const favorites = useFavoritesStore(s => s.favorites);
  const hydrated = useFavoritesStore(s => s._hasHydrated);
  const welcomeCounter = useFavoritesStore(s => s.welcomeCounter);
  const setWelcomeCounter = useFavoritesStore(s => s.setWelcomeCounter);
  const consentComplete = useConsentComplete();
  const [wanted, setWanted] = useState(false);
  const visible = useModalSlot('welcome', MODAL_PRIORITY.welcome, wanted);
  const processedOpen = useRef(false);
  const navigation: any = useNavigation();

  // Run on app open (when persisted state has hydrated). Only process once per app session.
  // Gates on consentComplete so this only queues up after the whole consent gate is done.
  useEffect(() => {
    if (!hydrated || !consentComplete || processedOpen.current) return;
    processedOpen.current = true;

    if (Array.isArray(favorites) && favorites.length === 0) {
      // If counter exists and >0, subtract one and only open search when it reaches zero.
      if (typeof welcomeCounter === 'number' && welcomeCounter > 0) {
        const next = Math.max(0, welcomeCounter - 1);
        setWelcomeCounter(next);
        if (next === 0) {
            setWanted(true);
        }
      } else {
        // unset (-1) or other -> show welcome modal (first-open)
        setWanted(true);
      }
    } else {
      // Favorites not empty: ensure counter is 1 so modal can open immediately if user clears favorites next time
      if (welcomeCounter !== 1) setWelcomeCounter(1);
    }
  }, [hydrated, consentComplete]);

  // If favorites become non-empty during a session, ensure counter is 1 (immediate on next open)
  useEffect(() => {
    if (Array.isArray(favorites) && favorites.length > 0 && welcomeCounter !== 1) {
      setWelcomeCounter(1);
    }
  }, [favorites]);

  const handleSelect = () => {
    setWanted(false);
    // navigate to the Options tab and open the select modal there
    navigation.navigate('Settings', { screen: 'Login' });
  };

  const handleClose = () => {
    // postpone the next prompts for a few app opens
    setWelcomeCounter(3);
    setWanted(false);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={handleClose} transparent>
      <SafeAreaView style={styles.overlay} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Welcome to USQuery</Text>
            <CloseButton onPress={handleClose} />
          </View>

          <Text style={styles.body}>
            Thank you for trying USQuery. To help you get the most relevant results, please make an account or login and select a few topics you're
            most interested in. We'll use these to personalise your feed and recommendations.
          </Text>

          <View style={styles.actionsRow}>
            <Pressable style={[styles.button, styles.primary]} onPress={handleSelect}>
              <Text style={styles.primaryText}>Log in</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.ghost]} onPress={handleClose}>
              <Text style={styles.ghostText}>I'll do it later</Text>
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
    width: '90%',
    backgroundColor: theme.background,
    padding: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: theme.shadow,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  header: {
    maxWidth: '80%',
    fontSize: 18,
    fontWeight: '700',
    color: theme.titleText,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.text,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  primary: {
    backgroundColor: theme.primary,
  },
  primaryText: {
    color: theme.innerText,
    fontWeight: '600',
  },
  ghost: {
    backgroundColor: theme.secondary,
  },
  ghostText: {
    color: theme.text,
    fontWeight: '600',
  },
});