import CloseButton from "@/app/components/close_button";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface Props {
    data: any;
    vote_type: string;
    navigation: any;
}

function navToMember(navigation: any, node: any) {
  navigation.navigate("Member_info", {membershipId: node.id});
}

const ModalVoteList = ({data, vote_type, navigation}:Props)=> {
  const [visible, setVisible] = useState(false);

  const items = data?.edges ?? data ?? [];
  const count = Array.isArray(items) ? items.length : 0;

  const handlePress = (node: any) => {
    setVisible(false);
    navToMember(navigation, node);
  }

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
              <Text style={styles.modalTitle}>Votes ({count})</Text>
              <CloseButton onPress={() => setVisible(false)} />
            </View>

            <FlatList
              data={items}
              renderItem={({ item }) => {
                const node = item.node ?? item;
                return (
                  <View style={styles.rowItem}>
                    <Pressable onPress={() => {handlePress(node);}}>
                      <Text style={styles.text}>{node.member?.fullName ?? 'Unknown'}</Text>
                      <Text style={styles.subText}>{node.state} • [{node.party?.[0] ?? ''}]</Text>
                    </Pressable>
                  </View>
                );
              }}
              keyExtractor={(item, idx) => (item?.node?.id ?? item?.id ?? idx).toString()}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListFooterComponent={() => <View style={{height:50}} />}
            />
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