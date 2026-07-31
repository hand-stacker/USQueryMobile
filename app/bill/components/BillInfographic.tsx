import AccentCard from "@/app/components/AccentCard";
import { ThemeContext } from "@/app/theme/themeContext";
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
  highlighted?: boolean;
}

function navToBill(navigation: any, billId: any) {
  navigation.navigate("Bill_info", {bill_id: billId});
}

export default function BillInfographic({navigator, billId, billTitle, billNum, statusCode, highlighted = false}:BillInfographicProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const isHouse = useMemo(() => {
    const t = parseInt(String(billNum)[3] ?? '0', 10);
    return t > 3;
  }, [billNum]);

  const handlePress = useCallback(() => {
    navToBill(navigator, billId);
  }, [navigator, billId]);

  return (
    <AccentCard accentColor={highlighted ? theme.accent : theme.primary} style={{ padding: 0, marginBottom: 0 }}>
      <Pressable onPress={handlePress}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <BillBadge navigation={navigator} billNum={Number(billNum)} />
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{billTitle}</Text>
          </View>
          <BillStatusTag statusCode={statusCode} isHouse={isHouse} />
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
  });
