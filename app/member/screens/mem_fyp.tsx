import MemberSearchModal from "@/app/components/MemberSearchModal";
import SearchButton from "@/app/components/SearchButton";
import useGetMembershipSet from "@/app/hooks/useGetMembershipSet";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/MemberList";

export default function MemberFYP({navigation}: any) {
  // use MMKV later to store favorite subjects persistently
  // const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>({ congress: 119, chamber: 'Senate', state: 'CA' });
  const {members, loading, error, refetch} = useGetMembershipSet(searchVars.congress,searchVars.chamber,searchVars.state);

  const isFocused = useIsFocused();

  useEffect(() => {
      if (!isFocused) return;
      // Determine which subjects should drive the query: prefer explicit searchVars, otherwise favorites
      try {
        refetch(searchVars.congress, searchVars.chamber, searchVars.state);
      } catch (err) {
        console.error('Refetch on focus failed', err);
      }
    }, [isFocused, searchVars.congress, searchVars.chamber, searchVars.state, refetch]);
  if (loading ) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error ) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading bills: {error?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <SearchButton label="Search Reps" onPress={useCallback(() => setModalVisible(true), [])} />
        </View>
        <MemberSearchModal
          visible={modalVisible}
          onClose={useCallback(() => setModalVisible(false), [])}
          initial={useMemo(() => searchVars, [searchVars.congress, searchVars.chamber, searchVars.state])}
          onSearch={useCallback((vars:any) => {
            setSearchVars((prev:any) => {
              const merged = { ...prev, ...vars };
              const next = { ...merged };
              try {
                refetch(next.congress, next.chamber, next.state);
              } catch (err) {
                console.error('Refetch on search failed', err);
              }
              return next;
            });
          }, [refetch])}
        />
        <MemberList data={useMemo(() => members?.members ?? [], [members])} navigation={navigation} parentHandlePress={useCallback(() => setModalVisible(false), [])} />
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