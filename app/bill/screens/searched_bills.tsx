import BillSearchModal from "@/app/components/BillSearchModal";
import useGetRecentBills from "@/app/hooks/useGetRecentBills";
import useGetSubjects from "@/app/hooks/useGetSubjects";
import { useSubjectListStore } from "@/app/store/subjectListStore";
import { ThemeContext } from "@/app/theme/themeContext";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SortOptions from '../../components/SortOptions';
import BillList from '../components/BillList';
import BillTopNav from "../components/BillTopNav";


const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function BillSearchResults( {navigation, route} : any) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  const subject_list_store = useSubjectListStore(s => s.subject_list);
  const subject_list = useMemo(() => (subject_list_store && subject_list_store.length > 0) ? subject_list_store : [], [subject_list_store]);
  const routeParams = route?.params ?? {};
  const [highlight] = useState<number[]>(routeParams.highlight ?? []);
  const fromNotif = !!(routeParams.bill_type || routeParams.highlight?.length);
  const [modalVisible, setModalVisible] = useState(subject_list.length === 0 && !fromNotif);
  const [sortType, setSortType] = useState(routeParams.sort ?? "datedesc");
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: routeParams.bill_type ?? undefined, first: 30, congress_num: 119, subject_list: subject_list, truncate: true, sort: routeParams.sort ?? "datedesc" }));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const navigatedWithinStackRef = useRef(false);
  const { bills, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentBills(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list, searchVars.truncate, searchVars.sort);
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    const currentSubjects = subject_list_store && subject_list_store.length > 0 ? subject_list_store : [];
    const prevSubjects = lastUsedSubjectsRef.current || [];

    if (!arraysEqual(prevSubjects, currentSubjects)) return;

    lastUsedSubjectsRef.current = currentSubjects;
    setSearchVars((prev: any) => {
      const next = { ...prev, subject_list: currentSubjects, after: undefined };
      try {
        refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list, truncate: next.truncate, sort: next.sort });
      } catch (err) {
        console.error('Refetch on focus failed', err);
      }
      return next;
    });
  }, [isFocused, subject_list_store, sortType, refetch]);

  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);

  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      const state = navigation.getState();
      navigatedWithinStackRef.current = state.routes[state.index]?.name !== 'Searched_Bills';
    });
    const unsubFocus = navigation.addListener('focus', () => {
      if (navigatedWithinStackRef.current) {
        setModalVisible(true);
        navigatedWithinStackRef.current = false;
      }
    });
    return () => { unsubBlur(); unsubFocus(); };
  }, [navigation]);

  const handleOpenModal = useCallback(() => setModalVisible(true), []);
  const handleCloseModal = useCallback(() => setModalVisible(false), []);
  const handleSearch = useCallback((vars: any) => {
    setSearchVars((prev: any) => {
      const merged = { ...prev, ...vars };
      const effective = (merged.subject_list && merged.subject_list.length > 0) ? merged.subject_list : [];
      const next = { ...merged, subject_list: effective };
      useSubjectListStore.getState().setSubjectList(effective);
      try {
        refetch({ after: next.after, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list, truncate: next.truncate, sort: next.sort });
      } catch (err) {
        console.error('Refetch on search failed', err);
      }
      lastUsedSubjectsRef.current = next.subject_list;
      return next;
    });
  }, [subject_list, sortType, refetch]);

  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  const handleSortChange = useCallback((sort: string) => {
    setSortType(sort);
    setSearchVars((prev: any) => {
      const next = { ...prev, sort, after: undefined };
      try {
        refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list, truncate: next.truncate, sort });
      } catch (err) {
        console.error('Refetch on sort change failed', err);
      }
      return next;
    });
  }, [refetch]);

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} handleOpenModal={handleOpenModal} mode="Search"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} disabled />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </View>
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} handleOpenModal={handleOpenModal} mode="Search"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} disabled />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Error loading bills: {error?.message || subjectsError?.message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} handleOpenModal={handleOpenModal} mode="Search"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} />
        <BillSearchModal
          visible={modalVisible}
          onClose={handleCloseModal}
          initial={searchVars}
          onSearch={handleSearch}
          subjects={subjects}
        />
        <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} highlight={highlight} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: '6%',
    paddingTop: isLandscape ? '2%' : '5%',
    backgroundColor: theme.background,
  },
});
