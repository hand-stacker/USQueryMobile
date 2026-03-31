import useGetStarredBills from '@/app/hooks/useGetStarredBills';
import TempAlphatestLoginCreds from '@/app/misc/temp_alphatest_login_creds';
import { useFavoritesStore } from '@/app/store/favoriteSubjectsStore';
import { useStarredBillsStore } from '@/app/store/starredBillsStore';
import { ThemeContext } from '@/app/theme/themeContext';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

  const loggedIn = useFavoritesStore(s => s.loggedIn);

  // When the starred IDs change elsewhere in the app, refetch the starred bills list
  useEffect(() => {
    if (refetch) refetch();
  }, [refetch, starredIds.join(',')]);

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <BillTopNav navigation={navigation} mode="Starred" />
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
          <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20, fontWeight: '600' }}>
            You need to log in to save and view your starred bills. 
          </Text>
          <TempAlphatestLoginCreds />
          <Pressable style={styles.button} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  

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
  },
  button: {
    width: "80%",
    minHeight: 50,
    marginBottom: 12,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    color: theme.innerText,
    fontWeight: "600",
  },
});
