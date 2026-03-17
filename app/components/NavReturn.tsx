import { AntDesign } from "@expo/vector-icons";
import { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../theme/themeContext";

interface Props {
  onPress?: () => void;
  label?: string;
}

export default function NavReturn({ onPress, label = "Back" }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessible
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.inner}>
        <AntDesign name="arrow-left" size={20} color={theme.text} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 15,
    color: theme.text,
    fontWeight: "600",
  },
});