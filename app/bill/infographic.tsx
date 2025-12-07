import { useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text } from "react-native";
type BillInfographicProps={
  billId:string;
  billTitle:string;
  billType:string;
  billNum:string;
  billSummary:string;
}

export default function BillInfographic({ billId, billTitle, billType, billNum, billSummary }:BillInfographicProps) {
  
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

  };
  return (
    <Pressable 
      onPress={()=> console.log("pressed info")}
      onLongPress={handleLongPress}
      >
    <Animated.View style={styles.box}
    className={` ${
        prevInteraction ? "bg-secondary" : "bg-primary"
      }`}
    >
      <Text style = {styles.title}>
        ({billType}-{billNum}) {billTitle}
      </Text>
      {isExpanded && (
        <ScrollView
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