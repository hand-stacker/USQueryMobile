import { UnscalableText } from "@/app/components/UnscalableText";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../../components/NavReturn";
import useGetMembership from "../../hooks/useGetMembership";
import VoteList from "../../vote/components/VoteList";
import { getPartyInfo } from "../components/MemberInfographic";
import MemberTermList from "../components/MemberTermList";
import MemStarButton from "../components/MemStarButton";

interface MemberInfoProps {
  navigation?: any;
  route?: any;
}

type Tab = "overview" | "terms" | "votes";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "terms",    label: "Terms"    },
  { id: "votes",    label: "Votes"    },
];

function computeInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Present";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

export default function MemberInfo({ navigation, route }: MemberInfoProps) {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { membershipId } = route.params;
  const { member, loading, error } = useGetMembership(membershipId);
  const [tab, setTab] = useState<Tab>("overview");

  const fullName     = useMemo(() => member?.full_name     ?? "Unknown",  [member?.full_name]);
  const imageUrl     = useMemo(() => member?.image_link    ?? null,       [member?.image_link]);
  const initials     = useMemo(() => computeInitials(fullName),           [fullName]);
  const role         = useMemo(() => (member?.house ? "Representative" : "Senator"), [member?.house]);
  const state        = useMemo(() => member?.state         ?? "",         [member?.state]);
  const party        = useMemo(() => member?.party         ?? "",         [member?.party]);
  const district     = useMemo(() => member?.district_num  ?? null,       [member?.district_num]);
  const startDate    = useMemo(() => member?.start_date    ?? null,       [member?.start_date]);
  const endDate      = useMemo(() => member?.end_date      ?? null,       [member?.end_date]);
  const office       = useMemo(() => member?.office,                      [member?.office]);
  const phone        = useMemo(() => member?.phone,                       [member?.phone]);
  const officialLink = useMemo(() => member?.official_link,               [member?.official_link]);
  const termHistory  = useMemo(() => member?.external_terms  ?? [],       [member?.external_terms]);
  const partyHistory = useMemo(() => member?.external_party_history ?? [],[member?.external_party_history]);
  const voteList     = useMemo(() => member?.vote_list     ?? [],         [member?.vote_list]);

  const { color: partyColor } = useMemo(() => getPartyInfo(party), [party]);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleOpenLink = useCallback((url?: string) => {
    if (!url) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(normalized).catch(() => {});
  }, []);
  // main card
  const MainContent = useMemo(() => (
    <View style={[styles.main]}>
      <View style={styles.mainRow}>
        {/* Avatar */}
        <View style={[styles.avatarBox]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: partyColor + "22" }]}>
              <UnscalableText style={[styles.avatarInitials, { color: partyColor }]}>
                {initials}
              </UnscalableText>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.mainInfo}>
          <View style={styles.mainNameRow}>
            <UnscalableText style={styles.mainName} numberOfLines={2}>
              {fullName}
            </UnscalableText>
            <View style={[styles.partyBadge, { backgroundColor: partyColor }]}>
              <UnscalableText style={styles.partyBadgeText}>{party}</UnscalableText>
            </View>
          </View>
          <UnscalableText style={styles.mainSub}>
            {role} · {state}{district !== null ? `-${district}` : ""}
          </UnscalableText>
        </View>
        <MemStarButton membershipId={membershipId} />
      </View>
    </View>
  ), [imageUrl, initials, fullName, membershipId, role, district, state, party, partyColor, styles]);

  const TabBar = useMemo(() => (
    <View style={styles.tabBar}>
      {TABS.map(({ id, label }) => (
        <Pressable
          key={id}
          onPress={() => setTab(id)}
          style={styles.tabBtn}
        >
          <UnscalableText style={[styles.tabLabel, tab === id && { color: theme.primary }]}>
            {label}
          </UnscalableText>
          {tab === id && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />
          )}
        </Pressable>
      ))}
    </View>
  ), [tab, styles, theme.primary]);

  const OverviewContent = useMemo(() => (
    <View style={styles.tabContent}>
      {/* Service Period */}
      <View style={styles.card}>
        <UnscalableText style={styles.cardTitle}>Service Period</UnscalableText>
        <UnscalableText style={styles.servicePeriodText}>
          {formatDate(startDate)} - {formatDate(endDate ?? "Present")}
        </UnscalableText>
      </View>

      {/* Office */}
      <View style={styles.card}>
        <UnscalableText style={styles.cardTitle}>Contacts</UnscalableText>
        {([
          { label: "Address", value: office, icon: "📍", isLink: false },
          { label: "Phone", value: phone, icon: "📞", isLink: false },
          { label: "Website", value: officialLink, icon: "🌐", isLink: true },
        ] as const).map(({ label, value, icon, isLink }) => (
          <View key={label} style={styles.officeRow}>
            <View style={styles.officeIconBox}>
              <UnscalableText style={styles.officeIcon}>{icon}</UnscalableText>
            </View>
            <View style={styles.officeTextWrap}>
              <UnscalableText style={styles.officeLabel}>{label}</UnscalableText>
              <Text style={[styles.officeValue, isLink && { color: theme.primary }]}>
                {value ?? `No ${label} Provided Yet`}
              </Text>
            </View>
          </View>
        ))}
        {officialLink ? (
          <Pressable style={styles.officialWebBtn} onPress={() => handleOpenLink(officialLink)}>
            <UnscalableText style={styles.officialWebBtnText}>Official Website</UnscalableText>
          </Pressable>
        ) : null}
      </View>

      {/* Party History */}
      <View style={styles.card}>
        <UnscalableText style={styles.cardTitle}>Party History</UnscalableText>
        {partyHistory.map((ph: any, i: number) => {
          const { color: phColor } = getPartyInfo(ph.partyName);
          const isActive = !ph.end || ph.end === "Present";
          return (
            <View
              key={i}
              style={[
                styles.historyRow,
                {
                  backgroundColor: isActive ? phColor + "18" : theme.secondary,
                  borderColor:     isActive ? phColor + "55" : theme.border,
                },
              ]}
            >
              <UnscalableText style={styles.historyParty}>{ph.partyName}</UnscalableText>
              <UnscalableText style={styles.historyDates}>{ph.startYear} - {ph.endYear ?? "Present"}</UnscalableText>
            </View>
          );
        })}
      </View>

      <View style={{ height: 50 }} />
    </View>
  ), [startDate, endDate, office, phone, officialLink, partyHistory, theme, styles, handleOpenLink]);

  const VotesHeader = useMemo(() => (
    <>
      {MainContent}
      {TabBar}
      <View style={styles.sectionLabelWrap}>
        <View style={[styles.sectionLabelBar, { backgroundColor: theme.primary }]} />
        <UnscalableText style={styles.sectionLabelText}>Recent Votes</UnscalableText>
      </View>
    </>
  ), [MainContent, TabBar, styles, theme.primary]);

  if (loading) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <Text style={{ color: theme.text }}>Error loading member</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={goBack} />

      {tab === "votes" ? (
        <VoteList
          data={voteList}
          personal={true}
          navigation={navigation}
          header={VotesHeader}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {MainContent}
          {TabBar}
          {tab === "overview" ? OverviewContent : <MemberTermList termHistory={termHistory} partyColor={partyColor} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerOverlay: {
      justifyContent: "center",
      alignItems: "center",
    },

    // Main card
    main: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    mainRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    avatarBox: {
      width: 86,
      height: 86,
      borderRadius: 14,
      borderWidth: 2,
      overflow: "hidden",
      flexShrink: 0,
      marginRight: 14,
      borderColor: theme.border,
    },
    avatarImg: {
      width: "100%",
      height: "100%",
    },
    avatarFallback: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    mainInfo: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    mainNameRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
      marginBottom: 4,
    },
    mainName: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 22,
      flexShrink: 1,
      marginRight: 6,
    },
    partyBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
      flexShrink: 0,
      marginTop: 2,
    },
    partyBadgeText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 11,
      letterSpacing: 0.5,
    },
    mainSub: {
      color: theme.subtext,
      fontSize: 12,
      marginBottom: 3,
    },
    // tabs
    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      position: "relative",
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      color: theme.subtext,
    },
    tabIndicator: {
      position: "absolute",
      bottom: 0,
      left: "20%",
      right: "20%",
      height: 2,
      borderRadius: 2,
    },
    tabContent: {
      paddingHorizontal: 12,
      paddingTop: 14,
    },

    // cards
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: theme.subtext,
      marginBottom: 12,
    },
    servicePeriodText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: 0.2,
    },

    // office stuff
    officeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    officeIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.secondary,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginRight: 12,
    },
    officeIcon: {
      fontSize: 14,
    },
    officeTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    officeLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.subtext,
      marginBottom: 2,
    },
    officeValue: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.text,
    },
    officialWebBtn: {
      marginTop: 4,
      width: "100%",
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: theme.primary,
      alignItems: "center",
    },
    officialWebBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },

    // party hist section
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 6,
    },
    historyParty: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    historyDates: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: "500",
    },

    // vote section
    sectionLabelWrap: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    sectionLabelBar: {
      width: 4,
      height: 18,
      borderRadius: 2,
      marginRight: 8,
    },
    sectionLabelText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
