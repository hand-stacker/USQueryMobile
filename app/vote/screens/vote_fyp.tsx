import BillSearchModal from "@/app/components/BillSearchModal";
import SearchButton from "@/app/components/SearchButton";
import useGetRecentVotes from "@/app/hooks/useGetRecentVotes";
import useGetSubjects from "@/app/hooks/useGetSubjects";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VoteList from "../components/VoteList";

const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function VoteFYP( {navigation} : any) {
  const [modalVisible, setModalVisible] = useState(false);
  const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const hydrated = useFavoritesStore(s => s._hasHydrated);
  const favorite_subjects = useMemo(() => {
    if (!hydrated) return undefined as unknown as number[];
    return (favorite_subjects_store && favorite_subjects_store.length > 0) ? favorite_subjects_store : [686,782,777];
  }, [favorite_subjects_store, hydrated]);

  // Start without a subject_list until hydration completes to avoid transient fallback
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: undefined }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { votes, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentVotes(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();
  const isFocused = useIsFocused();
  
  useEffect(() => {
    if (!isFocused) return;
    if (!hydrated) return;
    const effectiveList = (searchVars.subject_list && searchVars.subject_list.length > 0) ? searchVars.subject_list : (favorite_subjects ?? []);
    if (arraysEqual(lastUsedSubjectsRef.current, effectiveList)) return;
    lastUsedSubjectsRef.current = effectiveList;
    const next = { ...searchVars, subject_list: effectiveList, after: undefined };
    setSearchVars(next);
    try {
      refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
    } catch (err) {
      console.error('Refetch on focus failed', err);
    }
  }, [isFocused, favorite_subjects, searchVars, refetch, hydrated]);

  // `votes` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => {
    if (Array.isArray(votes)) return [];
    return votes?.edges ?? [];
  }, [votes]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);
  const onSearch = useCallback((vars: any) => {
    setSearchVars((prev: any) => {
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
  }, [favorite_subjects, refetch]);
  const onEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={[styles.safe, styles.centerOverlay]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={[styles.safe, styles.centerOverlay]} edges={["top"]}>
      <Text>Error loading bills: {error?.message || subjectsError?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <SearchButton label="Search Votes" onPress={openModal} />
        </View>

        <BillSearchModal
          visible={modalVisible}
          onClose={closeModal}
          initial={searchVars}
          onSearch={onSearch}
          subjects={subjects}
          desc="Search for votes by congress, type, and subjects."
        />

        <VoteList data={edges} navigation={navigation} loadingMore={loadingMore} onEndReached={onEndReached} personal={false} />
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