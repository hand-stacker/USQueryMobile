import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateFavorites } from '../api/favoritesUpdate';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { registerForPushNotifications, unregisterForPushNotifications } from '../hooks/usePushNotif';
import { useFavoritesStore } from '../store/favoriteSubjectsStore';
import SelectFavoritesModal from './SelectFavoritesModal';

interface OptionsProps {
  navigation: any;
  route: any;
}

export default function OptionsPage({navigation, route }: OptionsProps) {
  const [open, setOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const { loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const favorites = useFavoritesStore(s => s.favorites);

  const handleClose = async () => {
    setOpen(false);
    try {
      await updateFavorites(favorites);
    } catch (e) {
    }
  };

  useEffect(() => {
    // allow navigation to open the select modal immediately
    if (route?.params?.openFavorites) {
      setOpen(true);
    }
  }, [route?.params?.openFavorites]);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('deviceToken');
        setIsRegistered(!!token);
      } catch (e) {
      }
    })();
  }, []);

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
          style={[styles.button, {backgroundColor: '#ff3b30'}]}
          onPress={async () => navigation.navigate('Login') }
        >
          <Text style={styles.buttonText}>Log In</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setOpen(true)}>
          <Text style={styles.buttonText}>Select Favorite Subjects</Text>
        </Pressable>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6}}>
          <Text style={styles.label}>Register for notifications</Text>
          {regLoading ? (
            <ActivityIndicator />
          ) : (
            <Switch
              value={isRegistered}
              onValueChange={async (val) => {
                if (val) {
                  setRegLoading(true);
                  setRegStatus(null);
                  try {
                    const token = await registerForPushNotifications();
                    setIsRegistered(!!token);
                    setRegStatus(token ? 'Registered' : 'Permission denied');
                  } catch (e) {
                    setRegStatus('Registration failed');
                  } finally {
                    setRegLoading(false);
                  }
                } else {
                  await unregisterForPushNotifications();
                  setIsRegistered(false);
                  setRegStatus('Unregistered');
                }
              }}
            />
          )}
        </View>
        {regStatus && (
            <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  • {regStatus}
                </Text>
            </View>
          )}
      </View>

      <SelectFavoritesModal visible={open} onClose={handleClose} />
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
    fontWeight: '500',
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  icon: {
    fontSize: 18,
    color: '#ffd700',
  },
  button: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "black",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  pressed: {
      opacity: 0.8,
  },
  inner: {
      flexDirection: "row",
      alignItems: "center",
  },
  buttonText: {
      fontSize: 16,
      color: "#ffffff",
      fontWeight: "600",
      marginLeft: 8,
  },
  alertBox: {
    marginTop: 12,
    backgroundColor: "#c2c7ee",
    borderRadius: 6,
    padding: 10,
  },
  alertText: {
    color: "#1c2eb9",
    fontSize: 13,
  },
});
