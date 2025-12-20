import React, { useState } from "react";
import { Button, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "./nav_return";
import SearchBar from "./search_bar";

interface SearchVars {
  after?: string | null;
  bill_type?: string | undefined;
  first?: number | undefined;
  congress_num?: number | undefined;
  subject_list?: number[] | undefined;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: (vars: SearchVars) => void;
  initial?: SearchVars;
  subjects: any[];
}

export default function BillSearchModal({ visible, onClose, onSearch, initial, subjects }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCongress, setSelectedCongress] = useState<number | undefined>(initial?.congress_num ?? 119);
  const [selectedBillType, setSelectedBillType] = useState<string | undefined>(initial?.bill_type ?? '!');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(initial?.subject_list ?? []);

  const typeToText = (type: string | undefined) => {
    switch(type) {
        case '!': return 'All';
        case '!H': return 'House';
        case '!S': return 'Senate';
        case 's': return 'S.';
        case 'sres': return 'S.Res';
        case 'sconres': return 'S.Con.Res';
        case 'sjres': return 'S.J.Res';
        case 'hr': return 'H.R.';
        case 'hres': return 'H.Res.';
        case 'hconres': return 'H.Con.Res';
        case 'hjres': return 'H.J.Res';}}   

  const onPressSearch = () => {
    const variables: any = {
      after: null,
      bill_type: selectedBillType ?? undefined,
      first: 10,
      congress_num: selectedCongress ?? undefined,
      subject_list: selectedSubjects.length ? selectedSubjects : undefined,
    };
    onSearch(variables);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <NavReturn onPress={onClose} />
          <Text style={styles.text}>Search for bills with select topics:</Text>
          <SearchBar
            placeholder="Specify a topic..."
            value={searchQuery}
            onChangeText={(text: string) => setSearchQuery(text)}
          />

          <Text style={{marginTop:8, fontWeight:'600'}}>Congress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {[112,113,114,115,116,117,118,119].map((num)=> (
              <Pressable key={num} onPress={()=> setSelectedCongress(num)} style={[styles.chip, selectedCongress===num && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedCongress===num && styles.chipTextSelected]}>{num}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{marginTop:8, fontWeight:'600'}}>Bill Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {['!','!H','!S','s','sres','sconres','sjres','hr','hres','hconres','hjres'].map((bt)=> (
              <Pressable key={bt} onPress={()=> setSelectedBillType(prev => prev===bt? undefined: bt)} style={[styles.chip, selectedBillType===bt && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedBillType===bt && styles.chipTextSelected]}>{typeToText(bt)}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{marginTop:8, fontWeight:'600'}}>Subjects (multi-select)</Text>
          <View style={{maxHeight:140, marginVertical:8}}>
            <ScrollView>
              <View style={{flexDirection:'row', flexWrap:'wrap'}}>
                {subjects.map((s: any)=> (
                  <Pressable key={s.id} onPress={()=> {
                      setSelectedSubjects(prev => prev.includes(s.id) ? prev.filter(x=> x!==s.id) : [...prev, Number(s.id)]);
                    }}
                    style={[styles.chip, selectedSubjects.includes(s.id) && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selectedSubjects.includes(s.id) && styles.chipTextSelected]}>{s.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
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
