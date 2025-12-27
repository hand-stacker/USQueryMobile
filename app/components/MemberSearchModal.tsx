import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DropdownSelect from "./DropdownSelect";
import NavReturn from "./NavReturn";

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
  const [selectedCongress, setSelectedCongress] = useState<number | undefined>(initial?.congress ?? 119);
  const [selectedChamber, setSelectedChamber] = useState<string | undefined>(initial?.chamber ?? 'All');
  const [selectedState, setSelectedState] = useState<string | undefined>(initial?.state ?? 'All');

  const state_list = ['All','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];
  const congress_list = [119,118,117,116,115,114,113,112];
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
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.form}>
          <NavReturn onPress={onClose} />
          <Text style={styles.title}>Search for Representatives:</Text>
          <Text style={styles.subtitle}>Select Congress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {congress_list.map((num)=> (
              <Pressable key={num} onPress={()=> setSelectedCongress(num)} style={[styles.chip, selectedCongress===num && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedCongress===num && styles.chipTextSelected]}>{num}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.subtitle}>Select Chamber</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {chamber_list.map((bt)=> (
              <Pressable key={bt} onPress={()=> setSelectedChamber(bt)} style={[styles.chip, selectedChamber===bt && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedChamber===bt && styles.chipTextSelected]}>{bt}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.subtitle}>Select State</Text>
          <DropdownSelect value={selectedState} placeholder="Select State" onChange={setSelectedState} />
          <Pressable style={styles.searchButton} onPress={onPressSearch} android_ripple={{color:'#00000010'}}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create(
  {
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: 20 
    },
    form: {
      backgroundColor: 'white',
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 20,
      gap: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: 6,
    },
    subtitle: {
      color: '#475569',
      marginBottom: 10,
      fontSize: 14,
      marginTop:8,
      fontWeight:'600'
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: '#f8fafc',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#e6e9ee',
    },
    chipSelected: {
      backgroundColor: '#0b1226',
      borderColor: '#0b1226',
    },
    chipText: {
      color: '#0f172a',
      fontWeight: '600',
      fontSize: 14,
    },
    chipTextSelected: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    searchButton: {
      marginTop: 18,
      backgroundColor: '#0b1226',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    searchButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
    }
  }
)
