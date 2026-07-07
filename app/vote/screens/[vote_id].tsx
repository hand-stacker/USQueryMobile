import BillBadge from "@/app/bill/components/BillBadge";
import BillBadgeInactive from "@/app/bill/components/BillBadgeInactive";
import NavReturn from "@/app/components/NavReturn";
import useGetVote from "@/app/hooks/useGetVote";
import MemberInfographic, { VoteType } from "@/app/member/components/MemberInfographic";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GeoMap from "../components/GeoMap";
import ResultBadge from "../components/ResultBadge";
import VoteBar from "../components/VoteBar";

type FilterType = 'ALL' | 'YEA' | 'NAY' | 'PRES' | 'NOVT';

interface VoteInfoProps {
  navigation?: any;
  route?: any;
}

export default function VoteInfo({ navigation, route }: VoteInfoProps) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  const { vote_id } = route.params;
  const { allowBillNav } = route.params ?? { allowBillNav: false };
  const { vote, loading, error } = useGetVote(vote_id);
  const [filter, setFilter] = useState<FilterType>('ALL');

  const formattedDate = useMemo(() => formatDate(vote?.dateTime), [vote?.dateTime]);
  const yeas = useMemo(() => vote?.yeas ?? [], [vote?.yeas]);
  const nays = useMemo(() => vote?.nays ?? [], [vote?.nays]);
  const pres = useMemo(() => vote?.pres ?? [], [vote?.pres]);
  const novt = useMemo(() => vote?.novt ?? [], [vote?.novt]);

  const billNumber = useMemo(() => {
    const id = vote?.bill?.id;
    return id == null ? 0 : Number(id);
  }, [vote?.bill?.id]);

  // Combine all members into one array, tagging each with their vote type
  const allMembers = useMemo<any[]>(() => [
    ...yeas.map((m: any) => ({ ...(m.node ?? m), voteType: 'yea' as VoteType })),
    ...nays.map((m: any) => ({ ...(m.node ?? m), voteType: 'nay' as VoteType })),
    ...pres.map((m: any) => ({ ...(m.node ?? m), voteType: 'pres' as VoteType })),
    ...novt.map((m: any) => ({ ...(m.node ?? m), voteType: 'novt' as VoteType })),
  ], [yeas, nays, pres, novt]);

  const filteredMembers = useMemo<any[]>(() => {
    if (filter === 'ALL') return allMembers;
    const vt = filter.toLowerCase() as VoteType;
    return allMembers.filter(m => m.voteType === vt);
  }, [filter, allMembers]);

  const handleGoBack = useCallback(() => { navigation?.goBack?.(); }, [navigation]);

  const handleMemberPress = useCallback((item: any) => {
    navigation?.navigate('Member_info', { membershipId: item.id });
  }, [navigation]);

  const renderMember = useCallback(({ item }: { item: any }) => (
    <MemberInfographic
      node={item}
      voteType={item.voteType}
      handlePress={() => handleMemberPress(item)}
    />
  ), [handleMemberPress]);

  if (loading) return (
    <SafeAreaView style={[styles.container, styles.center]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, styles.center]} edges={["top"]}>
      <Text style={{ color: theme.text }}>Error loading vote: {error.message}</Text>
    </SafeAreaView>
  );

  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'ALL'  as FilterType, label: 'All',     count: allMembers.length },
    { id: 'YEA'  as FilterType, label: 'Yeas',    count: yeas.length },
    { id: 'NAY'  as FilterType, label: 'Nays',    count: nays.length },
    { id: 'PRES' as FilterType, label: 'Present', count: pres.length },
    { id: 'NOVT' as FilterType, label: 'No Vote', count: novt.length },
  ].filter(t => t.id === 'ALL' || t.count > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={handleGoBack} />
      <FlatList
        data={filteredMembers}
        keyExtractor={(item: any, idx: number) => `${item?.id ?? idx}_${idx}`}
        renderItem={renderMember}
        style={styles.list}
        contentContainerStyle={styles.listWrap}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListFooterComponent={() => <View style={{ height: 50 }} />}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <View>
            {/* ── Top info card ── */}
            <View style={styles.headerCard}>
              {/* Row: timestamp (left) · bill badge (right) */}
              <View style={styles.topRow}>
                <Text style={styles.dateText} numberOfLines={2}>{formattedDate}</Text>
                {allowBillNav
                  ? <BillBadge navigation={navigation} billNum={billNumber} />
                  : <BillBadgeInactive billNum={billNumber} />
                }
              </View>

              <Text style={styles.title}>{vote.title}</Text>
              {vote.question ? <Text style={styles.question}>{vote.question}</Text> : null}
              {vote.result   ? <ResultBadge result={vote.result} />                 : null}

              <View style={styles.voteBarWrap}>
                <VoteBar
                  yeas={yeas.length}
                  nays={nays.length}
                  pres={pres.length}
                  novt={novt.length}
                />
              </View>
            </View>

            {/* ── Geo map card (collapsible) ── */}
            <GeoMap yeas={yeas} nays={nays} pres={pres} novt={novt} />

            {/* ── Filter tabs card ── */}
            <View style={styles.filterCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabRow}
              >
                {tabs.map(t => {
                  const active = filter === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setFilter(t.id)}
                      style={[
                        styles.tab,
                        active && { borderColor: theme.primary, backgroundColor: theme.primary + '26' },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.tabLabel, active && { color: theme.primary }]}>
                        {t.label}
                      </Text>
                      <View style={[styles.tabBadge, active && { backgroundColor: theme.primary }]}>
                        <Text style={[styles.tabBadgeText, active && { color: '#fff' }]}>
                          {t.count}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    // toLocaleString renders in the user's local timezone automatically
    return d.toLocaleString();
  } catch {
    return value ?? '—';
  }
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
    backgroundColor: theme.background,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  // Widen the list and pad its content back by the same amount so card
  // side-shadows aren't clipped at the scroll view's edges.
  list: { marginHorizontal: -12 },
  listWrap: { paddingTop: 6, paddingBottom: 50, paddingHorizontal: 12 },

  // Info card
  headerCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  dateText: { fontSize: 13, color: theme.subtext, flexShrink: 1, fontWeight: '600' },
  title:    { fontSize: 18, fontWeight: '700', color: theme.titleText, marginBottom: 8 },
  question: { fontSize: 15, color: theme.subtext, fontWeight: '600', marginBottom: 4 },
  voteBarWrap: { marginTop: 12 },

  // Filter card
  filterCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  tabLabel:     { fontSize: 12, fontWeight: '600', color: theme.subtext },
  tabBadge: {
    backgroundColor: theme.secondary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: theme.subtext },
});
