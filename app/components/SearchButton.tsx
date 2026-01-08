import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  highlighted?: boolean;
  onPress?: () => void;
}

const SearchButton = ({ onPress, highlighted }: Props) => {
  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Search"
      accessible
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.inner}>
        <Ionicons name="search" size={30} color={highlighted ? '#0073ffff' : 'black'} />
      </View>
    </Pressable>
  );
}

export default SearchButton;

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
});