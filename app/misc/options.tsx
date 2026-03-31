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
      <Text style={styles.title}>Options</Text>
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
        <Pressable style={styles.button} onPress={async () => navigation.navigate('Privacy_Policy') }>
          <Text style={styles.buttonText}>Privacy Policy</Text>
        </Pressable>
      </View>

      <SelectFavoritesModal visible={open} onClose={handleClose} />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: '24%',
    backgroundColor: theme.background,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  button: {
    width: "100%",
    minHeight: 50,
    marginBottom: 12,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
      textAlign: "center",
      fontSize: 16,
      color: theme.innerText,
      fontWeight: "600",
  },
});