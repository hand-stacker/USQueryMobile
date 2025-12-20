import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CloseButton from "./close_button";
interface Props {
    data: any;
    vote_type: string;
}

export type MemberStackParamList = {
  Member_FYP:undefined;
  Member_info: { membershipId: string };
};

export type TabParamList = {
  'Bill Stack': undefined;
  'Member Stack': {
    screen: keyof MemberStackParamList;
    params?: MemberStackParamList[keyof MemberStackParamList];
  };
};

const CollapsibleVoteList = ({data, vote_type}:Props)=> {
  const [visible, setVisible] = useState(false);
  const navigator = useNavigation<NativeStackNavigationProp<TabParamList>>();

  const items = data?.edges ?? data ?? [];
  const count = Array.isArray(items) ? items.length : 0;

  const handlePress = (node: any) => {
    setVisible(false);
    navigator.navigate('Member Stack', {
        screen: 'Member_info',
        params: {membershipId: node.id},
    });
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.box} onPress={() => setVisible(true)} accessibilityRole="button">
        <Text style={styles.countText}>{count} {vote_type}</Text>
        <Text style={styles.hintText}>Press to view list of votes</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Votes ({count})</Text>
            <CloseButton onPress={() => setVisible(false)} />
          </View>

          <FlatList
            data={items}
            renderItem={({ item }) => {
              const node = item.node ?? item;
              return (
                <View style={styles.box}>
                  <Pressable onPress={() => {handlePress(node);}}>
                    <Text style={styles.text}>{node.member?.fullName ?? 'Unknown'} : {node.state} - [{node.party?.[0] ?? ''}]</Text>
                  </Pressable>
                </View>
              );
            }}
            keyExtractor={(item, idx) => (item?.node?.id ?? item?.id ?? idx).toString()}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export default CollapsibleVoteList;

const styles = StyleSheet.create(
  {
    box : {
      width:'100%',
      borderWidth:2,
      borderColor:'Black',
      maxHeight:250,
      minHeight:50,
      padding:10,
      overflow:'scroll'

      
    },
    text : {
      fontSize : 20,
      marginTop:10,
      color:'black',
    },
    countText: {
      fontSize: 18,
      fontWeight: 'bold',
    }
    ,
    hintText: {
      fontSize: 14,
      color: 'gray',
    },
    container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 12,}
  }
)