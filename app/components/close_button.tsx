import { Pressable, StyleSheet, Text } from "react-native";
interface Props {
    onPress?: () => void;
}
const CloseButton = ({onPress}: Props) => {
    return (
        <Pressable
            onPress={(onPress)}
            style={styles.container}
            accessibilityRole="button"
        >
            <Text style={styles.text}>X</Text>
        </Pressable>
    );
}

export default CloseButton;

const styles = StyleSheet.create(
    {
        container:{
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            backgroundColor: 'black',
            borderRadius: 10,
        },
        text : {
            fontSize:16,
            color:'#ffffff',
            fontWeight: '600',
        },
    }
)