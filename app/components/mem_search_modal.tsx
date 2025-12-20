import React, { useState } from "react";
import { Button, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "./nav_return";

interface SearchVars {
  congress: number |  undefined;
  chamber: string | undefined;
  state: string | undefined;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: (vars: SearchVars) => void;
  initial?: SearchVars;
}

export default function MemberSearchModal({ visible, onClose, onSearch, initial}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCongress, setSelectedCongress] = useState<number | undefined>(initial?.congress ?? 119);
  const [selectedChamber, setSelectedChamber] = useState<string | undefined>(initial?.chamber ?? 'All');
  const [selectedState, setSelectedState] = useState<string | undefined>(initial?.state ?? 'All');

  const state_list = ['All','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];
  const congress_list = [112,113,114,115,116,117,118,119];
  const chamber_list = ['House','Senate'];
  const onPressSearch = () => {
    const variables: any = {
        congress: selectedCongress,
        chamber: selectedChamber,
        state: selectedState,
    };
    onSearch(variables);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <NavReturn onPress={onClose} />
          <Text style={styles.text}>Search for representatives:</Text>
          <Text style={{marginTop:8, fontWeight:'600'}}>Congress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {congress_list.map((num)=> (
              <Pressable key={num} onPress={()=> setSelectedCongress(num)} style={[styles.chip, selectedCongress===num && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedCongress===num && styles.chipTextSelected]}>{num}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{marginTop:8, fontWeight:'600'}}>Chamber</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {chamber_list.map((bt)=> (
              <Pressable key={bt} onPress={()=> setSelectedChamber(bt)} style={[styles.chip, selectedChamber===bt && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedChamber===bt && styles.chipTextSelected]}>{bt}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{marginTop:8, fontWeight:'600'}}>State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {state_list.map((bt)=> (
              <Pressable key={bt} onPress={()=> setSelectedState(bt)} style={[styles.chip, selectedState===bt && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedState===bt && styles.chipTextSelected]}>{bt}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button title="Search" onPress={onPressSearch} color="black" />
        </View>
      </SafeAreaView>
    </Modal>
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
    chip: {
      paddingHorizontal:12,
      paddingVertical:8,
      marginRight:8,
      backgroundColor:'#efefef',
      borderRadius:20,
    },
    chipSelected: {
      backgroundColor:'black',
    },
    chipText: {
      color:'#333'
    },
    chipTextSelected: {
      color:'white'
    }
  }
)
