import React from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import VoteInfographic from "./VoteInfographic";
interface Props {
    data: any;
    personal: boolean;
    navigation: any;
    onEndReached?: () => void;
    loadingMore?: boolean;
}

const VoteList = ({data, personal, navigation, onEndReached, loadingMore}:Props)=> {

  const renderItem = ({ item }: any) => {
    const node = item.node ?? item;
    return <VoteInfographic node={node} personal={personal} navigation={navigation} />;
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item: any, idx: number) => {
        // Ensure uniqueness by appending the index — prevents duplicate-key crashes
        const base = String(item?.node?.id ?? item?.id ?? idx);
        return `${base}_${idx}`;
      }}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={() => loadingMore ? <View style={{padding:12, alignItems:'center'}}><ActivityIndicator /></View> : <View style={{height:50}} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.container}
      initialNumToRender={8}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews={true}
    />
  );
}

export default VoteList;

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