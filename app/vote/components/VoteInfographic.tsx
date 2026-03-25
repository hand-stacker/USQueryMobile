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
  return (
    <Pressable onPress={() => navigation.navigate("Vote_info", {vote_id: node.id, allowBillNav: true})}>
      <View style={styles.card}>
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
      </View>
    </Pressable>
  );
}, (prev, next) => {
  return prev.node?.id === next.node?.id && prev.personal === next.personal;
});

export default VoteInfographic;
const createStyles = (theme: any) => StyleSheet.create({
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  list: {
    flex: 1,
  },
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
  card: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    shadowColor: theme.shadow,
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