import { ThemeContext } from "@/app/theme/themeContext";
import React, { useContext, useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  accentColor: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function AccentCard({ accentColor, children, style }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[
      styles.card,
      {
        borderColor: accentColor,
      },
      style,
    ]}>
      {children}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderRadius: 10,
      borderColor: theme.border,
      padding: 12,
      borderLeftWidth: 3,
      marginBottom: 10,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowColor: theme.shadow,
      shadowRadius: 3,
      elevation: 1,
      backgroundColor: theme.card,
    },
  });
