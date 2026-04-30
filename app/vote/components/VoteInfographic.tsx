import AccentCard from "@/app/components/AccentCard";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { memo, useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BillBadge from "../../bill/components/BillBadge";
import ResultBadge from "./ResultBadge";
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
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const billId = personal ? node.bill : (node.bill?.id ?? node.bill);
  const resultText = personal ? node.mem_vote : node.result;
  const accentColor = /pass|yea|aye|agreed|accepted|well/i.test(resultText ?? '')
    ? '#16A34A'
    : /fail|nay|no|rejected|defeated/i.test(resultText ?? '')
    ? '#EF4444'
    : theme.primary;
  return (
    <Pressable onPress={() => navigation.navigate("Vote_info", {vote_id: node.id, allowBillNav: true})}>
      <AccentCard accentColor={accentColor} style={{ marginVertical: 4, overflow: 'hidden' }}>
        <Text style={styles.date}>{formatDateTime(node.dateTime)}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.headerRow}
        >
          <Text style={styles.label}>Bill: </Text>
          <BillBadge navigation={navigation} billNum={Number(billId)} />
        </ScrollView>
        <View style={styles.resultRow}>
          <ResultBadge result={resultText} />
        </View>
      </AccentCard>
    </Pressable>
  );
}, (prev, next) => {
  return prev.node?.id === next.node?.id && prev.personal === next.personal;
});

export default VoteInfographic;
const createStyles = (theme: any) => StyleSheet.create({
  date: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '600',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  resultRow: {
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    color: theme.text,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginRight: 5,
  },
});