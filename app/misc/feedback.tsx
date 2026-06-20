import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/themeContext';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc1o-CSvFiMynFY1lk38A_ueWOtcAQ8FOmdLZZTUKxD0mPhQA/viewform?usp=header';

export default function FeedbackScreen() {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);

  const openForm = async () => {
    try {
      await Linking.openURL(FEEDBACK_FORM_URL);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Feedback</Text>

        <View style={styles.section}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbox-ellipses-outline" size={26} color={theme.primary} />
          </View>
          <Text style={styles.sectionTitle}>Help us improve My Congress</Text>
          <Text style={styles.sectionBody}>
            Found a bug or have a suggestion? We read every submission — report issues,
            request features, or tell us what you&apos;d like to see next.
          </Text>

          <Pressable style={styles.button} onPress={openForm}>
            <Ionicons name="open-outline" size={16} color={theme.innerText} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Open Feedback Form</Text>
          </Pressable>
          <Text style={styles.note}>Opens a Google Form in your browser.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: theme.text,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary + '22',
    borderWidth: 1,
    borderColor: theme.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 18,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    minHeight: 50,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.innerText,
    fontWeight: '600',
  },
  note: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.subtext,
    marginTop: 10,
    textAlign: 'center',
  },
});
