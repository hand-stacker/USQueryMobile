import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const [visible, setVisible] = useState(false);
  const plain = markdownToPlaintext(text);
  if (!plain) return null;

  const MAX_CHARS = 300;
  const needsTruncate = plain.length > MAX_CHARS;
  const truncated = needsTruncate ? `${plain.slice(0, MAX_CHARS).trim()}…` : plain;

  return (
    <>
      <Pressable onLongPress={() => needsTruncate && setVisible(true)}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{truncated}</Text>
          {needsTruncate && <Text style={styles.summaryHint}>Long press to read full summary</Text>}
        </View>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Summary</Text>
              <CloseButton onPress={() => setVisible(false)} />
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalText}>{plain}</Text>
            </ScrollView>
            <Pressable style={styles.modalCloseButton} onPress={() => setVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Summary;

const styles = StyleSheet.create({
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
  summaryText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 20,
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 12
  },
  modalHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12},
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  modalClose: {
    position: 'absolute',
    right: 12,
    top: 10,
    zIndex: 10,
    padding: 6,
  },
  modalScroll: {
    paddingTop: 36,
    paddingBottom: 12,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  modalCloseButton: { 
    marginTop: 12, 
    backgroundColor: '#f3f4f6', 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  modalCloseText: { 
    color: '#111827', 
    fontWeight: '700' 
  },
});
