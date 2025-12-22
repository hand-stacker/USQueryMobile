import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillList from "../components/bill_list";
import SearchButton from "../components/search_button";
import BillSearchModal from "../components/search_modal";
import useGetRecentBills from "../hooks/useGetRecentBills";
import useGetSubjects from "../hooks/useGetSubjects";
import { useFavoritesStore } from "../store/favoriteSubjectsStore";


export default function BillFYP( {navigation} : any) {

  // use MMKV later to store favorite subjects persistently'
  // currently first load does no get rehydrated data from zustand store
  var favorite_subjects = [683,777];
  var favorite_subjects_store = useFavoritesStore(s => s.favorites);
  if (favorite_subjects_store.length !== 0) {
    favorite_subjects = favorite_subjects_store;
  }
  console.log("Favorite Subjects in Bill FYP:", favorite_subjects);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>({ after: undefined, bill_type: undefined, first: 10, congress_num: 119, subject_list: favorite_subjects });
  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentBills(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const isFocused = useIsFocused();

  const arraysEqual = (a?: number[], b?: number[]) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  useEffect(() => {
    if (!isFocused) return;
    const effectiveFavorites = (favorite_subjects && favorite_subjects.length > 0) ? favorite_subjects : [683, 777];
    if (!arraysEqual(effectiveFavorites, searchVars.subject_list)) {
      const newVars = { ...searchVars, subject_list: effectiveFavorites, after: undefined };
      setSearchVars(newVars);
      try {
        refetch({ after: undefined, bill_type: newVars.bill_type, first: newVars.first, congress_num: newVars.congress_num, subject_list: newVars.subject_list });
      } catch (err) {
        console.error('Refetch on focus failed', err);
      }
    }
  // only run when screen becomes focused or favorites change
  }, [isFocused, favorite_subjects]);
  // `bills` may be the GraphQL connection object or an array/falsy value.
  // Prefer server data when available; otherwise fall back to local `testBillList`.
  const edges = Array.isArray(bills)
    ? []
    : (bills && (bills.edges ?? []));

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
      <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={() => {
        if (hasNextPage) loadMore();
      }} />
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