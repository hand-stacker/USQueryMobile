import { ThemeContext } from '@/app/theme/themeContext';
import { useContext, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getBillStatusInfo } from '../utils/billStatusLabel';

interface Props {
  statusCode: number;
  isHouse: boolean;
}

export default function BillStatusTag({ statusCode, isHouse }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const { label, color } = useMemo(() => getBillStatusInfo(statusCode, isHouse), [statusCode, isHouse]);

  const dotColor = color === 'green' ? '#22c55e'
    : color === 'blue' ? theme.primary
    : color === 'red' ? '#ef4444'
    : theme.inactive;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
  },
});
