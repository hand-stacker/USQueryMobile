import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import BillInfographic from "./BillInfographic";
interface Props {
    data: any;
    navigator: any;
    onEndReached?: () => void;
    loadingMore?: boolean;
}

const BillList = ({data, navigator, onEndReached, loadingMore}:Props)=> {

    const renderItem = ({ item }: any) => {
        const node = item.node ?? item;
        return (
            <BillInfographic key={node.id}
            navigator={navigator}
            billId={node.id}
            billNum={node.billNum ?? node.id}
            billSummary={node.summary ?? node.billSummary?? 'No summary available.'}
            billTitle={node.title ?? node.billTitle}/>);
    };
  
    return (
        <FlatList
            data={data}
            contentContainerStyle={styles.container}
            keyExtractor={(item: any) => (item.node?.id ?? item.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => loadingMore ? <View style={{padding:12, alignItems:'center'}}><ActivityIndicator /></View> : <View style={{height:50}} />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={8}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={true}
        />
    );
}

export default BillList;

const styles = StyleSheet.create(
    {
        container: {
            paddingHorizontal: 12,
            paddingBottom: 0,
            paddingTop: 8,
            backgroundColor: '#f8fafc',
        }
    }
)