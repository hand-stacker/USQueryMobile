import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../components/nav_return";
import VoteList from "../components/vote_list";
import useGetMembership from "../hooks/useGetMembership";

interface MemberInfoProps {
    navigation?: any;
    route?: any;
}

export default function MemberInfo({navigation, route}: MemberInfoProps) {
  const { membershipId } = route.params;
  const { member, loading, error, refetch } = useGetMembership(membershipId);
  if (loading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading bills: {error.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView
      style={styles.container}
      className="bg-primary"
    >
      <NavReturn onPress={() => navigation.goBack()}></NavReturn>
      <Text style={styles.large_text}>{member.full_name} {member.state}-[{member.party[0]}]</Text>
      <Text style={styles.large_text}>Role: {member.house ? "House" : "Senate"}</Text>
      <VoteList data={member.vote_list} personal={true}></VoteList>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container : {
    flex:1,
    paddingHorizontal:'12%',
    paddingTop:'5%',
    paddingBottom:'20%',
  },
  large_text:{
    fontSize:24,
    fontWeight:'600',
    marginBottom:12,
    color:'white',
  },
  text:{
    fontSize:16,
    marginBottom:5,
    color:'white',
  },
})