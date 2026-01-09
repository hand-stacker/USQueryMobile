import useGetRecentBills from "@/app/hooks/useGetRecentBills";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillList from '../components/BillList';
import BillTopNav from "../components/BillTopNav";


const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function BillFYP( {navigation} : any) {

  // use MMKV later to store favorite subjects persistently
  const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const favorite_subjects = useMemo(() => (favorite_subjects_store && favorite_subjects_store.length > 0) ? favorite_subjects_store : [], [favorite_subjects_store]);
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: favorite_subjects }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentBills(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const isFocused = useIsFocused();
  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  useEffect(() => {
    if (!isFocused) return;
    // Determine which subjects should drive the query: prefer explicit searchVars, otherwise favorites
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
  // `bills` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);

  if ((loading && edges.length === 0)) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading bills: {error?.message}</Text>
    </SafeAreaView>
  );
  

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} mode="FYP"/>
      <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} />
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
})