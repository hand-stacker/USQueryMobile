import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MemberList from "../components/mem_list";
import MemberSearchModal from "../components/mem_search_modal";
import SearchButton from "../components/search_button";
import useGetMembershipSet from "../hooks/useGetMembershipSet";

export default function MemberFYP({navigation}: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVars, setSearchVars] = useState<any>({ congress: 119, chamber: 'Senate', state: 'CA' });
  const {members, loading, error} = useGetMembershipSet(119,"Senate","CA");
  if (loading ) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error ) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading bills: {error?.message}</Text>
    </SafeAreaView>
  );
  return (
    <SafeAreaView
      style={styles.container}
      className="flex-1 bg-primary"
    >
      <SearchButton label="Search Reps" onPress={()=> setModalVisible(true)} />
      <MemberSearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initial={searchVars}
        onSearch={(vars:any) => {
          setSearchVars({ ...searchVars, ...vars });
        }}
      />
      <MemberList data={members.members} navigator={navigation} />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
  }
})