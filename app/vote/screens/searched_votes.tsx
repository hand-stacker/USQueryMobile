import BillSearchModal from "@/app/components/BillSearchModal";
import useGetRecentVotes from "@/app/hooks/useGetRecentVotes";
import useGetSubjects from "@/app/hooks/useGetSubjects";
import { useSubjectListStore } from "@/app/store/subjectListStore";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VoteList from '../components/VoteList';
import VoteTopNav from '../components/VoteTopNav';

const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function VoteSearchResults( {navigation} : any) {
  const subject_list_store = useSubjectListStore(s => s.subject_list);
  const subject_list = useMemo(() => (subject_list_store && subject_list_store.length > 0) ? subject_list_store : [], [subject_list_store]);
  const [modalVisible, setModalVisible] = useState(subject_list.length === 0);
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: subject_list }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { votes, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentVotes(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    if (arraysEqual(lastUsedSubjectsRef.current, subject_list)) return;
    lastUsedSubjectsRef.current = subject_list;
    setSearchVars((prev: any) => {
      const next = { ...prev, subject_list: subject_list, after: undefined };
      try {
        refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
      } catch (err) {
        console.error('Refetch on focus failed', err);
      }
      return next;
    });
  }, [isFocused, subject_list, refetch]);

  // `votes` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => {
    if (Array.isArray(votes)) return [];
    return votes?.edges ?? [];
  }, [votes]);

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading votes: {error?.message || subjectsError?.message}</Text>
    </SafeAreaView>
  );

  const handleOpenModal = useCallback(() => setModalVisible(true), []);
  const handleCloseModal = useCallback(() => setModalVisible(false), []);
  const handleSearch = useCallback((vars: any) => {
    setSearchVars((prev: any) => {
      const merged = { ...prev, ...vars };
      const effective = (merged.subject_list && merged.subject_list.length > 0) ? merged.subject_list : subject_list;
      const next = { ...merged, subject_list: effective };
      useSubjectListStore.getState().setSubjectList(effective);
      try {
        refetch({ after: next.after, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list });
      } catch (err) {
        console.error('Refetch on search failed', err);
      }
      lastUsedSubjectsRef.current = next.subject_list;
      return next;
    });
  }, [subject_list, refetch]);

  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <VoteTopNav navigation={navigation} mode="Search" handleOpenModal={handleOpenModal} />

        <BillSearchModal
          visible={modalVisible}
          onClose={handleCloseModal}
          initial={searchVars}
          onSearch={handleSearch}
          subjects={subjects}
          desc="Search for votes by congress, type, and subject."
        />

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
});
