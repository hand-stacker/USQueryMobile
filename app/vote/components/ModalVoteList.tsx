import CloseButton from "@/app/components/CloseButton";
import MemberList from "@/app/member/components/MemberList";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface Props {
    data: any;
    vote_type: string;
    navigation: any;
}

const ModalVoteList = ({data, vote_type, navigation}:Props)=> {
  const [visible, setVisible] = useState(false);
  const items = data?.edges ?? data ?? [];
  const count = Array.isArray(items) ? items.length : 0;

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.box} onPress={() => setVisible(true)} accessibilityRole="button">
        <Text style={styles.countText}>{count} {vote_type}</Text>
        <Text style={styles.hintText}>Tap to view list</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{vote_type} ({count})</Text>
              <CloseButton onPress={() => setVisible(false)} />
            </View>
            <MemberList data={items.map((item: any) => item.node ?? item)} navigation={navigation} parentHandlePress={() => setVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export default ModalVoteList;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  box: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  countText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  hintText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  modalSafe: { flex: 1, backgroundColor: '#f8fafc' },
  modalInner: { flex: 1, paddingHorizontal: '8%', paddingTop: '5%', paddingBottom: '8%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  rowItem: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12 },
  text: { fontSize: 16, color: '#0f172a' },
  subText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});