import StarButton from "@/app/bill/components/BillStarButton";
import ActionList from "@/app/components/ActionList";
import NavReturn from "@/app/components/NavReturn";
import useGetBill from "@/app/hooks/useGetBill";
import { useStarredBillsStore } from "@/app/store/starredBillsStore";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BillBadgeInactive from "../components/BillBadgeInactive";
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
  const { bill_id } = route.params;
  const { bill, loading, error, refetch } = useGetBill(bill_id);
  const storeStars = useStarredBillsStore((s) => s.stars);
  const starred = useMemo(() => storeStars.includes(String(bill_id)), [storeStars, bill_id]);
  const billNum = useMemo(() => Number(bill_id), [bill_id]);
  const subjects = useMemo(() => bill?.subjects ?? [], [bill?.subjects]);
  const originDate = useMemo(() => formatDate(bill?.originDate), [bill?.originDate]);
  const latestActionDate = useMemo(() => formatDate(bill?.latestAction), [bill?.latestAction]);
  const policyArea = useMemo(() => bill?.policyArea ?? "—", [bill?.policyArea]);
  const title = useMemo(() => bill?.title ?? "", [bill?.title]);

  const headerElement = useMemo(() => {
    return (
      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <BillBadgeInactive billNum={billNum} />
          <BillStatus status_type={bill?.status} />
          
          {String(bill_id).startsWith('119') && <StarButton billId={bill_id} />}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Origin:</Text>
          <Text style={styles.metaValue}>{originDate}</Text>
          <Text style={[styles.metaLabel, { marginLeft: 12 }]}>Latest:</Text>
          <Text style={styles.metaValue}>{latestActionDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Policy area:</Text>
          <Text style={styles.metaValue}>{policyArea}</Text>
        </View>

        <View style={styles.subjectsRow}>
          <Text style={styles.metaLabel}>Subjects:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
          >
            {subjects.map((s: any, i: number) => (
              <View key={s?.id ?? s?.name ?? i} style={styles.chip}>
                <Text style={styles.chipText}>{s?.name ?? ""}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }, [subjects, originDate, latestActionDate, policyArea, title, billNum, bill?.status, starred, bill?.id]);

  const actions = useMemo(() => bill?.actions ?? [], [bill?.actions]);
  const summaryText = useMemo(() => bill?.summary ?? "", [bill?.summary]);

  const handleGoBack = useCallback(() => {
    if (navigation && navigation.goBack) navigation.goBack();
  }, [navigation]);

  if (loading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]} edges={["top"]}>
      <Text>Error loading bills: {error.message}</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <NavReturn onPress={handleGoBack} />
        <ActionList data={actions} summary_text={summaryText} navigator={navigation} header={headerElement} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 6,
    fontWeight: "600",
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  subjectsRow: {
    marginTop: 10,
    
  },
  chipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginLeft: 6,
  },
  chipsScroll: {
    maxHeight: 44,
    marginLeft: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e6e9ee',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  chipText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
})