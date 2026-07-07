import React, { useContext } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseButton from '../components/CloseButton';
import MultiSelect from '../components/MultiSelect';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';
import { ThemeContext } from '../theme/themeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SelectFavoritesModal({ visible, onClose }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Select Favorite Subjects</Text>
            <CloseButton onPress={onClose} />
          </View>

          {subjectsLoading ? (
            <ActivityIndicator />
          ) : subjectsError ? (
            <Text style={styles.errorText}>Error loading subjects</Text>
          ) : !hydrated ? (
            <ActivityIndicator />
          ) : (
            <>
              <MultiSelect
                data={subjects}
                value={favorites.map(String)}
                placeholder="Choose subjects"
                onChange={(next) => handleChange(next)}
                maxContainerHeight={450}
              />
              {favorites.length === 0 && (
                <Text style={styles.emptyText}>Choose subjects from the list above</Text>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.overlay,
  },
  container: {
    width: '90%',
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
  errorText: {
    color: theme.text,
  },
  emptyText: {
    color: theme.subtext,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
