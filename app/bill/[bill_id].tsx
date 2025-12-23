import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionList from "../components/action_list";
import NavReturn from "../components/nav_return";
import useGetBill from "../hooks/useGetBill";
import BillBadgeInactive from "./components/BillBadgeInactive";
import BillStatus from "./components/BillStatus";
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
  const billNum = useMemo(() => Number(bill_id), [bill_id]);

  const headerElement = useMemo(() => {
    const subjects = bill?.subjects ?? [];
    return (
      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <BillBadgeInactive billNum={billNum} />
          <BillStatus status_type={bill?.status} />
        </View>

        <Text style={styles.title}>{bill?.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Origin:</Text>
          <Text style={styles.metaValue}>{formatDate(bill?.originDate)}</Text>
          <Text style={[styles.metaLabel, { marginLeft: 12 }]}>Latest:</Text>
          <Text style={styles.metaValue}>{formatDate(bill?.latestAction)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Policy area:</Text>
          <Text style={styles.metaValue}>{bill?.policyArea ?? "—"}</Text>
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
  }, [bill, billNum]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <NavReturn onPress={navigation.goBack} />
        <ActionList data={bill.actions} summary_text={bill.summary} navigator={navigation} header={headerElement} />
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
    paddingBottom: 40,
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