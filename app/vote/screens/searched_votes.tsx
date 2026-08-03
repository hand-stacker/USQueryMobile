import BillSearchModal from "@/app/components/BillSearchModal";
import useGetSubjects from "@/app/hooks/useGetSubjects";
import { useVoteSearch } from "@/app/hooks/useVoteSearch";
import { useSubjectListStore } from "@/app/store/subjectListStore";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SortOptions from '../../components/SortOptions';
import VoteList from '../components/VoteList';
import VoteTopNav from '../components/VoteTopNav';

export default function VoteSearchResults( {navigation} : any) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  const subject_list_store = useSubjectListStore(s => s.subject_list);
  const subject_list = useMemo(() => (subject_list_store && subject_list_store.length > 0) ? subject_list_store : [], [subject_list_store]);
  const [modalVisible, setModalVisible] = useState(subject_list.length === 0);
  const [sortType, setSortType] = useState("datedesc");
  const [searchVars, setSearchVars] = useState<any>(() => ({ after: undefined, bill_type: undefined, first: 30, congress_num: 119, subject_list: subject_list, sort: sortType, keyword: undefined, searchType: 'subject' }));
  const { votes, hasNextPage, loading, loadingMore, error, loadMore } = useVoteSearch({ vars: searchVars, searchType: searchVars.searchType ?? 'subject' });
  const { subjects, loading: subjectsLoading, error: subjectsError } = useGetSubjects();

  const edges = useMemo(() => {
    if (Array.isArray(votes)) return [];
    return votes?.edges ?? [];
  }, [votes]);

  const handleOpenModal = useCallback(() => setModalVisible(true), []);
  const handleCloseModal = useCallback(() => setModalVisible(false), []);
  const handleSearch = useCallback((vars: any) => {
    setSearchVars((prev: any) => {
      const merged = { ...prev, ...vars, after: undefined };
      const effective = (merged.subject_list && merged.subject_list.length > 0) ? merged.subject_list : [];
      const next = { ...merged, subject_list: effective };
      useSubjectListStore.getState().setSubjectList(effective);
      return next;
    });
  }, []);

  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  const handleSortChange = useCallback((sort: string) => {
    setSortType(sort);
    setSearchVars((prev: any) => ({ ...prev, sort, after: undefined }));
  }, []);

  if ((loading && edges.length === 0) || subjectsLoading) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <VoteTopNav navigation={navigation} mode="Search" handleOpenModal={handleOpenModal} />
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
        <VoteTopNav navigation={navigation} mode="Search" handleOpenModal={handleOpenModal} />
        <SortOptions sortType={sortType} onSortChange={handleSortChange} disabled />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Error loading votes: {error?.message || subjectsError?.message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <VoteTopNav navigation={navigation} mode="Search" handleOpenModal={handleOpenModal} />
        <SortOptions sortType={sortType} onSortChange={handleSortChange} />
        <BillSearchModal
          visible={modalVisible}
          onClose={handleCloseModal}
          initial={searchVars}
          onSearch={handleSearch}
          subjects={subjects}
          desc="Search for votes by keyword, or by congress, chamber, and subject."
          typeMode="chamber"
        />
        <VoteList data={edges} navigation={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} personal={false} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  container : {
    flex:1,
    paddingHorizontal:'6%',
    paddingTop: isLandscape ? '2%' : '5%',
  },
});
