import React, { useContext, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/themeContext";
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
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [selectedCongress, setSelectedCongress] = useState<number | undefined>(initial?.congress ?? 119);
  const [selectedChamber, setSelectedChamber] = useState<string | undefined>(initial?.chamber ?? 'All');
  const [selectedState, setSelectedState] = useState<string | undefined>(initial?.state ?? 'All');
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
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <NavReturn onPress={onClose} />
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
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20 
  },
  form: {
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 14,
    shadowColor: theme.shadow,
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
    color: theme.text,
    marginBottom: 6,
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
    marginTop: 18,
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
    color: theme.innerText,
    fontWeight: '700',
    fontSize: 16,
  }
});