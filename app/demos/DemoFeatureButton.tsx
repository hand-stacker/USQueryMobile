import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeContext } from '../theme/themeContext';

interface Props {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

/** Tinted CTA button used inside the What's New carousel to jump to a feature. */
export default function DemoFeatureButton({ label, icon, onPress }: Props) {
  const { theme } = useContext(ThemeContext);
  const s = styles(theme);

  return (
    <View style={s.container}>
      <Pressable
        style={({ pressed }) => [s.button, pressed && { opacity: 0.72 }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon && <Ionicons name={icon} size={18} color={theme.primary} />}
        <Text style={s.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
      </Pressable>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.primary + '22',
    borderWidth: 1,
    borderColor: theme.primary + '55',
  },
  label: {
    flexShrink: 1,
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
