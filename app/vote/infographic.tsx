import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function VoteInfoSmall() {
  const { vote_id } = useLocalSearchParams();
  // need to get congress num as well
  return (
    <>
    <View
    className="backgroud-blue max-height-30px border-5 border-black flex-1 items-center justify-center"
    >
      <Text>Vote info small : {vote_id}</Text>
    </View>
    </>
  );
}