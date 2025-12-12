import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionList from "../components/action_list";
import NavReturn from "../components/nav_return";
import useGetBill from "../hooks/useGetBill";
interface BillInfoProps {
  navigation: any;
    route: any;
}

export default function BillInfo({ navigation, route }: BillInfoProps) {
  const { bill_id } = route.params;
  const { bill, loading, error, refetch } = useGetBill(bill_id);

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
          <View><NavReturn onPress={() => navigation.goBack()}></NavReturn></View>
          <Text style={styles.large_text}>Bill Info Regular : {bill_id}</Text>
          <Text style={styles.large_text}>Title : {bill.title}</Text>
          <ScrollView>
            <Text style={styles.text}>Summary : {bill.summary}</Text>
            <ActionList data={bill.actions} />
          </ScrollView>
          

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
  },
  large_text:{
    fontSize:24,
    fontWeight:'600',
    marginBottom:12,
    color:'white',
  },
  text:{
    fontSize:16,
    marginBottom:5,
    color:'white',
  },
})