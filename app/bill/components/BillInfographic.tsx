import AccentCard from "@/app/components/AccentCard";
import { ThemeContext } from "@/app/theme/themeContext";
import formatDate from "@/app/utils/formatDate";
import { useCallback, useContext, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BillBadge from "./BillBadge";
import BillStatusTag from "./BillStatusTag";

type BillInfographicProps={
  navigator: any;
  billId:string;
  billTitle:string;
  billNum:string;
  statusCode:number;
  latestAction?: string | null;
  highlighted?: boolean;
}

function navToBill(navigation: any, billId: any) {
  navigation.navigate("Bill_info", {bill_id: billId});
}

export default function BillInfographic({navigator, billId, billTitle, billNum, statusCode, latestAction, highlighted = false}:BillInfographicProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const isHouse = useMemo(() => {
    const t = parseInt(String(billNum)[3] ?? '0', 10);
    return t > 3;
  }, [billNum]);

  const latestActionDate = useMemo(() => formatDate(latestAction), [latestAction]);

  const handlePress = useCallback(() => {
    navToBill(navigator, billId);
  }, [navigator, billId]);

  return (
    <AccentCard accentColor={highlighted ? theme.accent : theme.primary} style={{ padding: 0, marginBottom: 0 }}>
      <Pressable onPress={handlePress}>
        <View style={styles.content}>
          <Text style={styles.date}>{latestActionDate}</Text>
          <View style={styles.badgeRow}>
            <BillBadge navigation={navigator} billNum={Number(billNum)} />
            <BillStatusTag statusCode={statusCode} isHouse={isHouse} />
          </View>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{billTitle}</Text>
        </View>
      </Pressable>
    </AccentCard>
  );
}
const createStyles = (theme : any) =>
  StyleSheet.create({
    content: {
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    date: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
      marginBottom: 8,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.titleText,
    },
  });
