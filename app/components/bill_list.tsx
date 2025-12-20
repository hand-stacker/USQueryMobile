import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import BillInfographic from "./bill_infographic";
interface Props {
    data: any;
    navigator: any;
    onEndReached?: () => void;
    loadingMore?: boolean;
}

const BillList = ({data, navigator, onEndReached, loadingMore}:Props)=> {
    return (
        <FlatList
            data={data}
            keyExtractor={(item: any) => (item.node?.id ?? item.id)}
            renderItem={({ item }) => {
            // item may be either the `node` wrapper from GraphQL or the local test item
            const node = item.node ?? item;
            return (
                <BillInfographic key={node.id}
                navigator={navigator}
                billId={node.id}
                billNum={node.billNum ?? node.id}
                billSummary={node.summary ?? node.billSummary?? 'No summary available.'}
                billTitle={node.title ?? node.billTitle}
                billType={node.billType ?? 'bill'} />
            );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => loadingMore ? <View style={{padding:12, alignItems:'center'}}><ActivityIndicator /></View> : <View style={{height:50}} />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
        />
    );
}

export default BillList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)