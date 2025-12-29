import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseButton from '../components/CloseButton';
import MultiSelect from '../components/MultiSelect';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SelectFavoritesModal({ visible, onClose }: Props) {
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();
  const favorites = useFavoritesStore(s => s.favorites);
  const hydrated = useFavoritesStore(s => s._hasHydrated);
  const setFavorites = useFavoritesStore(s => s.setFavorites);

  const handleChange = (vals: string[]) => {
    const ids = (vals ?? []).map(v => Number(v));
    // Replace favorites atomically to avoid transient empty-state writes
    setFavorites(ids);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Select Favorite Subjects</Text>
          <CloseButton onPress={onClose} />
        </View>

        {subjectsLoading ? (
          <ActivityIndicator />
        ) : subjectsError ? (
          <Text>Error loading subjects</Text>
        ) : !hydrated ? (
          <ActivityIndicator />
        ) : (
          <MultiSelect
            data={subjects}
            value={favorites.map(String)}
            placeholder="Choose subjects"
            onChange={(next) => handleChange(next)}
            maxContainerHeight={450}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  closeText: {
    color: 'white',
  },
});
