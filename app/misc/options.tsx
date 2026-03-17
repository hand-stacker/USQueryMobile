import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateFavorites } from '../api/favoritesUpdate';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';
import { ThemeContext } from '../theme/themeContext';
import SelectFavoritesModal from './SelectFavoritesModal';

interface OptionsProps {
  navigation: any;
  route: any;
}

export default function OptionsPage({navigation, route }: OptionsProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [open, setOpen] = useState(false);
  const { loading: subjectsLoading, error: subjectsError } = useGetSubjects();
  const favorites = useFavoritesStore(s => s.favorites);

  const handleClose = async () => {
    setOpen(false);
    try {
      await updateFavorites(favorites);
    } catch (e) {
    }
  };
  const { toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    // allow navigation to open the select modal immediately
    if (route?.params?.openFavorites) {
      setOpen(true);
    }
  }, [route?.params?.openFavorites]);

  if (subjectsLoading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (subjectsError) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading topics: {subjectsError.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.header}>Options</Text>
      <View style={{marginTop:12}}>
        <Pressable
          style={[styles.button]}
          onPress={async () => navigation.navigate('Login') }
        >
          <Text style={styles.buttonText}>Account</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setOpen(true)}>
          <Text style={styles.buttonText}>Select Favorite Subjects</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => navigation.navigate('Notification_Settings') }>
          <Text style={styles.buttonText}>Notifications</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={toggleTheme}>
          <Text style={styles.buttonText}>Switch to {theme.name === 'light' ? 'dark' : 'light'} theme</Text>
        </Pressable>
      </View>

      <SelectFavoritesModal visible={open} onClose={handleClose} />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
      fontSize: 16,
      color: theme.innerText,
      fontWeight: "600",
      marginLeft: 8,
  },
});