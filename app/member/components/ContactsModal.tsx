import CloseButton from "@/app/components/CloseButton";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
    contactModalVisible: boolean;
    setContactModalVisible: (visible: boolean) => void;
    handleOpenLink: (url?: string) => void;
    office: string;
    phone: string;
    official_link: string;
}
export default function ContactModal ({ contactModalVisible, setContactModalVisible, handleOpenLink, office, phone, official_link } : Props) {
    return (
    <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
    >
        <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Contact Information</Text>
                    <CloseButton onPress={() => setContactModalVisible(false)} />
                </View>
                <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Office</Text>
                    <Text style={styles.modalRowValue}>{office ?? 'No Address Provided Yet'}</Text>
                </View>

                <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Phone</Text>
                    <Text style={styles.modalRowValue}>{phone ?? 'No Phone Number Provided Yet'}</Text>
                </View>

                <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Website</Text>
                    <Pressable onPress={() => handleOpenLink(official_link)}>
                    <Text style={[styles.modalRowValue, styles.linkText]}>{official_link ?? 'No Website Provided Yet'}</Text>
                    </Pressable>
                </View>

                <Pressable style={styles.modalCloseButton} onPress={() => setContactModalVisible(false)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20 
    },
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#0f172a', 
        marginBottom: 12 
    },
    modalRow: { 
        flexDirection: 'row', 
        marginBottom: 8, 
        alignItems: 'flex-start' },
    modalRowLabel: {
        width: 80, 
        color: '#6B7280', 
        fontWeight: '600' },
    modalRowValue: { 
        flex: 1, 
        color: '#111827' 
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
    linkText: { 
        fontSize: 13, 
        color: '#2563eb', 
        lineHeight: 18
    },
});