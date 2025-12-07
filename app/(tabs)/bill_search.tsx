import React, { useState } from "react";
import { Button, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import SearchBar from "../components/search_bar";

export default function BillSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  //const {data: bills, loading : billsLoading, reset, error: billsError} = null
  return (
    <KeyboardAvoidingView
    behavior="padding"
    className="flex-1"
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.text}>Search for bills with select topics:</Text>
        <SearchBar
          placeholder="Specify a topic..."
          value={searchQuery}
          onChangeText={(text : string) => setSearchQuery(text)}
        />
        <Button title="Search" onPress={()=> console.log({searchQuery})} color="black"/>
      </View>
       
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create(
  {
    container:{
      flex:1,
      justifyContent:'center',
      paddingHorizontal:20,
      marginTop:50,
      backgroundColor:'#f5f5f5'
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
      elevation:5
    },
    text:{
      fontSize:16,
      marginBottom:5,
      fontWeight:'bold'
    }
  }
)