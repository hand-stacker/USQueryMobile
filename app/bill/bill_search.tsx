import React, { useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillList from "../components/bill_list";
import NavReturn from "../components/nav_return";
import SearchBar from "../components/search_bar";
import useGetRecentBills from "../hooks/useGetRecentBills";
interface Props {
    navigation: any;
}

export default function BillSearch({navigation}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { bills, loading, error, refetch } = useGetRecentBills(undefined, undefined, 119, undefined, undefined);
  
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
  //const {data: bills, loading : billsLoading, reset, error: billsError} = null
  return (
    <SafeAreaView style={styles.container} className="flex-1 bg-primary">
      <View style={styles.form}>
        <NavReturn onPress={() => navigation.goBack()}></NavReturn>
        <Text style={styles.text}>Search for bills with select topics:</Text>
        <SearchBar
          placeholder="Specify a topic..."
          value={searchQuery}
          onChangeText={(text : string) => setSearchQuery(text)}
        />
        <Button title="Search" onPress={()=> console.log({searchQuery})} color="black"/>
      </View>
      <BillList data={edges} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(
  {
    container:{
      flex:1,
      marginTop:30,
      backgroundColor:'#f5f5f5',
      paddingHorizontal:'12%',
      paddingTop:'5%',
      paddingBottom:'20%',
    },
    form: {
      backgroundColor:'white',
      padding:20,
      borderRadius:10,
      shadowColor:'black',
      shadowOffset:{
        width:0,
        height:2
      },
      shadowOpacity:0.30,
      shadowRadius: 6,
      elevation:5,
      marginBottom:20,
    },
    text:{
      fontSize:16,
      marginBottom:5,
      fontWeight:'bold'
    },
    backButton:{}
  }
)