import StarButton from "@/app/bill/components/BillStarButton";
import ActionList from "@/app/components/ActionList";
import NavReturn from "@/app/components/NavReturn";
import useGetBill from "@/app/hooks/useGetBill";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useCallback, useContext, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillBadgeInactive from "../components/BillBadgeInactive";
import BillInfoTabs from "../components/BillInfoTabs";
import BillProgressCard from "../components/BillProgressCard";
import BillStatus from "../components/BillStatus";

interface BillInfoProps {
  navigation: any;
  route: any;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

export default function BillInfo({ navigation, route }: BillInfoProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const { bill_id } = route.params;
  const { bill, loading, error } = useGetBill(bill_id);
  const billNum = useMemo(() => Number(bill_id), [bill_id]);

  const originDate = useMemo(() => formatDate(bill?.originDate), [bill?.originDate]);
  const latestActionDate = useMemo(() => formatDate(bill?.latestAction), [bill?.latestAction]);
  const policyArea = useMemo(() => bill?.policyArea ?? "—", [bill?.policyArea]);
  const title = useMemo(() => bill?.title ?? "", [bill?.title]);
  const subjects = useMemo(() => bill?.subjects ?? [], [bill?.subjects]);
  const actions = useMemo(() => bill?.actions ?? [], [bill?.actions]);
  const summaryText = useMemo(() => bill?.summary ?? "", [bill?.summary]);
  const currentStage = useMemo(() => bill?.currentStage ?? (bill?.status ? 4 : 0), [bill?.currentStage, bill?.status]);
  const sponsor = useMemo(() => bill?.sponsor ?? null, [bill?.sponsor]);
  const cosponsors = useMemo(() => bill?.cosponsors ?? [], [bill?.cosponsors]);
  const relatedBills = useMemo(() => bill?.relatedBills ?? [], [bill?.relatedBills]);

  const headerElement = useMemo(() => (
    <>
      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <View>
            <BillBadgeInactive billNum={billNum} />
            <View style={{ margin: 8 }} />
            <BillStatus status_type={bill?.status} />
          </View>
          {String(bill_id).startsWith('119') && <StarButton billId={bill_id} />}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Origin date:</Text>
          <Text style={styles.metaValue}>{originDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Latest action:</Text>
          <Text style={styles.metaValue}>{latestActionDate}</Text>
        </View>
      </View>

      <BillProgressCard currentStage={currentStage} />
    </>
  ), [title, originDate, latestActionDate, policyArea, billNum, bill?.status, bill_id, currentStage, theme]);

  const preTimelineElement = useMemo(() => (
    <BillInfoTabs
      sponsor={sponsor}
      cosponsors={cosponsors}
      subjects={subjects}
      policyArea={policyArea !== "—" ? policyArea : undefined}
      relatedBills={relatedBills}
      navigation={navigation}
    />
  ), [sponsor, cosponsors, subjects, policyArea, relatedBills]);

  const handleGoBack = useCallback(() => {
    if (navigation?.goBack) navigation.goBack();
  }, [navigation]);

  if (loading) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={["top"]}>
      <Text>Error loading bill: {error.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={handleGoBack} />
      <ActionList
        data={actions}
        summary_text={summaryText}
        navigator={navigation}
        header={headerElement}
        preTimeline={preTimelineElement}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: '24%',
    backgroundColor: theme.background,
  },
  headerCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.titleText,
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 13,
    color: theme.subtext,
    marginRight: 6,
    fontWeight: "600",
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
});
