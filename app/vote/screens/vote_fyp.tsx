import useGetRecentVotes from "@/app/hooks/useGetRecentVotes";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VoteList from "../components/VoteList";
import VoteTopNav from "../components/VoteTopNav";

const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function VoteFYP( {navigation} : any) {
  const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const favorite_subjects = useMemo(() => (favorite_subjects_store && favorite_subjects_store.length > 0) ? favorite_subjects_store : [], [favorite_subjects_store]);
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: undefined }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { votes, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentVotes(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const isFocused = useIsFocused();
  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);
  
  useEffect(() => {
    if (!isFocused) return;
    if (arraysEqual(lastUsedSubjectsRef.current, favorite_subjects)) return;
    lastUsedSubjectsRef.current = favorite_subjects;
    const next = { ...searchVars, subject_list: favorite_subjects, after: undefined };
    setSearchVars(next);
    try {
      refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
    } catch (err) {
      console.error('Refetch on focus failed', err);
    }
  }, [isFocused, favorite_subjects, searchVars, refetch]);

  // `votes` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => {
    if (Array.isArray(votes)) return [];
    return votes?.edges ?? [];
  }, [votes]);

  if ((loading && edges.length === 0)) return (
    <SafeAreaView style={[styles.safe, styles.centerOverlay]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.safe, styles.centerOverlay]} edges={["top"]}>
      <Text>Error loading bills: {error?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <VoteTopNav navigation={navigation} mode="FYP"/>

        <VoteList data={edges} navigation={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} personal={false} />
      </View>
    </SafeAreaView>
  );
}

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
  },
  centerOverlay: { justifyContent: 'center', alignItems: 'center' }
})