import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CollapsibleVoteList from "../components/collapsible_vote_list";
import NavReturn from "../components/nav_return";
import useGetVote from "../hooks/useGetVote";

interface VoteInfoProps {
    navigation?: any;
    route?: any;
}
export default function VoteInfo({ navigation, route }: VoteInfoProps) {
  const { vote_id } = route.params;
  const { vote, loading, error, refetch } = useGetVote(vote_id);

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
      <Text style={styles.large_text}>Date : {vote.dateTime}</Text>
      <Text style={styles.large_text}>Title : {vote.title}</Text>
      <Text style={styles.large_text}>Question : {vote.question}</Text>
      <Text style={styles.large_text}>Result : {vote.result}</Text>
      <CollapsibleVoteList data={vote.yeas} vote_type="YEAS" navigation={navigation}></CollapsibleVoteList>
      <CollapsibleVoteList data={vote.nays} vote_type="NAYS" navigation={navigation}></CollapsibleVoteList>
      <CollapsibleVoteList data={vote.pres} vote_type="PRESENT" navigation={navigation}></CollapsibleVoteList>
      <CollapsibleVoteList data={vote.novt} vote_type="NO VOTE" navigation={navigation}></CollapsibleVoteList>
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