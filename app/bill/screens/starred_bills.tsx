import useGetStarredBills from '@/app/hooks/useGetStarredBills';
import { useFavoritesStore } from '@/app/store/favoriteSubjectsStore';
import { useStarredBillsStore } from '@/app/store/starredBillsStore';
import { ThemeContext } from '@/app/theme/themeContext';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BillList from '../components/BillList';
import BillTopNav from '../components/BillTopNav';

export default function StarredBills({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const stars = useStarredBillsStore(s => s.stars) ?? [];
  const starredIds = useMemo(() => stars.map(s => Number(s)).filter(n => !Number.isNaN(n)), [stars]);

  const { bills, pageInfo, hasNextPage, loading, loadingMore, error, refetch, loadMore } = useGetStarredBills(undefined, 30);
  const edges = useMemo(() => Array.isArray(bills) ? [] : (bills?.edges ?? []), [bills]);
  const handleEndReached = useCallback(() => { if (hasNextPage) loadMore(); }, [hasNextPage, loadMore]);
  // When the starred IDs change elsewhere in the app, refetch the starred bills list
  useEffect(() => {
    if (refetch) refetch();
  }, [refetch, starredIds.join(',')]);

  const loggedIn = useFavoritesStore(s => s.loggedIn);
  useEffect(() => {
    if (loggedIn === false) {
      Alert.alert('Login required', 'You must be logged in to view your starred bills.', [
        { text: 'Log in', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [loggedIn]);

  

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BillTopNav navigation={navigation} mode="Starred"/>
      <BillList data={edges} navigator={navigation} loadingMore={loadingMore} onEndReached={handleEndReached} />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: '24%',
    backgroundColor: theme.background,
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
    color: theme.titleText,
  }
});
