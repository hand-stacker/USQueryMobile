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
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const theme = useContext(ThemeContext).theme;
  const styles = createStyles(theme); 
  return (<View style={styles.labelContainer}>
    <View style={styles.labelBar} />
    <Text style={styles.label}>{children}</Text>
  </View>);
});

const ActionList = ({data, summary_text, navigator, header}:Props)=> {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const headerElement = useMemo(() => (
    <>
      {header}
      <SectionLabel>Summary</SectionLabel>
      <Summary text={summary_text} />
      <SectionLabel>Action Timeline</SectionLabel>
    </>
  ), [header, summary_text]);

  const renderItem = useCallback(({ item } :any) => {
    const node = item.node ?? item;
    return (
      <View style={styles.itemCard}>
          <Text style={styles.itemDate}>{node.actionDate}</Text>
          <Text style={styles.itemText}>{node.text}</Text>
          {node.voteId && (
            <VoteBadge voteId={node.voteId} navigation={navigator} allowBillNav={false} />
          )}
      </View>
    );
  }, [theme]);

  const ItemSeparator = useMemo(() => <View style={{ height: 12 }} />, []);
  const ListFooter = useMemo(() => <View style={{ height: 50 }} />, []);
  const keyExtractor = useCallback((item: any, index: number) => {
    const node = item?.node ?? item;
    return String(node?.id ?? node?.key ?? index);
  }, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerElement}
      ItemSeparatorComponent={ItemSeparator}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.listContainer}
    />
);
}

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
  itemDate: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 15,
    color: theme.text,
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