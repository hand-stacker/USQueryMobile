import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateFloorPrefs } from "../api/notifFloorPreferencesUpdate";
import { getNotifPreferences } from "../api/notifPreferencesGet";
import { updatePrefs } from "../api/notifPreferencesUpdate";
import { registerForPushNotifications, unregisterForPushNotifications } from "../hooks/usePushNotif";
import { ThemeContext } from "../theme/themeContext";

function getDeviceTimezoneAbbr(): string {
  return (
    Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value ?? 'UTC'
  );
}

function toHour12(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

function formatHour(hour24: number): string {
  const { hour12, period } = toHour12(hour24);
  return `${hour12}:00 ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HourPickerModal({
  visible,
  selectedHour,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  selectedHour: number;
  onSelect: (hour: number) => void;
  onDismiss: () => void;
}) {
  const { theme } = useContext(ThemeContext);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onDismiss}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            paddingBottom: 40,
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
            Select hour
          </Text>
          <FlatList
            data={HOURS}
            keyExtractor={(h) => String(h)}
            style={{ maxHeight: 240 }}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={selectedHour}
            getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            renderItem={({ item: hour }) => {
              const selected = hour === selectedHour;
              return (
                <Pressable
                  style={{
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: selected ? theme.primary + '22' : 'transparent',
                  }}
                  onPress={() => { onSelect(hour); onDismiss(); }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: selected ? theme.primary : theme.text,
                    fontWeight: selected ? '700' : '400',
                  }}>
                    {formatHour(hour)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

export default function NotificationSettings() {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);

  const [regLoading, setRegLoading] = useState(false);
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);

  const [starredUpdates, setStarredUpdates] = useState(false);
  const [favoriteSubjectUpdates, setFavoriteSubjectUpdates] = useState(false);

  const [houseEnabled, setHouseEnabled] = useState(false);
  const [houseFrequency, setHouseFrequency] = useState(1);
  const [houseHour, setHouseHour] = useState(() => new Date().getHours());
  const [housePickerVisible, setHousePickerVisible] = useState(false);
  const houseTimeWasNull = useRef(true);

  const [senateEnabled, setSenateEnabled] = useState(false);
  const [senateFrequency, setSenateFrequency] = useState(1);
  const [senateHour, setSenateHour] = useState(() => new Date().getHours());
  const [senatePickerVisible, setSenatePickerVisible] = useState(false);
  const senateTimeWasNull = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('deviceToken');
        setIsRegistered(!!token);
      } catch (e) {}
      try {
        const prefs = await getNotifPreferences();
        setStarredUpdates(prefs.enabled_bill_notif ?? false);
        setFavoriteSubjectUpdates(prefs.enabled_subject_notif ?? false);
        setHouseEnabled(prefs.enabled_house_floor_notif ?? false);
        setHouseFrequency(prefs.house_floor_notif_frequency ?? 1);
        setSenateEnabled(prefs.enabled_senate_floor_notif ?? false);
        setSenateFrequency(prefs.senate_floor_notif_frequency ?? 1);
        if (prefs.house_floor_notif_time != null) {
          setHouseHour(prefs.house_floor_notif_time);
          houseTimeWasNull.current = false;
        }
        if (prefs.senate_floor_notif_time != null) {
          setSenateHour(prefs.senate_floor_notif_time);
          senateTimeWasNull.current = false;
        }
      } catch (e) {}
      setPrefsLoading(false);
    })();
  }, []);

  const handleHouseToggle = async (val: boolean) => {
    setHouseEnabled(val);
    try {
      if (val && houseTimeWasNull.current) {
        await updateFloorPrefs({
          house: true,
          house_frequency: houseFrequency,
          house_time: houseHour,
          house_timezone: getDeviceTimezoneAbbr(),
        });
        houseTimeWasNull.current = false;
      } else {
        await updateFloorPrefs({ house: val });
      }
    } catch (e) {}
  };

  const handleSenateToggle = async (val: boolean) => {
    setSenateEnabled(val);
    try {
      if (val && senateTimeWasNull.current) {
        await updateFloorPrefs({
          senate: true,
          senate_frequency: senateFrequency,
          senate_time: senateHour,
          senate_timezone: getDeviceTimezoneAbbr(),
        });
        senateTimeWasNull.current = false;
      } else {
        await updateFloorPrefs({ senate: val });
      }
    } catch (e) {}
  };

  const handleHouseFrequency = async (freq: number) => {
    setHouseFrequency(freq);
    try { await updateFloorPrefs({ house_frequency: freq }); } catch (e) {}
  };

  const handleSenateFrequency = async (freq: number) => {
    setSenateFrequency(freq);
    try { await updateFloorPrefs({ senate_frequency: freq }); } catch (e) {}
  };

  const handleHouseHour = async (hour: number) => {
    setHouseHour(hour);
    try { await updateFloorPrefs({ house_time: hour, house_timezone: getDeviceTimezoneAbbr() }); } catch (e) {}
  };

  const handleSenateHour = async (hour: number) => {
    setSenateHour(hour);
    try { await updateFloorPrefs({ senate_time: hour, senate_timezone: getDeviceTimezoneAbbr() }); } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Notification Settings</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
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

        {prefsLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <>
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
                    try { await updatePrefs(val, undefined); } catch (e) {}
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
                    try { await updatePrefs(undefined, val); } catch (e) {}
                  }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.floorToggleRow}>
                <View style={styles.prefTextWrap}>
                  <Text style={styles.prefTitle}>House Floor Notifications</Text>
                  <Text style={styles.prefSubtitle}>New actions on House bills</Text>
                </View>
                <Switch disabled={!isRegistered} value={houseEnabled} onValueChange={handleHouseToggle} />
              </View>
              {houseEnabled && (
                <>
                  <Text style={styles.freqLabel}>Frequency</Text>
                  <View style={styles.segmentedControl}>
                    <Pressable
                      style={[styles.segment, houseFrequency === 0 && styles.segmentActive]}
                      onPress={() => handleHouseFrequency(0)}
                    >
                      <Text style={[styles.segmentText, houseFrequency === 0 && styles.segmentTextActive]}>Every Update</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.segment, houseFrequency === 1 && styles.segmentActive]}
                      onPress={() => handleHouseFrequency(1)}
                    >
                      <Text style={[styles.segmentText, houseFrequency === 1 && styles.segmentTextActive]}>Daily</Text>
                    </Pressable>
                  </View>
                  {houseFrequency === 1 && (
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Notify me at</Text>
                      <Pressable style={styles.timeChip} onPress={() => setHousePickerVisible(true)}>
                        <Text style={styles.timeChipText}>{formatHour(houseHour)}</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.floorToggleRow}>
                <View style={styles.prefTextWrap}>
                  <Text style={styles.prefTitle}>Senate Floor Notifications</Text>
                  <Text style={styles.prefSubtitle}>New actions on Senate bills</Text>
                </View>
                <Switch disabled={!isRegistered} value={senateEnabled} onValueChange={handleSenateToggle} />
              </View>
              {senateEnabled && (
                <>
                  <Text style={styles.freqLabel}>Frequency</Text>
                  <View style={styles.segmentedControl}>
                    <Pressable
                      style={[styles.segment, senateFrequency === 0 && styles.segmentActive]}
                      onPress={() => handleSenateFrequency(0)}
                    >
                      <Text style={[styles.segmentText, senateFrequency === 0 && styles.segmentTextActive]}>Every Update</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.segment, senateFrequency === 1 && styles.segmentActive]}
                      onPress={() => handleSenateFrequency(1)}
                    >
                      <Text style={[styles.segmentText, senateFrequency === 1 && styles.segmentTextActive]}>Daily</Text>
                    </Pressable>
                  </View>
                  {senateFrequency === 1 && (
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Notify me at</Text>
                      <Pressable style={styles.timeChip} onPress={() => setSenatePickerVisible(true)}>
                        <Text style={styles.timeChipText}>{formatHour(senateHour)}</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <HourPickerModal
        visible={housePickerVisible}
        selectedHour={houseHour}
        onSelect={handleHouseHour}
        onDismiss={() => setHousePickerVisible(false)}
      />
      <HourPickerModal
        visible={senatePickerVisible}
        selectedHour={senateHour}
        onSelect={handleSenateHour}
        onDismiss={() => setSenatePickerVisible(false)}
      />
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
    marginBottom: 20,
    maxWidth: '80%',
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
    fontWeight: '400',
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
  floorToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: 12,
    maxWidth: '80%',
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  prefSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.subtext,
    marginTop: 2,
  },
  freqLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
    marginTop: 10,
    marginBottom: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  segmentActive: {
    backgroundColor: theme.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.subtext,
  },
  segmentTextActive: {
    color: theme.innerText,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: theme.primary + '15',
  },
  timeChipText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
});
