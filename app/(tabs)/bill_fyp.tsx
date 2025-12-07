import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import testBillList from '../../assets/testBillData.json';
import BillInfographic from '../bill/infographic';
import useRecentBills from "../hooks/useGetRecentBills";

export default function BillFYP() {
  const { bills, loading, error, refetch } = useRecentBills(undefined, undefined, 119, undefined, [664,782]);
  
  // `bills` may be the GraphQL connection object or an array/falsy value.
  // Prefer server data when available; otherwise fall back to local `testBillList`.
  const edges = Array.isArray(bills)
    ? []
    : (bills && (bills.edges ?? []));

  const dataSource = edges.length > 0 ? edges : testBillList;
  console.log(edges);

  if (loading) return (
    <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </View>
  );

  if (error) return (
    <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading bills: {error.message}</Text>
    </View>
  );

  return (
    <View
      style={styles.container}
      className="flex-1 bg-primary"
    >
      <FlatList
        data={dataSource}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingVertical:'20%',
  }
})