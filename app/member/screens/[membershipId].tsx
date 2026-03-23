import { UnscalableText } from "@/app/components/UnscalableText";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../../components/NavReturn";
import useGetMembership from "../../hooks/useGetMembership";
import VoteList from "../../vote/components/VoteList";
import ContactModal from "../components/ContactsModal";
import MemStarButton from "../components/MemStarButton";

interface MemberInfoProps {
  navigation?: any;
  route?: any;
}

function computeInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <View style={styles.labelContainer}>
      <View style={styles.labelBar} />
      <Text style={styles.label}>{children}</Text>
    </View>
  );
});

export default function MemberInfo({ navigation, route }: MemberInfoProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const { membershipId } = route.params;
  const { member, loading, error } = useGetMembership(membershipId);
  const fullName = useMemo(() => member?.full_name ?? 'Unknown', [member?.full_name]);
  const imageUrl = useMemo(() => member?.image_link ?? '-' , [member?.image_link]);
  const initials = useMemo(() => computeInitials(fullName), [fullName]);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const voteList = useMemo(() => member?.vote_list ?? [], [member?.vote_list]);
  const role = useMemo(() => (member?.house ? 'House' : 'Senate'), [member?.house]);
  const state = useMemo(() => member?.state, [member?.state]);
  const party = useMemo(() => member?.party, [member?.party]);
  const district = useMemo(() => member?.district_num ?? null, [member?.district_num]);
  const startDate = useMemo(() => formatDate(member?.start_date ?? 'Present'), [member?.start_date]);
  const endDate = useMemo(() => formatDate(member?.end_date ?? 'Present'), [member?.end_date]);
  const office = useMemo(() => member?.office, [member?.office]);
  const phone = useMemo(() => member?.phone, [member?.phone]);
  const official_link = useMemo(() => member?.official_link, [member?.official_link]);

  const [contactModalVisible, setContactModalVisible] = useState(false);

  const MemberCard = useMemo(() => {
    return (
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.leftColumn}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarLarge} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholderLarge}>
                <UnscalableText style={styles.avatarInitialsLarge}>{initials?.slice(0,2)}</UnscalableText>
              </View>
            )}
          </View>

          <View style={styles.middleColumn}>
            <View style={styles.nameRow}>
              <UnscalableText style={styles.title}>{fullName}</UnscalableText>
              <MemStarButton membershipId={membershipId} />
            </View>

            <View style={styles.infoRow}>
              <UnscalableText style={styles.infoLabel}>Role:</UnscalableText>
              <UnscalableText style={styles.infoValue}>{role}</UnscalableText>
            </View>

            <View style={styles.infoRow}>
              {role === 'House' && district !== null && (
                <>
                <UnscalableText style={styles.infoLabel}>District:</UnscalableText>
                <UnscalableText style={styles.infoValue}>{state}-{district}</UnscalableText>
                </>
              )}
              {role !== 'House' && district === null && (
                <>
                <UnscalableText style={styles.infoLabel}>State:</UnscalableText>
                <UnscalableText style={styles.infoValue}>{state}</UnscalableText  >
                </>
              )}
            </View>

            <View style={styles.infoRow}>
              <UnscalableText style={styles.infoLabel}>Party:</UnscalableText>
              <UnscalableText style={styles.infoValue}>{party}</UnscalableText>
            </View>

            <View style={styles.infoRow}>
              <UnscalableText style={styles.infoLabel}>Term:</UnscalableText>
              <UnscalableText style={styles.infoValue}>{startDate} - {endDate}</UnscalableText>
            </View>

            <Pressable style={styles.contactButton} onPress={() => setContactModalVisible(true)}>
              <UnscalableText style={styles.contactButtonText}>Contact</UnscalableText>
            </Pressable>

          </View>
        </View>
      </View>
    );
  }, [imageUrl, initials, fullName, membershipId, role, district, state, party, startDate, endDate, theme]
);

  const handleOpenLink = useCallback((url?: string) => {
    if (!url) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(normalized).catch(() => {});
  }, []);

  
  const HeaderElement = useMemo(() => (
    <>
      {MemberCard}
      <ContactModal
        contactModalVisible={contactModalVisible}
        setContactModalVisible={setContactModalVisible}
        handleOpenLink={handleOpenLink}
          office={office}
          phone={phone}
          official_link={official_link}
      />
      <SectionLabel>Recent Votes</SectionLabel>
    </>),
    [MemberCard, contactModalVisible, handleOpenLink, office, phone, official_link]
  );

  if (loading) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[styles.container, styles.centerOverlay]} edges={["top"]}>
      <Text>Error loading member: {error.message}</Text>
    </SafeAreaView>
  );

  function formatDate(value: string | null | undefined) {
    if (!value) return '-';
    if (value === 'Present') return 'Present';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString();
    } catch {
      return value;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={goBack} />
      <VoteList data={voteList} personal={true} navigation={navigation} header={HeaderElement}/>
      { /* add party history section */}
      { /* add external terms */}
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
  centerOverlay: {
    justifyContent: 'center', 
    alignItems: 'center' 
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
  headerRow: { 
    flexDirection: 'row',
    alignItems: 'flex-start', 
  },
  label: {
    fontSize: 13,
    color: theme.text,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  labelBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginRight: 8,
  },
  leftColumn: {
    width: 120, 
    marginRight: 12 
  },
  rightColumn: {
    width: 20 
  },
  middleColumn: {
    flex: 1 
  },
  avatarLarge: {
    width: '100%', 
    height: 140, 
    borderRadius: 12, 
    backgroundColor: theme.card 
  },
  avatarPlaceholderLarge: { 
    width: '100%', 
    height: 140, 
    borderRadius: 12, 
    backgroundColor: theme.secondary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarInitialsLarge: { 
    color: theme.text, 
    fontWeight: '700', 
    fontSize: 28 
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: theme.text, 
    marginBottom: 8 
  },
  nameRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginRight: 10 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4 
  },
  infoLabel: { 
    fontSize: 13, 
    color: theme.text, 
    width: 40, 
    fontWeight: '600' 
  },
  infoValue: { 
    fontSize: 13, 
    color: theme.text, 
    flex: 1 
  },
  contactButton: { 
    marginTop: 10, 
    backgroundColor: theme.primary, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    alignSelf: 'flex-start' 
  },
  contactButtonText: { 
    color: theme.innerText, 
    fontWeight: '700' 
  },
});