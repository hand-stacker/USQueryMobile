import AccentCard from "@/app/components/AccentCard";
import MicroSummary from "@/app/components/MicroSummary";
import { ThemeContext } from "@/app/theme/themeContext";
import scaleFont from "@/app/utils/scaleFont";
import { useCallback, useContext, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import BillBadge from "./BillBadge";

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
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const maxHeight = scaleFont(200);
  const minHeight = scaleFont(90);
  // Provide a typed navigation prop so `navigate` accepts the route name and params.
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevInteraction, setPrevInteraction] = useState(false);
  const animatedHeight = useRef(new Animated.Value(minHeight)).current;
  
  const expand = useCallback(() => {
    Animated.timing(animatedHeight, {
      toValue: maxHeight,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setIsExpanded(true);
    if (!prevInteraction) setPrevInteraction(true);
  }, [animatedHeight, maxHeight, prevInteraction]);

  const collapse = useCallback(() => {
    Animated.timing(animatedHeight, {
      toValue: minHeight,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setIsExpanded(false);
  }, [animatedHeight, minHeight]);
  
  const handleLongPress = useCallback(() => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, collapse, expand]);
  
  const handlePress = useCallback(() => {
    navToBill(navigator, billId);
  }, [navigator, billId]);
  return (
    <AccentCard accentColor={theme.primary} style={{ padding: 0, marginBottom: 0 }}>
      <Pressable onPress={handlePress} onLongPress={handleLongPress}>
        <Animated.View style={[styles.animatedContent, {height: animatedHeight}]}>
          <View style={styles.headerRow}>
            <BillBadge navigation={navigator} billNum={Number(billNum)} />
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{billTitle}</Text>
          </View>
          {!isExpanded && (
            <Text style={styles.infoHint}>Long press to see more</Text>
          )}
          {isExpanded ? (
            <View style={styles.summaryContainer}>
              <MicroSummary text={billSummary} />
              <Text style={styles.infoHint}>Press to see more</Text>
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </AccentCard>
  );
}
const createStyles = (theme : any) =>
  StyleSheet.create({
    animatedContent: {
      width: '100%',
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.titleText,
      flex: 1,
    },
    summaryContainer: {
      marginTop: 8,
      maxHeight: scaleFont(240),
    },
    infoHint: {
    marginVertical: 8,
    fontSize: 12,
    color: theme.subtext,
    fontStyle: 'italic',
    fontWeight: '400',
    },
  });
