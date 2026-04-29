import { ThemeContext } from '@/app/theme/themeContext';
import React, { Fragment, useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const STAGES = ['INTRODUCED', 'IN COMMITTEE', 'PASSED SENATE', 'PASSED HOUSE', 'ENACTED'] as const;

interface Props {
  currentStage: number; // 0–4
}

export default function BillProgressCard({ currentStage }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={styles.labelBar} />
        <Text style={styles.labelText}>LEGISLATIVE PROGRESS</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
        {STAGES.map((stage, i) => {
          const done = i < currentStage;
          const active = i === currentStage;
          return (
            <Fragment key={stage}>
              <View style={styles.stageCol}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]} />
                <Text style={[styles.stageLabel, done && styles.stageDone, active && styles.stageActive]}>
                  {stage}
                </Text>
              </View>
              {i < STAGES.length - 1 && (
                <View style={[styles.connector, done && styles.connectorDone]} />
              )}
            </Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginRight: 8,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.subtext,
    letterSpacing: 0.8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  stageCol: {
    alignItems: 'center',
    width: 72,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.inactive,
    borderWidth: 1.5,
    borderColor: theme.border,
    marginBottom: 6,
  },
  dotDone: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderColor: 'rgba(34,197,94,0.4)',
    borderWidth: 2,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 8.5,
    fontWeight: '400',
    color: theme.subtext,
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 12,
  },
  stageDone: {
    color: theme.primary,
    fontWeight: '600',
  },
  stageActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
  connector: {
    height: 1.5,
    width: 20,
    backgroundColor: theme.border,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  connectorDone: {
    backgroundColor: theme.primary,
  },
});
