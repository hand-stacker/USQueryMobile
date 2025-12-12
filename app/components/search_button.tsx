import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text } from "react-native";
interface Props {
    description: string;
    onPress?: () => void;
}
const SearchButton = ({ description, onPress}: Props) => {
    const navigation = useNavigation();
    return (
        <Pressable
            onPress={(onPress)}
            style={styles.container}
            accessibilityRole="button"
        >
            <Text style={styles.text}>{description}</Text>
        </Pressable>
    );
}

export default SearchButton;

const styles = StyleSheet.create(
    {
        container:{
            width: '100%',
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            backgroundColor: 'black',
            borderRadius: 10,
            paddingHorizontal: 12,
        },
        text : {
            fontSize:16,
            color:'#ffffff',
            fontWeight: '600',
        },
    }
)