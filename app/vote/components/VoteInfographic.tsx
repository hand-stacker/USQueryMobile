import React, { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BillBadge from "../../bill/components/BillBadge";
import ResultBadge from "./ResultBadge";
import VoteBadge from "./VoteBadge";
interface Props {
    node: any;
    personal: boolean;
    navigation: any;
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
  return (
    <View style={styles.card}>
      <View style={[styles.dateContainer, styles.headerRow]}>
          <Text style={styles.date}>{formatDateTime(node.dateTime)}</Text>
        </View>
      <View style={styles.resultRow}>
        <ResultBadge result={resultText} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.headerRow}
      >
        <BillBadge navigation={navigation} billNum={Number(billId)} />
        <VoteBadge navigation={navigation} voteId={node.id} />
      </ScrollView>
      
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
      paddingRight: 8,
    },
    dateContainer: {
      width: 120,
      paddingRight: 12,
      justifyContent: 'center',
    },
    resultRow: {
      marginVertical: 8,
    }
}
)