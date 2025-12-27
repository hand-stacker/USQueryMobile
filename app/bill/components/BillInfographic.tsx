
import MicroSummary from "@/app/components/MicroSummary";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import BillBadgeInactive from "./BillBadgeInactive";

type BillInfographicProps={
  navigator: any;
  billId:string;
  billTitle:string;
  billNum:string;
  billSummary:string;
}

function navToBill(navigation: any, billId: any) {
  navigation.navigate("Bill_info", {bill_id: billId});
}

export default function BillInfographic({navigator, billId, billTitle, billNum, billSummary }:BillInfographicProps) {
  // Provide a typed navigation prop so `navigate` accepts the route name and params.
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevInteraction, setPrevInteraction] = useState(false);
  const animatedHeight = useRef(new Animated.Value(90)).current;
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
      toValue: 90,
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
  };
  const handlePress = () => {
    navToBill(navigator, billId);
  };
  return (
    <Pressable 
      onPress={handlePress}
      onLongPress={handleLongPress}
      >
    <Animated.View style={[styles.card, {height: animatedHeight}]}> 
      <View style={styles.headerRow}>
        <BillBadgeInactive billNum={Number(billNum)} />
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{billTitle}</Text>
      </View>
      {!isExpanded && (
        <Text style={styles.infoHint}>Long press to see more</Text>
      )}
      {isExpanded ? (
        <View style={styles.summaryContainer} >
          <MicroSummary text={billSummary} />
          <Text style={styles.infoHint}>Press to see more</Text>
        </View>
      ) : null}
    </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create(
  {
    card: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
      marginVertical: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0f172a',
      flex: 1,
    },
    summaryContainer: {
      marginTop: 8,
      maxHeight: 240,
    },
    infoHint: {
    marginVertical: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  }
  }
)