import { ThemeContext } from "@/app/theme/themeContext";
import { useContext, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const VOTE_COLORS = {
  yea:  '#22c55e',
  nay:  '#ef4444',
  pres: '#f59e0b',
  novt: '#6b7280',
};

interface Props {
  yeas: number;
  nays: number;
  pres: number;
  novt: number;
}

export default function VoteBar({ yeas, nays, pres, novt }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const total = yeas + nays + pres + novt;

  const segments = useMemo(() => [
    { count: yeas, color: VOTE_COLORS.yea,  label: 'Yea' },
    { count: nays, color: VOTE_COLORS.nay,  label: 'Nay' },
    { count: pres, color: VOTE_COLORS.pres, label: 'Present' },
    { count: novt, color: VOTE_COLORS.novt, label: 'No Vote' },
  ].filter(s => s.count > 0), [yeas, nays, pres, novt]);

  if (total === 0) return null;

  return (
    <View>
      <View style={styles.bar}>
        {segments.map(s => (
          <View key={s.label} style={[styles.segment, { flex: s.count, backgroundColor: s.color }]} />
        ))}
      </View>
      <View style={styles.legend}>
        {segments.map(({ label, count, color }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.legendLabel, { color }]}>{label}</Text>
            <Text style={styles.legendCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  bar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  segment: { alignSelf: 'stretch' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: 12, fontWeight: '700' },
  legendCount: { fontSize: 12, color: theme.subtext },
});
