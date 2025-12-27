import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavReturn from "../../components/NavReturn";
import useGetMembership from "../../hooks/useGetMembership";
import VoteList from "../../vote/components/VoteList";
import ContactsModal from "../components/ContactsModal";

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

const SectionLabel: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
    <View style={styles.labelContainer}>
        <View style={styles.labelBar} />
        <Text style={styles.label}>{children}</Text>
    </View>
));

export default function MemberInfo({ navigation, route }: MemberInfoProps) {
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

  const handleOpenLink = useCallback((url?: string) => {
    if (!url) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(normalized).catch(() => {});
  }, []);

  

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

  const headerElement = (
    <View style={styles.headerCard}>
      <View style={styles.headerRow}>
        <View style={styles.leftColumn}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarLarge} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholderLarge}>
              <Text style={styles.avatarInitialsLarge}>{initials?.slice(0,2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.title}>{fullName}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{role}</Text>
          </View>

          <View style={styles.infoRow}>
            {role === 'House' && district !== null && (
              <>
              <Text style={styles.infoLabel}>District:</Text>
              <Text style={styles.infoValue}>{state}-{district}</Text>
              </>
            )}
            {role !== 'House' && district === null && (
              <>
              <Text style={styles.infoLabel}>State:</Text>
              <Text style={styles.infoValue}>{state}</Text>
              </>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Term:</Text>
            <Text style={styles.infoValue}>{startDate} - {endDate}</Text>
          </View>

          <Pressable style={styles.contactButton} onPress={() => setContactModalVisible(true)}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </Pressable>

        </View>
      </View>
    </View>
  );



  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <NavReturn onPress={goBack} />
        {headerElement}
        <ContactsModal
          contactModalVisible={contactModalVisible}
          setContactModalVisible={setContactModalVisible}
          handleOpenLink={handleOpenLink}
          office={office}
          phone={phone}
          official_link={official_link}
        />
        <SectionLabel>Recent Votes</SectionLabel>
        <VoteList data={voteList} personal={true} navigation={navigation} />
        { /* add party history section */}
        { /* add external terms */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    marginBottom: 200,
  },
  centerOverlay: {
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { 
    flexDirection: 'row',
    alignItems: 'center' 
  },
  label: {
        fontSize: 13,
        color: "#0f172a",
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
        backgroundColor: "#0EA5A9",
        marginRight: 8,
    },
  leftColumn: { width: 120, marginRight: 12 },
  rightColumn: { flex: 1 },
  avatarLarge: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#F3F4F6' },
  avatarPlaceholderLarge: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  avatarInitialsLarge: { color: '#374151', fontWeight: '700', fontSize: 28 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoLabel: { fontSize: 13, color: '#6B7280', width: 80, fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#111827', flex: 1 },
  contactButton: { marginTop: 10, backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  contactButtonText: { color: '#fff', fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 6,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    color: '#111827',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarWrap: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  text: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  listWrap: { paddingTop: 6, paddingBottom: 40, backgroundColor: '#f8fafc' },
});