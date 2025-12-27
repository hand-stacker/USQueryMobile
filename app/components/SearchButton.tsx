import { AntDesign } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    label?: string;
    onPress?: () => void;
}

const SearchButton = ({ label = "Search", onPress }: Props) => {
    return (
        <Pressable
            onPress={onPress}
            style={styles.container}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessible
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <View style={styles.inner}>
                <AntDesign name="search" size={18} color="white" />
                <Text style={styles.text}>{label}</Text>
            </View>
        </Pressable>
    );
}

export default SearchButton;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "black",
        borderRadius: 10,
        paddingHorizontal: 12,
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