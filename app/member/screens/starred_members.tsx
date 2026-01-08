import useGetMemberships from "@/app/hooks/useGetMemberships";
import { useStarredMembersStore } from "@/app/store/starredMembersStore";
import React, { useMemo, useCallback, memo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/MemberList";
import MemTopNav from "../components/MemTopNav";

function StarredMembers({navigation}: any) {
  // use MMKV later to store favorite subjects persistently
  const starred_members = useStarredMembersStore((s) => s.stars);

  const starredIds = useMemo(() => starred_members.map(s => Number(s)).filter(n => !Number.isNaN(n)), [starred_members]);
  const {members, loading, error, refetch} = useGetMemberships(starred_members);

  const memberData = useMemo(() => members?.members ?? [], [members]);

  const handleRefresh = useCallback(() => {
    // re-fetch the current starred members set
    try { refetch(starred_members); } catch (e) { /* swallow */ }
  }, [refetch, starred_members]);

  if (loading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error ) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading members: {error?.message}</Text>
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