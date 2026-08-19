import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/themeContext';

/**
 * First of the first-run consent steps: Disclaimer -> Privacy Policy -> Terms.
 *
 * This is content only — ConsentGateModal owns the single <Modal> that all
 * three steps render into, so the steps swap without any native
 * present/dismiss between them. See app/misc/modalQueue.ts for why.
 */
export function DisclaimerContent({ onAccept }: { onAccept: () => void }) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.overlay} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Independent App Notice</Text>

        <Text style={styles.body}>
          My Congress is an independent, third-party app and is not affiliated with, endorsed by, or authorized by the U.S. government or any government entity.
        </Text>

        <Text style={styles.body}>
          Congressional data is sourced from official government sources, including congress.gov (Library of Congress), senate.gov, and house.gov.
        </Text>

        <Pressable style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>I Understand</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.text,
    marginBottom: 12,
    fontWeight: '400',
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
