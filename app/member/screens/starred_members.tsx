import EmptyPage from "@/app/components/EmptyPage";
import { authRequest } from "@/app/hooks/authRequest";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useStarredMembersStore } from "@/app/store/starredMembersStore";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/MemberList";
import MemTopNav from "../components/MemTopNav";

function StarredMembers({navigation}: any) {
  // use MMKV later to store favorite subjects persistently
  const starred_members = useStarredMembersStore((s) => s.stars);
  const starredIds = useMemo(() => starred_members.map(s => Number(s)).filter(n => !Number.isNaN(n)), [starred_members]);

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
  useEffect(() => {
    if (loggedIn === false) {
      Alert.alert('Login required', 'You must be logged in to view your starred members.', [
        { text: 'Log in', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [loggedIn]);

  const memberData = useMemo(() => data?.members ?? [], [data]);

  const handleRefresh = useCallback(() => {
    void fetchMembers();
  }, [fetchMembers]);

  if (data?.error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <EmptyPage />
      </View>
    </SafeAreaView>
  );
  if (data?.detail == 'Authentication credentials were not provided.') return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Starred" />
        <Text>Try logging in.</Text>
      </View>
    </SafeAreaView>
  );
  if (loading) return (
      <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
        <ActivityIndicator />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container : {
    flex:1,
    paddingHorizontal:'6%',
    paddingTop:'5%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  }
})