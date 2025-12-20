import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
    personal: boolean;
    navigation: any;
}


function navToBill(navigation: any, vote: any) {
  navigation.navigate("Bill_info", {bill_id: vote.bill});
}

function navToVote(navigation: any, vote: any) {
  navigation.navigate("Vote_info", {vote_id: vote.id});
}
const VoteList = ({data, personal, navigation}:Props)=> {
    return (
        <FlatList
            data={data}
            renderItem={({ item }) => {
            // item may be either the `node` wrapper from GraphQL or the local test item
            const node = item.node ?? item;
            return (
                <View style={styles.text}>
                    <Text>{node.dateTime}</Text>
                    {node.bill && (
                        <Pressable onPress={() => navToBill(navigation, node)}>
                            <Text>Bill : {node.bill}</Text>
                        </Pressable>
                    )}
                    {node.id && (
                        <Pressable onPress={() => navToVote(navigation, node)}>
                            <Text>Vote : {node.id}</Text>
                        </Pressable>
                    )}
                    {personal && <Text>Vote : {node.mem_vote}</Text>}
                    {!personal && <Text>Result : {node.result}</Text>}
                </View>
            );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
        />
    );
}

export default VoteList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)