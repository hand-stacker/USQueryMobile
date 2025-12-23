import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    data: any;
    summary_text: string;
    navigator: any;
    header?: React.ReactElement | null;
}

function markdownToPlaintext(md: string | null | undefined) {
    if (!md) return "";
    let text = md;
    // Remove code fences and inline code
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/`([^`]*)`/g, "$1");
    // Remove images and keep alt text
    text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1");
    // Convert links to their text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // Remove emphasis markers
    text = text.replace(/\*\*(.*?)\*\*/g, "$1");
    text = text.replace(/\*(.*?)\*/g, "$1");
    text = text.replace(/_(.*?)_/g, "$1");
    // Remove headings markers
    text = text.replace(/^#{1,6}\s*/gm, "");
    // Remove list bullets
    text = text.replace(/^[\-\*\+]\s+/gm, "");
    text = text.replace(/^\d+\.\s+/gm, "");
    // Collapse multiple blank lines
    text = text.replace(/\n{2,}/g, "\n\n");
    return text.trim();
}

const Summary: React.FC<{ text?: string }> = ({ text }) => {
    const plain = markdownToPlaintext(text);
    if (!plain) return null;
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{plain}</Text>
        </View>
    );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.labelContainer}>
        <View style={styles.labelBar} />
        <Text style={styles.label}>{children}</Text>
    </View>
);

function navToVote(navigation: any, node: any) {
  navigation.navigate("Vote_info", {vote_id: node.voteId});
}

const ActionList = ({data, summary_text, navigator, header}:Props)=> {
    const Header = () => (
        <>
            {header}
            <SectionLabel>Summary</SectionLabel>
            <Summary text={summary_text} />
            <SectionLabel>Action Timeline</SectionLabel>
        </>
    );

    return (
        <FlatList
            data={data}
            renderItem={({ item }) => {
            const node = item.node ?? item;
            return (
                <View style={styles.itemCard}>
                    <Text style={styles.itemDate}>{node.actionDate}</Text>
                    <Text style={styles.itemText}>{node.text}</Text>
                    {node.voteId && (
                        <Pressable style={styles.voteButton} onPress={() => navToVote(navigator, node)}>
                            <Text style={styles.voteButtonText}>View Vote</Text>
                        </Pressable>
                    )}
                </View>
            );
            }}
            ListHeaderComponent={Header}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
            contentContainerStyle={styles.listContainer}
        />
    );
}

export default ActionList;

const styles = StyleSheet.create({
    listContainer: {
        paddingTop: 12,
        paddingBottom: 24,
    },
    summaryCard: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    summaryText: {
        fontSize: 15,
        color: "#111827",
        lineHeight: 20,
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