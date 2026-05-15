import EmptyPage from "@/app/components/EmptyPage";
import { authRequest } from "@/app/hooks/authRequest";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useStarredMembersStore } from "@/app/store/starredMembersStore";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/MemberList";
import MemTopNav from "../components/MemTopNav";

function StarredMembers({navigation}: any) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  // use MMKV later to store favorite subjects persistently
  const starred_members = useStarredMembersStore((s) => s.stars);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authRequest("v1.0/memberships/");
      setData(res);
    } catch (e) {
      setData({ error: e });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, starred_members]);

  const loggedIn = useFavoritesStore(s => s.loggedIn);
  const memberData = useMemo(() => data?.members ?? [], [data]);
  const handleRefresh = useCallback(() => {
    void fetchMembers();
  }, [fetchMembers]);

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
          <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20, fontWeight: '600' }}>
            You need to log in to save and view your starred members.
          </Text>
          <Pressable style={styles.button} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (data?.error) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <EmptyPage />
      </View>
    </SafeAreaView>
  );
  if (data?.detail == 'Authentication credentials were not provided.') return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Try logging in.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
  if (loading) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </View>
    </SafeAreaView>
  );
    
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <MemberList data={memberData} navigation={navigation} parentHandlePress={handleRefresh} />
      </View>
    </SafeAreaView>
  );
}

export default memo(StarredMembers);

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  container : {
    flex:1,
    paddingHorizontal:'6%',
    paddingTop: isLandscape ? '2%' : '5%',
  },
  button: {
    width: "80%",
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