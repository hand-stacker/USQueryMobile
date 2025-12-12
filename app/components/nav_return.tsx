import { Pressable, StyleSheet, Text } from "react-native";


interface Props {
    onPress?: () => void;
}

export default function NavReturn({ onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            style={styles.backButton}
            accessibilityRole="button"
        >
            <Text style={styles.text}>Go Back</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create(
    {
        backButton:{ },
        text : {
            fontSize:16,
            marginBottom:5,
            fontWeight:'bold'
        }
    }
)