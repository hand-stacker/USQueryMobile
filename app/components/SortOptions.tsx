import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../theme/themeContext";

const SORT_OPTIONS = [
  { label: 'Date', value: 'datedesc' },
  { label: 'Match', value: 'match' },
];

interface Props {
  sortType: string;
  onSortChange: (sort: string) => void;
  disabled?: boolean;
}

const SortOptions = ({ sortType, onSortChange, disabled = false }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [collapsed, setCollapsed] = useState(false);

  const currentLabel = SORT_OPTIONS.find(o => o.value === sortType)?.label ?? sortType;

  return (
    <View style={[styles.wrapper, disabled && { opacity: 0.4 }]}>
      <Pressable style={styles.header} onPress={disabled ? undefined : () => setCollapsed(c => !c)}>
        <Text style={styles.headerLabel}>
          Sort: <Text style={styles.headerValue}>{currentLabel}</Text>
        </Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={theme.subtext}
        />
      </Pressable>
      {!collapsed && (
        <View style={styles.options}>
          {SORT_OPTIONS.map(opt => {
            const active = sortType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.pill, active && styles.pillActive]}
                onPress={disabled ? undefined : () => onSortChange(opt.value)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default SortOptions;

const createStyles = (theme: any) => StyleSheet.create({
  wrapper: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLabel: {
    color: theme.subtext,
    fontSize: 13,
    fontWeight: '500',
  },
  headerValue: {
    color: theme.text,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.secondary,
  },
  pillActive: {
    backgroundColor: theme.primary,
  },
  pillText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: theme.innerText,
    fontWeight: '600',
  },
});
