import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchButton from "../components/search_button";
import BillSearchModal from "../components/search_modal";
import useGetRecentBills from "../hooks/useGetRecentBills";
import useGetSubjects from "../hooks/useGetSubjects";
import { useFavoritesStore } from "../store/favoriteSubjectsStore";
import BillList from './components/BillList';


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
  const favorite_subjects = useMemo(() => (favorite_subjects_store && favorite_subjects_store.length > 0) ? favorite_subjects_store : [683, 777], [favorite_subjects_store]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: favorite_subjects }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentBills(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    // Determine which subjects should drive the query: prefer explicit searchVars, otherwise favorites
    const effectiveList = (searchVars.subject_list && searchVars.subject_list.length > 0) ? searchVars.subject_list : favorite_subjects;
    if (arraysEqual(lastUsedSubjectsRef.current, effectiveList)) return;
    lastUsedSubjectsRef.current = effectiveList;
    const next = { ...searchVars, subject_list: effectiveList, after: undefined };
    setSearchVars(next);
    try {
      refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
    } catch (err) {
      console.error('Refetch on focus failed', err);
    }
  }, [isFocused, favorite_subjects, searchVars.subject_list]);
  // `bills` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading bills: {error?.message || subjectsError?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <SearchButton label="Search Bills" onPress={useCallback(()=> setModalVisible(true), [])} />
        </View>
        <BillSearchModal
          visible={modalVisible}
        onClose={useCallback(() => setModalVisible(false), [])}
        initial={searchVars}
        onSearch={useCallback((vars:any) => {
          setSearchVars((prev:any) => {
            const merged = { ...prev, ...vars };
            const effective = (merged.subject_list && merged.subject_list.length > 0) ? merged.subject_list : favorite_subjects;
            const next = { ...merged, subject_list: effective };
            try {
              refetch({ after: next.after, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
            } catch (err) {
              console.error('Refetch on search failed', err);
            }
            lastUsedSubjectsRef.current = next.subject_list;
            return next;
          });
        }, [favorite_subjects, refetch])}
        subjects={subjects}
        desc="Search for bills by congress, type, and subject."
      />
      <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore])} />
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
  }
})