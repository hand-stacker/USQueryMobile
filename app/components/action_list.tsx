import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
}
const ActionList = ({data}:Props)=> {
    return (
        <View>
            <FlatList
                data={data}
                renderItem={({ item }) => {
                // item may be either the `node` wrapper from GraphQL or the local test item
                const node = item.node ?? item;
                return (
                    <View style={styles.text}>
                        <Text>{node.actionDate} : {node.text}</Text>
                        {node.voteId && (
                            <Pressable onPress={() => {console.log(node.voteId)}}>
                                <Text>Vote</Text>
                            </Pressable>
                        )}
                    </View>
                );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListFooterComponent={() => <View style={{height:50}} />}
            />
        </View>
    );
}

export default ActionList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)