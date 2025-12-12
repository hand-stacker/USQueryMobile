import { FlatList, StyleSheet, View } from "react-native";
import BillInfographic from "./infographic";
interface Props {
    data: any;
}
const BillList = ({data}:Props)=> {
    return (
        <View>
            <FlatList
                data={data}
                renderItem={({ item }) => {
                // item may be either the `node` wrapper from GraphQL or the local test item
                const node = item.node ?? item;
                return (
                    <BillInfographic key={node.id}
                    billId={node.id}
                    billNum={node.billNum ?? node.id}
                    billSummary={node.summary ?? node.billSummary}
                    billTitle={node.title ?? node.billTitle}
                    billType={node.billType ?? 'bill'} />
                );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListFooterComponent={() => <View style={{height:50}} />}
            />
        </View>
    );
}

export default BillList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)