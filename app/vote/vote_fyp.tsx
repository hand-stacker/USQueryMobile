import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchButton from "../components/search_button";
import BillSearchModal from "../components/search_modal";
import VoteList from "../components/vote_list";
import useGetRecentVotes from "../hooks/useGetRecentVotes";
import useGetSubjects from "../hooks/useGetSubjects";

export default function VoteFYP( {navigation} : any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: [686,782,777] });
  const { votes, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentVotes(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();
  // `votes` may be the GraphQL connection object or an array/falsy value.
  const edges = Array.isArray(votes)
    ? []
    : (votes && (votes.edges ?? []));

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading bills: {error?.message || subjectsError?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView
      style={styles.container}
      className="flex-1 bg-primary"
    >
      <SearchButton description="Search for Specific Bills" onPress={()=> setModalVisible(true)} />
      <BillSearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initial={searchVars}
        onSearch={(vars:any) => {
          setSearchVars({ ...searchVars, ...vars });
        }}
        subjects={subjects}
      />
      <VoteList data={edges} navigation={navigation} loadingMore={loadingMore} onEndReached={() => {
        if (hasNextPage) loadMore();
      }} personal={false}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
  }
})