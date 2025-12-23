import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../components/nav_return";
import useGetVote from "../hooks/useGetVote";
import ModalVoteList from "./components/ModalVoteList";

interface VoteInfoProps {
    navigation?: any;
    route?: any;
}
export default function VoteInfo({ navigation, route }: VoteInfoProps) {
  const { vote_id } = route.params;
  const { vote, loading, error, refetch } = useGetVote(vote_id);

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

  const formattedDate = useMemo(() => formatDate(vote?.dateTime), [vote?.dateTime]);
  const isPassed = useMemo(() => Boolean(vote?.result && vote.result.toLowerCase().includes('pass')), [vote?.result]);
  const resultStyle = useMemo(() => [styles.resultPill, isPassed ? styles.passed : styles.failed], [isPassed]);
  const yeas = useMemo(() => vote?.yeas ?? [], [vote?.yeas]);
  const nays = useMemo(() => vote?.nays ?? [], [vote?.nays]);
  const pres = useMemo(() => vote?.pres ?? [], [vote?.pres]);
  const novt = useMemo(() => vote?.novt ?? [], [vote?.novt]);
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <NavReturn onPress={() => navigation.goBack()} />

          <View style={styles.headerCard}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.title}>{vote.title}</Text>
          {vote.question ? <Text style={styles.question}>{vote.question}</Text> : null}
          <View style={styles.rowBetween}>
            <Text style={styles.resultLabel}>Result</Text>
            <Text style={resultStyle}>{vote.result ?? '—'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.listWrap}>
          {yeas.length > 0 && <ModalVoteList data={yeas} vote_type="YEAS" navigation={navigation} />}
          {nays.length > 0 && <ModalVoteList data={nays} vote_type="NAYS" navigation={navigation} />}
          {pres.length > 0 && <ModalVoteList data={pres} vote_type="PRESENT" navigation={navigation} />}
          {novt.length > 0 && <ModalVoteList data={novt} vote_type="NO VOTE" navigation={navigation} />}
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
  listWrap: { paddingTop: 6, paddingBottom: 40 },
});