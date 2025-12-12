import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text } from "react-native";

type RootStackParamList = {
  Bill_info: { bill_id: string };
};
type BillInfographicProps={
  billId:string;
  billTitle:string;
  billType:string;
  billNum:string;
  billSummary:string;
}

export default function BillInfographic({ billId, billTitle, billType, billNum, billSummary }:BillInfographicProps) {
  // Provide a typed navigation prop so `navigate` accepts the route name and params.
  const navigator = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Bill_info'>>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevInteraction, setPrevInteraction] = useState(false);
  const animatedHeight = useRef(new Animated.Value(60)).current;
  const expand = () => {
    Animated.timing(animatedHeight, {
      toValue: 220,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setIsExpanded(true);
    if (!prevInteraction) setPrevInteraction(true);
  };

  const collapse = () => {
    Animated.timing(animatedHeight, {
      toValue: 60,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setIsExpanded(false);
  };
  const handleLongPress = () => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
    console.log("long pres")
  };
  const handlePress = () => {
    navigator.navigate('Bill_info', { bill_id: billId });
  };
  return (
    <Pressable 
      onPress={handlePress}
      onLongPress={handleLongPress}
      >
    <Animated.View style={styles.box}
    className={` ${
        prevInteraction ? "bg-secondary" : "bg-primary"
      }`}
    >
      <Text style = {styles.title}>
        ({billType}-{billNum})
      </Text>
      <Text
        style={styles.title}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {billTitle}
    </Text>
      {isExpanded && (
        <ScrollView style ={{ maxHeight: 200 }}
        className="max-h-128">
          <Text style = {styles.summary}
          className="text-base">
            {billSummary}
          </Text>
        </ScrollView>
      )}
    </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create(
  {
    box : {
      width:'100%',
      borderWidth:2,
      borderColor:'Black',
      maxHeight:250,
      padding:10,
      overflow:'scroll'

      
    },
    title: {
      fontSize:20
    },
    summary : {
      fontSize : 14,
      marginTop:10,
      overflow:'scroll'
    },
  }
)