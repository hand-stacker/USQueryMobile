import BillBadge from "@/app/bill/components/BillBadge";
import BillBadgeInactive from "@/app/bill/components/BillBadgeInactive";
import NavReturn from "@/app/components/NavReturn";
import useGetVote from "@/app/hooks/useGetVote";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ModalVoteList from "../components/ModalVoteList";
import VotePieChart from "../components/PieChart";

interface VoteInfoProps {
    navigation?: any;
    route?: any;
}
export default function VoteInfo({ navigation, route}: VoteInfoProps) {
  const { vote_id } = route.params;
  const {allowBillNav} = route.params;
  const { vote, loading, error, refetch } = useGetVote(vote_id);
  const formattedDate = useMemo(() => formatDate(vote?.dateTime), [vote?.dateTime]);
  const isPassed = useMemo(() => {
    const r = vote?.result ?? '';
    const lr = typeof r === 'string' ? r.toLowerCase() : '';
    return lr.includes('pass') || lr.includes('agreed');
  }, [vote?.result]);
  const resultStyle = useMemo(() => [styles.resultPill, isPassed ? styles.passed : styles.failed], [isPassed]);
  const yeas = useMemo(() => vote?.yeas ?? [], [vote?.yeas]);
  const nays = useMemo(() => vote?.nays ?? [], [vote?.nays]);
  const pres = useMemo(() => vote?.pres ?? [], [vote?.pres]);
  const novt = useMemo(() => vote?.novt ?? [], [vote?.novt]);

  const handleGoBack = useCallback(() => { navigation?.goBack?.(); }, [navigation]);

  const billNumber = useMemo(() => {
    const id = vote?.bill?.id;
    return id == null ? 0 : Number(id);
  }, [vote?.bill?.id]);

  const yeasElem = useMemo(() => yeas.length > 0 ? <ModalVoteList data={yeas} vote_type="YEAS" navigation={navigation} /> : null, [yeas, navigation]);
  const naysElem = useMemo(() => nays.length > 0 ? <ModalVoteList data={nays} vote_type="NAYS" navigation={navigation} /> : null, [nays, navigation]);
  const presElem = useMemo(() => pres.length > 0 ? <ModalVoteList data={pres} vote_type="PRESENT" navigation={navigation} /> : null, [pres, navigation]);
  const novtElem = useMemo(() => novt.length > 0 ? <ModalVoteList data={novt} vote_type="NO VOTE" navigation={navigation} /> : null, [novt, navigation]);

  if (loading) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <Text>Error loading bills: {error.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <NavReturn onPress={handleGoBack} />

          

        <ScrollView contentContainerStyle={styles.listWrap}>
          <View style={styles.headerCard}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {/* only allow navigation to Bill if we got vote from a vote_list, 
                this is to prevent the user from recursively trapping themselves in nested bills/votes */}
            {allowBillNav && <BillBadge navigation={navigation} billNum={billNumber} />}
            {!allowBillNav && <BillBadgeInactive billNum={billNumber} />}
            <Text style={styles.title}>{vote.title}</Text>
            {vote.question ? <Text style={styles.question}>{vote.question}</Text> : null}
            <View style={styles.rowBetween}>
              <Text style={styles.resultLabel}>Result</Text>
              <Text style={resultStyle}>{vote.result ?? '—'}</Text>
            </View>
          </View>
          <VotePieChart data={{ YEAS: yeas.length, NAYS: nays.length, PRES: pres.length, NOVT: novt.length }} />
          {yeasElem}
          {naysElem}
          {presElem}
          {novtElem}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  centerOverlay: { justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  question: { fontSize: 15, color: '#374151', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  resultPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, color: '#fff', fontWeight: '700' },
  passed: { backgroundColor: '#16A34A' },
  failed: { backgroundColor: '#EF4444' },
  listWrap: { paddingTop: 6, paddingBottom: 50 },
});