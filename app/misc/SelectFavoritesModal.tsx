import React, { useContext } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
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
          <Text style={styles.title}>Select Favorite Subjects</Text>
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

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
    backgroundColor: theme.background,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    maxWidth: "80%",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
});