import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  result: string;
}

export default function ResultBadge({result}: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const resultPassed = typeof result === 'string' && /pass|yea|aye|agreed|accepted|well/i.test(result);
  const resultFailed = typeof result === 'string' && /fail|nay|no|rejected|defeated/i.test(result);
  return (
    <View style={styles.labelContainer}>
      <View style={[styles.labelBar, resultPassed ? styles.colorPassed : resultFailed ? styles.colorFailed : styles.colorNeutral]} />
      <Text style={styles.label} >
          {result ?? '—'}
        </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  labelBar: {
    width: 4,
    height: '90%',
    borderRadius: 2,
    marginRight: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 8,
  },
  colorPassed: {
    backgroundColor: "#16A34A",
  },
  colorFailed: {
    backgroundColor: "#EF4444",
  },
  colorNeutral: {
    backgroundColor: theme.primary,
  },
  label: {
    fontSize: 16,
    color: theme.text,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    width:'80%'
  }
});