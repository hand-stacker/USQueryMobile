import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
    personal: boolean;
    navigation: any;
    onEndReached?: () => void;
    loadingMore?: boolean;
}


function navToBill(navigation: any, id: any) {
  navigation.navigate("Bill_info", {bill_id: id});
}

function navToVote(navigation: any, id: any) {
  navigation.navigate("Vote_info", {vote_id: id});
}
const VoteList = ({data, personal, navigation, onEndReached, loadingMore}:Props)=> {
    return (
        <FlatList
            data={data}
            keyExtractor={(item: any) => (item.node?.id ?? item.id)}
            renderItem={({ item }) => {
            const node = item.node ?? item;
            return (
                <View style={styles.text}>
                    <Text>{node.dateTime}</Text>
                    {personal && (
                        <Pressable onPress={() => navToBill(navigation, node.bill)}>
                            <Text>Bill : {node.bill}</Text>
                        </Pressable>
                    )}
                    {!personal && (
                        <Pressable onPress={() => navToBill(navigation, node.bill.id)}>
                            <Text>Bill : {node.bill.id}</Text>
                        </Pressable>
                    )}
                    <Pressable onPress={() => navToVote(navigation, node.id)}>
                        <Text>Vote : {node.id}</Text>
                    </Pressable>
                    {personal && <Text>Vote : {node.mem_vote}</Text>}
                    {!personal && <Text>Result : {node.result}</Text>}
                </View>
            );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => loadingMore ? <View style={{padding:12, alignItems:'center'}}><ActivityIndicator /></View> : <View style={{height:50}} />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
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