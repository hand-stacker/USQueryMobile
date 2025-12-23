import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

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
    color = "black",
    accessibilityLabel = "Close",
    style,
}: Props) => {
    const containerSize = size + 20;

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
            <AntDesign name="close" size={size} color={color} />
        </Pressable>
    );
};

export default CloseButton;

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "rgba(0,0,0,0.6)",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    pressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },
});