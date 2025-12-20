import React, { useState } from "react";
import { ActivityIndicator, Button, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../components/nav_return";
import SearchBar from "../components/search_bar";
import VoteList from "../components/vote_list";
import useGetRecentVotes from "../hooks/useGetRecentVotes";
import useGetSubjects from "../hooks/useGetSubjects";
interface Props {
    navigation: any;
}

export default function VoteSearch({navigation}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  const { subjects, loading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useGetSubjects();
  // start with an initial fetch (no filters) — user will refine and press Search
  const { votes, loading, error, refetch } = useGetRecentVotes();

  const reloadData = () => {
    refetch();
  }

  const edges = Array.isArray(votes)
    ? []
    : (votes && (votes.edges ?? []));
  if (loading || subjectsLoading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error || subjectsError) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <Text>Error loading page: {error?.message || subjectsError?.message}</Text>
    </SafeAreaView>
  );
  //const {data: bills, loading : billsLoading, reset, error: billsError} = null
  return (
    <SafeAreaView style={styles.container} className="flex-1 bg-primary">
      <View style={styles.form}>
        <NavReturn onPress={() => navigation.goBack()}></NavReturn>
        <Text style={styles.text}>Search for Votes with select topics:</Text>
        <SearchBar
          placeholder="Specify a topic..."
          value={searchQuery}
          onChangeText={(text : string) => setSearchQuery(text)}
        />
        <Text style={{marginTop:8, fontWeight:'600'}}>Subjects (multi-select)</Text>
        <View style={{maxHeight:140, marginVertical:8}}>
          <ScrollView>
            <View style={{flexDirection:'row', flexWrap:'wrap'}}>
              {subjects.map((s: any)=> (
                <Pressable key={s.id} onPress={()=> {
                    setSelectedSubjects(prev => prev.includes(s.id) ? prev.filter(x=> x!==s.id) : [...prev, Number(s.id)]);
                  }}
                  style={[styles.chip, selectedSubjects.includes(s.id) && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selectedSubjects.includes(s.id) && styles.chipTextSelected]}>{s.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <Button title="Search" onPress={()=> {
          // translate local state into the variables expected by the hook
          const variables: any = {
            after: null,
            first: 10,
            subject_list: selectedSubjects.length ? selectedSubjects : undefined,
          };
          console.log('Searching with variables:', variables);
          refetch(variables);
        }} color="black"/>
      </View>
      <VoteList data={edges} personal={false} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(
  {
    container:{
      flex:1,
      marginTop:30,
      backgroundColor:'#f5f5f5',
      paddingHorizontal:'12%',
      paddingTop:'5%',
      paddingBottom:'20%',
    },
    form: {
      backgroundColor:'white',
      padding:20,
      borderRadius:10,
      shadowColor:'black',
      shadowOffset:{
        width:0,
        height:2
      },
      shadowOpacity:0.30,
      shadowRadius: 6,
      elevation:5,
      marginBottom:20,
    },
    text:{
      fontSize:16,
      marginBottom:5,
      fontWeight:'bold'
    },
    backButton:{}
  }
)