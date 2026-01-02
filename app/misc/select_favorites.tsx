import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSubjects } from '../hooks/useGetSubjects';
import { registerForPushNotifications } from '../hooks/usePushNotif';
import SelectFavoritesModal from './SelectFavoritesModal';

export default function SelectTopicsScreen({ route }: any) {
  const [open, setOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const { loading: subjectsLoading, error: subjectsError } = useGetSubjects();

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
        <Pressable style={styles.button} onPress={() => setOpen(true)}>
          <Text style={styles.buttonText}>Select Favorite Subjects</Text>
        </Pressable>
        <Pressable
          style={[styles.button, {backgroundColor: '#0b84ff'}]}
          onPress={async () => {
            setRegLoading(true);
            setRegStatus(null);
            try {
              const token = await registerForPushNotifications();
              setRegStatus(token ? 'Registered' : 'Permission denied');
            } catch (e) {
              setRegStatus('Registration failed');
            } finally {
              setRegLoading(false);
            }
          }}
        >
          <Text style={styles.buttonText}>{regLoading ? 'Registering…' : 'Register for notifications'}</Text>
        </Pressable>
        {regStatus ? <Text style={{marginTop:8}}>{regStatus}</Text> : null}
      </View>

      <SelectFavoritesModal visible={open} onClose={() => setOpen(false)} />
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
});
