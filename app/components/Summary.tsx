import React, { useContext, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../theme/themeContext";
import CloseButton from "./CloseButton";

function markdownToPlaintext(md: string | null | undefined) {
  if (!md) return "";
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]*)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/\*(.*?)\*/g, "$1");
  text = text.replace(/_(.*?)_/g, "$1");
  text = text.replace(/^#{1,6}\s*/gm, "");
  text = text.replace(/^[\-\*\+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/\n{2,}/g, "\n\n");
  return text.trim();
}

const Summary: React.FC<{ text?: string }> = ({ text }) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [visible, setVisible] = useState(false);
  const plain = markdownToPlaintext(text);
  if (!plain) return null;

  const MAX_CHARS = 300;
  const needsTruncate = plain.length > MAX_CHARS;
  const truncated = needsTruncate ? `${plain.slice(0, MAX_CHARS).trim()}…` : plain;

  return (
    <>
      <Pressable onPress={() => needsTruncate && setVisible(true)}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{truncated}</Text>
          {needsTruncate && <Text style={styles.summaryHint}>Press to read full summary</Text>}
        </View>
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setVisible(false)} />
          <View style={styles.modalCard} >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Summary</Text>
              <CloseButton onPress={() => setVisible(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalText}>{plain}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Summary;

const createStyles = (theme: any) => StyleSheet.create({ 
  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: theme.subtext,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.8,
  },
  modalClose: {
    fontSize: 14,
    color: theme.subtext,
    fontWeight: '500',
  },
  modalScroll: {
    padding: 16,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.text,
    fontWeight: '500',
  },
});