import React, { useContext, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/themeContext";
import scaleFont from "../utils/scaleFont";
import CloseButton from "./CloseButton";
import MultiSelectComponent from "./MultiSelect";

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
  desc?: string;
}

export default function BillSearchModal({ visible, onClose, onSearch, initial, subjects, desc}: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
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
  
    const numToDate = (type: number | string) => {
    switch(type) {
        case 119: return '119 (2025-2027)';
        case 118: return '118 (2023-2025)';
        case 117: return '117 (2021-2023)';
        case 116: return '116 (2019-2021)';
        case 115: return '115 (2017-2019)';
        case 114: return '114 (2015-2017)';
        case 113: return '113 (2013-2015)';
        case 112: return '112 (2011-2013)';}}   

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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay} edges={["top"]}>
        <View style={styles.form}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{desc ?? 'Search Bills'}</Text>
            <CloseButton onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Select Congress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:8}}>
            {[119,118,117,116,115,114,113,112].map((num)=> (
              <Pressable key={num} onPress={()=> setSelectedCongress(num)} style={[styles.chip, selectedCongress===num && styles.chipSelected]}>
                <Text style={[styles.chipText, selectedCongress===num && styles.chipTextSelected]}>{numToDate(num)}</Text>
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
            maxContainerHeight={scaleFont(200)}
          />

          <Pressable style={styles.searchButton} onPress={onPressSearch} android_ripple={{color:'#00000010'}}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.overlay,
  },
  form: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: theme.background,
    padding: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: theme.shadow,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    maxWidth: '80%',
    color: theme.titleText,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.subtext,
    marginBottom: 10,
    fontSize: 14,
    marginTop:8,
    fontWeight:'600'
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: theme.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextSelected: {
    color: theme.innerText,
    fontWeight: '600',
    fontSize: 14,
  },
  searchButton: {
    marginBottom: 30,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    textAlign: 'center',
    color: theme.innerText,
    fontWeight: '700',
    fontSize: 16,
  }
});