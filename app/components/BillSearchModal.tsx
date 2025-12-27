import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MultiSelectComponent from "./MultiSelect";
import NavReturn from "./NavReturn";

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
  desc: string;
}

export default function BillSearchModal({ visible, onClose, onSearch, initial, subjects, desc}: Props) {
  const [selectedCongress, setSelectedCongress] = useState<number | undefined>(initial?.congress_num ?? 119);
  const [selectedBillType, setSelectedBillType] = useState<string | undefined>(initial?.bill_type ?? '!');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(initial?.subject_list ?? []);

  const typeToText = (type: string | undefined) => {
    switch(type) {
        case '!': return 'All';
        case '!H': return 'House';
        case '!S': return 'Senate';
        case 's': return 'S';
        case 'sres': return 'S.Res';
        case 'sconres': return 'S.Con.Res';
        case 'sjres': return 'S.J.Res';
        case 'hr': return 'HR';
        case 'hres': return 'H.Res.';
        case 'hconres': return 'H.Con.Res';
        case 'hjres': return 'H.J.Res';}}   

  const onPressSearch = () => {
    const variables: any = {
      after: null,
      bill_type: selectedBillType ?? undefined,
      first: 10,
      congress_num: selectedCongress ?? undefined,
      subject_list: selectedSubjects.length ? selectedSubjects.map(Number) : undefined,
    };
    onSearch(variables);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <NavReturn onPress={onClose} />
          <Text style={styles.title}>{desc}</Text>
          <Text style={styles.subtitle}>Select Congress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {[119,118,117,116,115,114,113,112].map((num)=> (
              <Pressable key={num} onPress={()=> setSelectedCongress(num)} style={[styles.chip, selectedCongress===num && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedCongress===num && styles.chipTextSelected]}>{num}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.subtitle}>Select Bill Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {['!','!H','!S','s','sres','sconres','sjres','hr','hres','hconres','hjres'].map((bt)=> (
              <Pressable key={bt} onPress={()=> setSelectedBillType(prev => prev===bt? '!': bt)} style={[styles.chip, selectedBillType===bt && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedBillType===bt && styles.chipTextSelected]}>{typeToText(bt)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <MultiSelectComponent
            data={subjects}
            value={selectedSubjects.map(String)}
            placeholder="Select Subjects"
            onChange={(vals: string[]) => setSelectedSubjects(vals.map(Number))}
          />

          <Pressable style={styles.searchButton} onPress={onPressSearch} android_ripple={{color:'#00000010'}}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </ScrollView>
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
      padding: 18,
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
