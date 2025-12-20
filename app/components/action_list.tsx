import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
    summary_text: string;
}
type RootStackParamList = {
  Vote_info: { vote_id: string };
};

const Summary = (summary_text : string) => {
    return (<Text style={styles.text}>Summary : {summary_text}</Text>)
}

const ActionList = ({data, summary_text}:Props)=> {
    const navigator = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Vote_info'>>();
    return (
        <FlatList
            data={data}
            renderItem={({ item }) => {
            // item may be either the `node` wrapper from GraphQL or the local test item
            const node = item.node ?? item;
            return (
                <View style={styles.text}>
                    <Text>{node.actionDate} : {node.text}</Text>
                    {node.voteId && (
                        <Pressable onPress={() => {navigator.navigate('Vote_info', {vote_id: node.voteId});}}>
                            <Text>Vote</Text>
                        </Pressable>
                    )}
                </View>
            );
            }}
            ListHeaderComponent={() => Summary(summary_text)}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
        />
    );
}

export default ActionList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)