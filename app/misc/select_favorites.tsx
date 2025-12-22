import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';

export default function SelectTopicsScreen() {
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();
  const favorites = useFavoritesStore(s => s.favorites);
  const addFavorite = useFavoritesStore(s => s.addFavorite);
  const removeFavorite = useFavoritesStore(s => s.removeFavorite);

  const renderItem = ({ item }: { item: any }) => {
    const topicId = Number(item.id);
    var isFavorite = favorites.includes(topicId);
    return (
      <Pressable
        onPress={() => isFavorite ? removeFavorite(topicId) : addFavorite(topicId)}
        style={[
          styles.row,
          isFavorite && styles.rowSelected,
        ]}
      >
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.icon}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </Pressable>
    );
  };
  if (subjectsLoading) return (
      <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  
    if (subjectsError) return (
      <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <Text>Error loading topics: {subjectsError.message}</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Select your favorite topics</Text>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#222',
    marginBottom: 10,
  },
  rowSelected: {
    backgroundColor: '#333',
  },
  title: {
    fontSize: 16,
    color: '#fff',
  },
  icon: {
    fontSize: 18,
    color: '#ffd700',
  },
});
