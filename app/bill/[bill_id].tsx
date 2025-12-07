import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function BillInfo() {
  const { bill_id } = useLocalSearchParams<{ bill_id: string }>();
  return (
    <View
    >
      <Text>Bill Info Regular : {bill_id}</Text>
    </View>
  );
}