import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillList from "../components/bill_list";
import SearchButton from "../components/search_button";
import useGetRecentBills from "../hooks/useGetRecentBills";
export default function BillFYP( {navigation} : any) {
  const { bills, loading, error, refetch } = useGetRecentBills(undefined, undefined, 119, undefined, [686,782]);
  
  // `bills` may be the GraphQL connection object or an array/falsy value.
  // Prefer server data when available; otherwise fall back to local `testBillList`.
  const edges = Array.isArray(bills)
    ? []
    : (bills && (bills.edges ?? []));

  if (loading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading bills: {error.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView
      style={styles.container}
      className="flex-1 bg-primary"
    >
      <SearchButton description="Search for Specific Bills" onPress={()=> navigation.navigate('Bill_search')} />
      <BillList data={edges} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
  }
})