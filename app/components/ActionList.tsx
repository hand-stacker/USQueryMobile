import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import VoteBadge from "../vote/components/VoteBadge";
import Summary from "./Summary";

interface Props {
    data: any;
    summary_text: string;
    navigator: any;
    header?: React.ReactElement | null;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
    <View style={styles.labelContainer}>
        <View style={styles.labelBar} />
        <Text style={styles.label}>{children}</Text>
    </View>
));

const ActionList = ({data, summary_text, navigator, header}:Props)=> {
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
    }, []);

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

const styles = StyleSheet.create({
    listContainer: {
        paddingTop: 12,
        paddingBottom: 24,
    },
    label: {
        fontSize: 13,
        color: "#0f172a",
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
        backgroundColor: "#0EA5A9",
        marginRight: 8,
    },
    itemCard: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    itemDate: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 6,
    },
    itemText: {
        fontSize: 15,
        color: "#111827",
    },
    voteButton: {
        marginTop: 8,
        alignSelf: "flex-start",
        backgroundColor: "#0EA5A9",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    voteButtonText: {
        color: "white",
        fontWeight: "600",
    },
    
});