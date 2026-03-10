import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerForPushNotifications, unregisterForPushNotifications } from "../hooks/usePushNotif";


export default function NotificationSettings() {
    const [regLoading, setRegLoading] = useState(false);
    const [regStatus, setRegStatus] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [starredUpdates, setStarredUpdates] = useState(false);
    const [favoriteSubjectUpdates, setFavoriteSubjectUpdates] = useState(false);

    useEffect(() => {
        (async () => {
        try {
            const token = await AsyncStorage.getItem('deviceToken');
            setIsRegistered(!!token);
            const starred = await AsyncStorage.getItem('pref_starred_updates');
            const favs = await AsyncStorage.getItem('pref_favorite_subject_updates');
            setStarredUpdates(starred === 'true');
            setFavoriteSubjectUpdates(favs === 'true');
        } catch (e) {
        }
        })();
    }, []);
      
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.header}>Notification Settings</Text>
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
                        }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
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
    header: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        color: '#0b1226',
    },
    section: {
        marginTop: 20,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0b1226',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#586069',
        marginTop: 4,
        marginBottom: 8,
    },
    prefRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f3',
    },
    prefTextWrap: {
        flex: 1,
        paddingRight: 12,
    },
    prefTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0b1226',
    },
    prefSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
}); 