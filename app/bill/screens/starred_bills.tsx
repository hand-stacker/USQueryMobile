import useGetStarredBills from '@/app/hooks/useGetStarredBills';
import { useStarredBillsStore } from '@/app/store/starredBillsStore';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BillList from '../components/BillList';
import BillTopNav from '../components/BillTopNav';

export default function StarredBills({ navigation }: any) {
  const stars = useStarredBillsStore(s => s.stars) ?? [];
  const starredIds = useMemo(() => stars.map(s => Number(s)).filter(n => !Number.isNaN(n)), [stars]);

  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetStarredBills(undefined, 30, starredIds);
  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);

  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);

  if (loading && edges.length === 0) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading starred bills: {error?.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <BillTopNav navigation={navigation} mode="Starred"/>
        <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    flex:1,
    paddingHorizontal:'6%',
    paddingTop:'5%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  }
});
