import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
    personal?: boolean;
}

export type BillStackParamList = {
    Bill_FYP: undefined;
    Bill_search: undefined;
    Bill_info: { bill_id: string };
    Vote_info: { vote_id: string };
};

export type TabParamList = {
  'Bill Stack': {
    screen: keyof BillStackParamList;
    params?: BillStackParamList[keyof BillStackParamList];
  };
  'Member Stack': undefined
};

const VoteList = ({data, personal}:Props)=> {
    const navigator = useNavigation<NativeStackNavigationProp<TabParamList>>();

    const navToVote = (vote: any) => {
        navigator.navigate('Bill Stack', {
            screen: 'Vote_info',
            params: {vote_id: vote.id},
        });
    };
    const navToBill = (vote: any) => {
        navigator.navigate('Bill Stack', {
            screen: 'Bill_info',
            params: {bill_id: vote.bill},
        });
    };
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
                        <Pressable onPress={() => navToBill(item)}>
                            <Text>Bill : {node.bill}</Text>
                        </Pressable>
                    )}
                    {node.id && (
                        <Pressable onPress={() => navToVote(item)}>
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