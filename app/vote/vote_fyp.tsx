import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchButton from "../components/search_button";
import BillSearchModal from "../components/search_modal";
import useGetRecentVotes from "../hooks/useGetRecentVotes";
import useGetSubjects from "../hooks/useGetSubjects";
import VoteList from "./components/VoteList";

export default function VoteFYP( {navigation} : any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: [686,782,777] });
  const { votes, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentVotes(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  // `votes` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => {
    if (Array.isArray(votes)) return [];
    return votes?.edges ?? [];
  }, [votes]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);
  const onSearch = useCallback((vars: any) => {
    setSearchVars((prev: any) => ({ ...prev, ...vars }));
  }, []);
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