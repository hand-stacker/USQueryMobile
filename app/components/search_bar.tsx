import { StyleSheet, TextInput, View } from "react-native";
interface Props {
    placeholder: string;
    onPress?: () => void;
    value : string;
    onChangeText : (text : string) => void;
}
const SearchBar = ({placeholder, onPress, value, onChangeText}:Props)=> {
    return (
        <View className="flex-row items-center rounded-full">
            <TextInput
                onPress={onPress}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="grey"
                style={styles.input}
            />
        </View>
    );
}

export default SearchBar;

const styles = StyleSheet.create(
    {
        input:{
           borderWidth:1,
           borderColor:'#ddd',
           marginBottom:15,
           height:40,
           width:"100%",
           padding:10
        }
    }
)