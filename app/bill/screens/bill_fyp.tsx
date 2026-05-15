import useGetRecentBills from "@/app/hooks/useGetRecentBills";
import { useFavoritesStore } from "@/app/store/favoriteSubjectsStore";
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SortOptions from '../../components/SortOptions';
import { ThemeContext } from "../../theme/themeContext";
import BillList from '../components/BillList';
import BillTopNav from "../components/BillTopNav";


const arraysEqual = (a?: number[], b?: number[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

export default function BillFYP( {navigation, route} : any) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  // use MMKV later to store favorite subjects persistently
  const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const favorite_subjects = useMemo(() => (favorite_subjects_store && favorite_subjects_store.length > 0) ? favorite_subjects_store : [], [favorite_subjects_store]);
  const [sortType, setSortType] = useState(route?.params?.sort ?? "datedesc");
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: favorite_subjects, truncate: true , sort: route?.params?.sort ?? "datedesc"}));
  const lastUsedSubjectsRef = useRef<number[] | undefined>(undefined);
  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetRecentBills(searchVars.after, searchVars.bill_type, searchVars.first, searchVars.congress_num, searchVars.subject_list, searchVars.truncate, searchVars.sort);
  const isFocused = useIsFocused();
  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  useEffect(() => {
    const paramSort = route?.params?.sort;
    if (paramSort && paramSort !== sortType) {
      handleSortChange(paramSort);
    }
  }, [route?.params?.sort]);

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

  useEffect(() => {
    if (!isFocused) return;
    // Determine which subjects should drive the query: prefer explicit searchVars, otherwise favorites
    if (arraysEqual(lastUsedSubjectsRef.current, favorite_subjects)) return;
    lastUsedSubjectsRef.current = favorite_subjects;
    const next = { ...searchVars, subject_list: favorite_subjects, after: undefined };
    setSearchVars(next);
    try {
      refetch({ after: undefined, bill_type: next.bill_type, first: next.first, congress_num: next.congress_num, subject_list: next.subject_list, truncate: next.truncate, sort: next.sort });
    } catch (err) {
      console.error('Refetch on focus failed', err);
    }
  }, [isFocused, favorite_subjects, searchVars, refetch]);
  // `bills` may be the GraphQL connection object or an array/falsy value.
  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);

  if ((loading && edges.length === 0)) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} mode="FYP"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} disabled />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </View>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} mode="FYP"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} disabled />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Error loading bills: {error?.message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
  

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} mode="FYP"/>
        <SortOptions sortType={sortType} onSortChange={handleSortChange} />
        <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} />
      </View>
    </SafeAreaView>
  );
}


const createStyles = (theme: any, isLandscape = false) =>
  StyleSheet.create({
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