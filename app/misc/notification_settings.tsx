import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updatePrefs } from "../api/notifPreferencesUpdate";
import { registerForPushNotifications, unregisterForPushNotifications } from "../hooks/usePushNotif";
import { ThemeContext } from "../theme/themeContext";


export default function NotificationSettings() {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [starredUpdates, setStarredUpdates] = useState(false);
  const [favoriteSubjectUpdates, setFavoriteSubjectUpdates] = useState(false);
  // todo: fetch actual preferences from backend and update states accordingly.

  useEffect(() => {
    (async () => {
    try {
      const token = await AsyncStorage.getItem('deviceToken');
      setIsRegistered(!!token);
      const starred = await AsyncStorage.getItem('pref_starred_updates');
      const favs = await AsyncStorage.getItem('pref_favorite_subject_updates');
      setStarredUpdates(starred === 'true');
      setFavoriteSubjectUpdates(favs === 'true');
    } catch (e) {}
    })();
  }, []);
    
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Notification Settings</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8}}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose what you'd like to receive</Text>

          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefTitle}>Starred bills updates</Text>
              <Text style={styles.prefSubtitle}>Get notified when a bill you starred changes</Text>
            </View>
            <Switch
              disabled={!isRegistered}
              value={starredUpdates}
              onValueChange={async (val) => {
                setStarredUpdates(val);
                try { await AsyncStorage.setItem('pref_starred_updates', val ? 'true' : 'false'); } catch (e) {}
                try { await updatePrefs(val, undefined);} catch (e) {}
              }}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefTitle}>Favorite subjects updates</Text>
              <Text style={styles.prefSubtitle}>Receive updates for bills in your favorite subjects</Text>
            </View>
            <Switch
              disabled={!isRegistered}
              value={favoriteSubjectUpdates}
              onValueChange={async (val) => {
                setFavoriteSubjectUpdates(val);
                try { await AsyncStorage.setItem('pref_favorite_subject_updates', val ? 'true' : 'false'); } catch (e) {}
                try { await updatePrefs(undefined, val);} catch (e) {}
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
    backgroundColor: theme.background,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom:20,
    maxWidth: '80%'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: theme.text,
  },
  section: {
    marginBottom: 20,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    shadowColor: theme.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    marginTop: 4,
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: 12,
    maxWidth: '80%'
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  prefSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    marginTop: 2,
  },
});