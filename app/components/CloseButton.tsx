import { AntDesign } from "@expo/vector-icons";
import React, { useContext } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { ThemeContext } from "../theme/themeContext";

interface Props {
  onPress?: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const CloseButton = ({
  onPress,
  size = 20,
  accessibilityLabel = "Close",
  style,
}: Props) => {
  const containerSize = size + 20;
  const { theme } = useContext(ThemeContext);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: containerSize, height: containerSize, borderRadius: containerSize / 2 },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
    >
      <AntDesign name="close" size={size} color={theme.text} />
    </Pressable>
  );
};

export default CloseButton;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});