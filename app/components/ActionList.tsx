import React, { useCallback, useContext, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../theme/themeContext";
import VoteBadge from "../vote/components/VoteBadge";
import Summary from "./Summary";

interface Props {
  data: any;
  summary_text: string;
  navigator: any;
  header?: React.ReactElement | null;
  preTimeline?: React.ReactElement | null;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const theme = useContext(ThemeContext).theme;
  const styles = createStyles(theme);
  return (
    <View style={styles.labelContainer}>
      <View style={styles.labelBar} />
      <Text style={styles.label}>{children}</Text>
    </View>
  );
});

const ActionList = ({ data, summary_text, navigator, header, preTimeline }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const listHeader = useMemo(() => (
    <>
      {header}
      <SectionLabel>Summary</SectionLabel>
      <Summary text={summary_text} />
      {preTimeline}
      <SectionLabel>Action Timeline</SectionLabel>
    </>
  ), [header, summary_text, preTimeline]);

  const renderItem = useCallback(({ item }: any) => {
    const node = item.node ?? item;
    const isVote = !!node.voteId;
    const typeLabel = isVote ? 'VOTE' : (node.type ?? 'FLOOR').toUpperCase();
    const borderColor = isVote ? theme.primary : '#22c55e';
    const badgeBg = isVote ? theme.primary + '30' : '#22c55e30';
    const badgeTextColor = isVote ? theme.primary : '#22c55e';

    return (
      <View style={[styles.itemCard, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemDate}>{node.actionDate}</Text>
          <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.typeBadgeText, { color: badgeTextColor }]}>{typeLabel}</Text>
          </View>
        </View>
        <Text style={styles.itemText}>{node.text}</Text>
        {node.voteId && (
          <VoteBadge voteId={node.voteId} navigation={navigator} allowBillNav={false} />
        )}
      </View>
    );
  }, [theme, navigator]);

  const ItemSeparator = useCallback(() => <View style={{ height: 12 }} />, []);
  const ListFooter = useCallback(() => <View style={{ height: 50 }} />, []);
  const keyExtractor = useCallback((item: any, index: number) => {
    const node = item?.node ?? item;
    return String(node?.id ?? node?.key ?? index);
  }, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={listHeader}
      ItemSeparatorComponent={ItemSeparator}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.listContainer}
    />
  );
};

export default React.memo(ActionList);

const createStyles = (theme: any) => StyleSheet.create({
  listContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  itemDate: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  itemText: {
    fontSize: 13,
    color: theme.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: theme.text,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  labelBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginRight: 8,
  },
});
