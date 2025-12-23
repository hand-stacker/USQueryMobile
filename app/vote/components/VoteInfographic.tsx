import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BillBadge from "../../bill/components/BillBadge";
interface Props {
    node: any;
    personal: boolean;
    navigation: any;
}

function navToVote(navigation: any, id: any) {
  navigation.navigate("Vote_info", {vote_id: id});
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch {
    return value;
  }
}

const VoteInfographic = memo(function VoteInfographic({ node, personal, navigation }: Props) {
  const billId = personal ? node.bill : (node.bill?.id ?? node.bill);
  const resultText = personal ? node.mem_vote : node.result;

  const resultPassed = typeof resultText === 'string' && /pass|yea|aye/i.test(resultText);
  const resultFailed = typeof resultText === 'string' && /fail|nay|no|present/i.test(resultText);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.date}>{formatDateTime(node.dateTime)}</Text>
      </View>
      <View style={styles.cardRight}>
        <BillBadge navigation={navigation} billNum={Number(billId)} />
        <Pressable onPress={() => navToVote(navigation, node.id)} style={styles.voteButton}>
          <Text style={styles.voteButtonText}>Open Vote</Text>
        </Pressable>
      </View>
      <View style={[styles.resultPill, resultPassed ? styles.passed : resultFailed ? styles.failed : styles.neutral]}>
        <Text style={styles.resultPillText} numberOfLines={1} ellipsizeMode="tail">{resultText ?? '—'}</Text>
      </View>
      
    </View>
  );
}, (prev, next) => {
  return prev.node?.id === next.node?.id && prev.personal === next.personal;
});

export default VoteInfographic;

const styles = StyleSheet.create(
    {
    listContainer: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    list: {
      flex: 1,
    },
    cardLeft: {
      width: 120,
      paddingRight: 12,
      justifyContent: 'center',
    },
    date: {
      fontSize: 12,
      color: '#6B7280',
    },
    cardRight: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    voteButton: {
      backgroundColor: '#0EA5A9',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 8,
      flexShrink: 0,
    },
    voteButtonText: {
      color: '#ffffff',
      fontWeight: '700',
    },
    resultPill: {
      marginLeft: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    resultPillText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 13,
    },
    passed: { backgroundColor: '#16A34A' },
    failed: { backgroundColor: '#EF4444' },
    neutral: { backgroundColor: '#6B7280' },
    card: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
      marginVertical: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }
}
)