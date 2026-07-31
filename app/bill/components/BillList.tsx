import EmptyPage from "@/app/components/EmptyPage";
import { ThemeContext } from "@/app/theme/themeContext";
import { useCallback, useContext } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import BillInfographic from "./BillInfographic";
interface Props {
  data: any;
  navigator: any;
  onEndReached?: () => void;
  loadingMore?: boolean;
  highlight?: number[];
}

const BillList = ({data, navigator, onEndReached, loadingMore, highlight = []}:Props)=> {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const renderItem = useCallback(({ item }: any) => {
    const node = item.node ?? item;
    const isHighlighted = highlight.length > 0 && highlight.includes(Number(node.id));
    return (
      <BillInfographic key={node.id}
      navigator={navigator}
      billId={node.id}
      billNum={node.billNum ?? node.id}
      statusCode={node.statusCode ?? 0}
      billTitle={node.title ?? node.billTitle}
      latestAction={node.latestAction}
      highlighted={isHighlighted}
      />);
}, [navigator, highlight]);

  return (
    <FlatList
      data={data}
      contentContainerStyle={styles.container}
      keyExtractor={(item: any) => (item.node?.id ?? item.id)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={() => loadingMore ? <View style={{padding:12, alignItems:'center'}}><ActivityIndicator /></View> : <View style={{height:50}} />}
      onEndReached={onEndReached}
      ListEmptyComponent={EmptyPage}
      onEndReachedThreshold={0.5}
      initialNumToRender={15}
      maxToRenderPerBatch={20}
      windowSize={10}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => ({
        length: 120, // Approximate height of each item
        offset: 120 * index + 12 * index, // Height + separator
        index,
      })}
    />
  );
}

export default BillList;

const createStyles = (theme : any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingBottom: 0,
      paddingTop: 8,
    }
  });