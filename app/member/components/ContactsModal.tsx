import CloseButton from "@/app/components/CloseButton";
import { ThemeContext } from "@/app/theme/themeContext";
import { useContext } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface Props {
  contactModalVisible: boolean;
  setContactModalVisible: (visible: boolean) => void;
  handleOpenLink: (url?: string) => void;
  office: string;
  phone: string;
  official_link: string;
}
export default function ContactModal ({ contactModalVisible, setContactModalVisible, handleOpenLink, office, phone, official_link } : Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <Modal
      visible={contactModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setContactModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={() => setContactModalVisible(false)} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact Information</Text>
            <CloseButton onPress={() => setContactModalVisible(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalRow}>
              <Text style={styles.modalRowLabel}>Office</Text>
              <Text style={[styles.modalRowValue, { flex: 1 }]}>{office ?? 'No Address Provided Yet'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalRowLabel}>Phone</Text>
              <Text style={[styles.modalRowValue, { flex: 1 }]}>{phone ?? 'No Phone Number Provided Yet'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalRowLabel}>Website</Text>
              <Pressable onPress={() => handleOpenLink(official_link)} style={{ flex: 1 }}>
                <Text style={[styles.modalRowValue, styles.linkText]}>{official_link ?? 'No Website Provided Yet'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => setContactModalVisible(false)} />
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 16,
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
  modalScroll: {
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  modalRowLabel: {
    width: 80,
    color: theme.subtext,
    fontWeight: '600',
  },
  modalRowValue: {
    color: theme.text,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 13,
    color: theme.primary,
    lineHeight: 18,
  },
});
