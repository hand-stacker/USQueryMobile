import MemberSearchModal from "@/app/components/MemberSearchModal";
import useGetMembershipSet from "@/app/hooks/useGetMembershipSet";
import { ThemeContext } from "@/app/theme/themeContext";
import { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/MemberList";
import MemTopNav from "../components/MemTopNav";

export default function SearchedMembers({navigation}: any) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  // use MMKV later to store favorite subjects persistently
  // const favorite_subjects_store = useFavoritesStore(s => s.favorites);
  const [modalVisible, setModalVisible] = useState(true);
  const [searchVars, setSearchVars] = useState<any>({ congress: 119, chamber: 'Senate', state: 'All' });
  const {members, loading, error, refetch} = useGetMembershipSet(searchVars.congress,searchVars.chamber,searchVars.state);

  if (loading) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MemTopNav navigation={navigation} mode="Search" handleOpenModal={() => setModalVisible(true)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </View>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MemTopNav navigation={navigation} mode="Search" handleOpenModal={() => setModalVisible(true)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Error loading members: {error?.message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MemTopNav navigation={navigation} mode="Search" handleOpenModal={useCallback(() => setModalVisible(true), [])} />
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

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  container : {
    flex:1,
    paddingHorizontal:'6%',
    paddingTop: isLandscape ? '2%' : '5%',
  },
});