import { clearBillCache, getBillCache } from "@/app/bill/billDataCache";
import NavReturn from "@/app/components/NavReturn";
import { retrieveUserSession } from "@/app/encrypted-storage/functions";
import { authRequest } from "@/app/hooks/authRequest";
import { ThemeContext } from "@/app/theme/themeContext";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BILL_QUERY_BASE_URL = "https://www.usquery.com";

const HOUSE_THRESHOLD = 218;
const SENATE_THRESHOLD = 51;
const PLUS_DAILY = 10;

const COLOR_GREEN = "#2ea87e";
const COLOR_ORANGE = "#e8833a";
const COLOR_AMBER = "#d29922";
const COLOR_RED = "#f85149";
const COLOR_BLUE = "#388bfd";
const COLOR_PURPLE = "#a371f7";
const PARTY_COLORS: Record<string, string> = { D: COLOR_BLUE, R: COLOR_RED, I: COLOR_PURPLE };

const EMPTY_MEMBERS: MemberEntry[] = [];

function probColor(p: number): string {
  const clamped = Math.max(0, Math.min(1, p));
  const r = Math.round(0xe8 + (0x2e - 0xe8) * clamped);
  const g = Math.round(0x83 + (0xa8 - 0x83) * clamped);
  const b = Math.round(0x3a + (0x7e - 0x3a) * clamped);
  return `rgb(${r},${g},${b})`;
}

interface DistEntry { vote: number; count: number }
interface DistStats {
  total: number; passProb: number; median: number;
  p5: number; p95: number; min: number; max: number;
  maxCount: number; entries: DistEntry[];
}

function computeStats(dist: Record<string, number>, threshold: number): DistStats {
  const entries: DistEntry[] = Object.entries(dist)
    .map(([k, v]) => ({ vote: parseInt(k, 10), count: v }))
    .sort((a, b) => a.vote - b.vote);
  const total = entries.reduce((s, e) => s + e.count, 0);
  const passing = entries.reduce((s, e) => e.vote >= threshold ? s + e.count : s, 0);
  const percentile = (p: number) => {
    const target = total * p; let cum = 0;
    for (const e of entries) { cum += e.count; if (cum >= target) return e.vote; }
    return entries[entries.length - 1]?.vote ?? 0;
  };
  return {
    total, passProb: total > 0 ? passing / total : 0,
    median: percentile(0.5), p5: percentile(0.05), p95: percentile(0.95),
    min: entries[0]?.vote ?? 0, max: entries[entries.length - 1]?.vote ?? 0,
    maxCount: Math.max(...entries.map(e => e.count), 1),
    entries,
  };
}

interface MemberEntry { name: string; party: string; state: string; district: number | null; prob: number }
interface PredData {
  house_dist: Record<string, number>;
  senate_dist: Record<string, number>;
  credits_remaining: number | null;
  generated_at?: string | null;
}
interface MembersData { members_house: MemberEntry[]; members_senate: MemberEntry[]; credits_remaining: number | null }

interface Props { navigation: any; route: any }

export default function VotePredictionsScreen({ navigation, route }: Props) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const styles = useMemo(() => createStyles(theme, isLandscape), [theme, isLandscape]);

  const { bill_id, bill_passed } = route.params as { bill_id: string; bill_passed: boolean };

  const isCurrentCongress = useMemo(() => {
    const billCongress = parseInt(String(bill_id).slice(0, 3), 10);
    const year = new Date().getFullYear();
    const currentCongress = Math.floor((year - 1789) / 2) + 1;
    return !isNaN(billCongress) && billCongress === currentCongress;
  }, [bill_id]);

  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [budget, setBudget] = useState(PLUS_DAILY);
  const [budgetLimit, setBudgetLimit] = useState(PLUS_DAILY);
  const [phase, setPhase] = useState<"empty" | "generating" | "ready">("empty");
  const [predData, setPredData] = useState<PredData | null>(null);
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [memberPhase, setMemberPhase] = useState<"locked" | "revealing" | "unlocked">("locked");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<{ reason: string; detail: string } | null>(null);
  const [activeChamber, setActiveChamber] = useState<"house" | "senate">("house");
  const [memberSearch, setMemberSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState<"all" | "D" | "R">("all");

  const toggleAnim = useRef(new Animated.Value(0)).current;

  const loadScreen = useCallback(async () => {
    setLoading(true);

    const cached = getBillCache(bill_id);
    if (cached) {
      setIsLoggedIn(cached.isLoggedIn);
      setTier(cached.tier);

      if (cached.predUsage) {
        setBudget(cached.predUsage.val);
        setBudgetLimit(cached.predUsage.limit);
      }

      if (cached.predDist.exists && cached.predDist.house_dist && cached.predDist.senate_dist) {
        setPredData({
          house_dist: cached.predDist.house_dist,
          senate_dist: cached.predDist.senate_dist,
          credits_remaining: cached.predDist.credits_remaining,
          generated_at: cached.predDist.generated_at ?? null,
        });
        if (cached.predDist.credits_remaining != null) setBudget(cached.predDist.credits_remaining);
        setPhase("ready");
        setLoading(false);

        if (cached.isLoggedIn) {
          authRequest(
            `/bill-query/prediction/members/${bill_id}/?generate=false`,
            { method: "POST" },
            { baseUrl: BILL_QUERY_BASE_URL }
          )
            .then(memberData => {
              if (memberData?.members_house && (cached.predDist.member_reveal_unlocked || cached.tier >= 2)) {
                setMembersData(memberData);
                if (memberData.credits_remaining != null) setBudget(memberData.credits_remaining);
                setMemberPhase("unlocked");
              }
            })
            .catch(() => {});
        }
        return;
      }

      setPhase("empty");
      setLoading(false);
      return;
    }

    try {
      const session = await retrieveUserSession();
      const isAuthenticated = !!session?.accessToken;
      setIsLoggedIn(isAuthenticated);

      const [statusResult, predResult, usageResult] = await Promise.allSettled([
        isAuthenticated ? authRequest("subscription/status/") : Promise.resolve(null),
        authRequest(`/bill-query/prediction/generate/${bill_id}/?generate=false`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL }),
        isAuthenticated ? authRequest("/bill-query/prediction/usage/", {}, { baseUrl: BILL_QUERY_BASE_URL }) : Promise.resolve(null),
      ]);

      let tierVal = 0;
      if (statusResult.status === "fulfilled" && statusResult.value) {
        tierVal = statusResult.value.tier ?? 0;
        setTier(tierVal);
      }

      if (usageResult.status === "fulfilled" && usageResult.value?.display === "count" && usageResult.value?.val != null) {
        setBudget(usageResult.value.val);
        if (usageResult.value.limit != null) setBudgetLimit(usageResult.value.limit);
      }

      if (predResult.status === "fulfilled" && predResult.value?.exists && predResult.value?.house_dist && predResult.value?.senate_dist) {
        const data = predResult.value;
        setPredData({
          house_dist: data.house_dist,
          senate_dist: data.senate_dist,
          credits_remaining: data.credits_remaining ?? null,
          generated_at: data.generated_at ?? null,
        });
        if (data.credits_remaining != null) setBudget(data.credits_remaining);
        setPhase("ready");
        setLoading(false);

        if (isAuthenticated) {
          authRequest(`/bill-query/prediction/members/${bill_id}/?generate=false`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL })
            .then(memberData => {
              if (memberData?.members_house && (data.member_reveal_unlocked || tierVal >= 2)) {
                setMembersData(memberData);
                if (memberData.credits_remaining != null) setBudget(memberData.credits_remaining);
                setMemberPhase("unlocked");
              }
            })
            .catch(() => {});
        }
        return;
      }
    } catch {
      setIsLoggedIn(false); setTier(0);
    } finally {
      setLoading(false);
    }
  }, [bill_id]);

  useEffect(() => { loadScreen(); }, [loadScreen]);

  const handleGenerate = useCallback(async () => {
    setErrorMsg(null);
    setUnavailable(null);
    setPhase("generating");
    try {
      const data = await authRequest(`/bill-query/prediction/generate/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (data?.error) {
        const errCode = data.error;
        if (errCode === "authentication_required") { navigation.navigate("Login"); return; }
        else if (errCode === "prediction_unavailable") {
          setUnavailable({
            reason: data.reason ?? "",
            detail: data.detail ?? "A prediction cannot be made for this bill right now. Please try again later.",
          });
        }
        else if (errCode === "upgrade_required") setErrorMsg("Upgrade your plan to generate predictions.");
        else if (errCode === "bill_passed") setErrorMsg("Predictions unavailable — this bill has already passed.");
        else if (errCode === "not_eligible") setErrorMsg("Predictions are only available for the current Congress.");
        else if (errCode === "daily_limit") setErrorMsg("You've used all your prediction credits for today.");
        else setErrorMsg("Something went wrong. Please try again.");
        setPhase("empty"); return;
      }
      clearBillCache(bill_id);
      setPredData({
        house_dist: data.house_dist,
        senate_dist: data.senate_dist,
        credits_remaining: data.credits_remaining,
        generated_at: data.generated_at ?? null,
      });
      if (data.credits_remaining !== null) setBudget(data.credits_remaining);

      const memData = await authRequest(`/bill-query/prediction/members/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (memData?.members_house) {
        setMembersData(memData);
        setMemberPhase("unlocked");
      } else {
        setMemberPhase("locked");
      }
      setPhase("ready");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again."); setPhase("empty");
    }
  }, [bill_id, navigation]);

  const handleReveal = useCallback(async () => {
    if (budget <= 0) return;
    setMemberPhase("revealing");
    try {
      const data = await authRequest(`/bill-query/prediction/members/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (data?.members_house) {
        setMembersData(data);
        if (data.credits_remaining !== null) setBudget(data.credits_remaining);
        setMemberPhase("unlocked");
      } else if (data?.error === "daily_limit") {
        setBudget(0); setMemberPhase("locked");
      } else {
        setMemberPhase("locked");
      }
    } catch {
      setMemberPhase("locked");
    }
  }, [bill_id, budget]);

  const switchChamber = useCallback((next: "house" | "senate") => {
    Animated.timing(toggleAnim, {
      toValue: next === "senate" ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
    setActiveChamber(next);
    setMemberSearch(""); setPartyFilter("all");
  }, [toggleAnim]);

  const houseStats = useMemo(
    () => computeStats(predData?.house_dist ?? {}, HOUSE_THRESHOLD),
    [predData]
  );
  const senateStats = useMemo(
    () => computeStats(predData?.senate_dist ?? {}, SENATE_THRESHOLD),
    [predData]
  );

  const houseMembers = useMemo(() => membersData?.members_house ?? [], [membersData]);
  const senateMembers = useMemo(() => membersData?.members_senate ?? [], [membersData]);

  const filteredHouseMembers = useMemo(() =>
    houseMembers.filter(m =>
      (partyFilter === "all" || m.party === partyFilter) &&
      (memberSearch === "" || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.state.toLowerCase().includes(memberSearch.toLowerCase()))
    ), [houseMembers, partyFilter, memberSearch]);

  const filteredSenateMembers = useMemo(() =>
    senateMembers.filter(m =>
      (partyFilter === "all" || m.party === partyFilter) &&
      (memberSearch === "" || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.state.toLowerCase().includes(memberSearch.toLowerCase()))
    ), [senateMembers, partyFilter, memberSearch]);

  const activeFilteredMembers = useMemo(
    () => activeChamber === "house" ? filteredHouseMembers : filteredSenateMembers,
    [activeChamber, filteredHouseMembers, filteredSenateMembers]
  );
  const activeMemberCount = activeChamber === "house" ? houseMembers.length : senateMembers.length;

  const renderMemberItem = useCallback(
    ({ item, index }: { item: MemberEntry; index: number }) => (
      <MemberRow member={item} rank={index + 1} theme={theme} styles={styles} />
    ),
    [theme, styles]
  );

  const keyExtractor = useCallback(
    (item: MemberEntry, index: number) => `${item.name}-${index}`,
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={() => navigation.goBack()} />
      <FlatList
        data={phase === "ready" && memberPhase === "unlocked" ? activeFilteredMembers : EMPTY_MEMBERS}
        renderItem={renderMemberItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <PageHeader
            theme={theme} styles={styles}
            bill_id={bill_id} bill_passed={bill_passed}
            errorMsg={errorMsg}
            unavailable={unavailable}
            phase={phase}
            activeChamber={activeChamber}
            toggleAnim={toggleAnim}
            onSwitchChamber={switchChamber}
            houseStats={houseStats} senateStats={senateStats}
            predData={predData}
            memberPhase={memberPhase}
            activeMemberCount={activeMemberCount}
            filteredMemberCount={activeFilteredMembers.length}
            memberSearch={memberSearch} setMemberSearch={setMemberSearch}
            partyFilter={partyFilter} setPartyFilter={setPartyFilter}
            tier={tier} isLoggedIn={isLoggedIn} budget={budget} budgetLimit={budgetLimit}
            isCurrentCongress={isCurrentCongress} onGenerate={handleGenerate}
            navigation={navigation}
          />
        }
        ListFooterComponent={
          phase === "ready" && memberPhase !== "unlocked" ? (
            <LockedMembers
              tier={tier} budget={budget} budgetLimit={budgetLimit} memberPhase={memberPhase}
              onReveal={handleReveal} navigation={navigation} theme={theme} styles={styles}
            />
          ) : (
            <View style={styles.listFooter} />
          )
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
const PageHeader = React.memo(function PageHeader({
  theme, styles,
  bill_id, bill_passed,
  errorMsg,
  unavailable,
  phase,
  activeChamber, toggleAnim, onSwitchChamber,
  houseStats, senateStats,
  predData,
  memberPhase,
  activeMemberCount, filteredMemberCount,
  memberSearch, setMemberSearch,
  partyFilter, setPartyFilter,
  tier, isLoggedIn, budget, budgetLimit,
  isCurrentCongress, onGenerate,
  navigation,
}: any) {
  const stats = activeChamber === "house" ? houseStats : senateStats;
  const threshold = activeChamber === "house" ? HOUSE_THRESHOLD : SENATE_THRESHOLD;
  const chamberLabel = activeChamber === "house" ? "House of Representatives" : "Senate";
  const partyOpts: [string, string][] = [["all", "All"], ["D", "Dem"], ["R", "Rep"]];

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Vote Predictions</Text>
            <View style={styles.betaBadge}><Text style={styles.betaText}>Beta</Text></View>
          </View>
          <Text style={styles.billId}>Bill {bill_id}</Text>
        </View>
      </View>

      {bill_passed && (
        <View style={styles.noticeBanner}>
          <Ionicons name="checkmark-circle-outline" size={16} color={COLOR_AMBER} style={{ marginRight: 8 }} />
          <Text style={styles.noticeTextAmber}>This bill has already passed. Predictions may not be available.</Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={COLOR_ORANGE} style={{ marginRight: 8 }} />
          <Text style={styles.noticeTextOrange}>{errorMsg}</Text>
        </View>
      )}

      {unavailable && <UnavailableNotice unavailable={unavailable} theme={theme} styles={styles} />}

      {phase === "empty" && (
        <EmptyState
          tier={tier} isLoggedIn={isLoggedIn} budget={budget} budgetLimit={budgetLimit}
          billPassed={bill_passed} isCurrentCongress={isCurrentCongress}
          onGenerate={onGenerate} navigation={navigation} theme={theme} styles={styles}
        />
      )}
      {phase === "generating" && <GeneratingState theme={theme} styles={styles} />}

      {phase === "ready" && (
        <>
          <ChamberToggle activeChamber={activeChamber} toggleAnim={toggleAnim} onSwitch={onSwitchChamber} theme={theme} styles={styles} />
          <PassageSummary stats={stats} threshold={threshold} predData={predData} theme={theme} styles={styles} />

          <View style={{ display: (activeChamber === "house" ? "flex" : "none") as "flex" | "none" }}>
            <HistogramView entries={houseStats.entries} threshold={HOUSE_THRESHOLD} stats={houseStats} activeChamber="house" theme={theme} styles={styles} />
          </View>
          <View style={{ display: (activeChamber === "senate" ? "flex" : "none") as "flex" | "none" }}>
            <HistogramView entries={senateStats.entries} threshold={SENATE_THRESHOLD} stats={senateStats} activeChamber="senate" theme={theme} styles={styles} />
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Per-Member Predictions</Text>
            {tier >= 2 && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeTextPurple}>Premium · Unlimited</Text>
              </View>
            )}
          </View>

          {memberPhase === "unlocked" && (
            <Text style={styles.memberSortLabel}>Sorted by P(votes Yes), high → low</Text>
          )}
          <Text style={styles.chamberSubLabel}>{chamberLabel}</Text>

          {memberPhase === "unlocked" && (
            <View style={[styles.card, styles.controlsCardPad]}>
              <TextInput
                style={styles.memberSearch}
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Search name or state…"
                placeholderTextColor={theme.subtext}
              />
              <View style={styles.partyFilterRow}>
                {partyOpts.map(([k, l]) => {
                  const isOn = partyFilter === k;
                  const c = k === "D" ? COLOR_BLUE : k === "R" ? COLOR_RED : theme.subtext;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setPartyFilter(k)}
                      style={[
                        styles.partyChip,
                        { backgroundColor: isOn ? c + "22" : "transparent", borderColor: isOn ? c + "77" : theme.border },
                      ]}
                    >
                      <Text style={[styles.partyChipText, { color: isOn ? c : theme.subtext }]}>{l}</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.memberCountLabel}>{filteredMemberCount} members</Text>
              </View>
              <View style={styles.colHeaderRow}>
                <Text style={[styles.colHeader, styles.colHeaderRank]}>#</Text>
                <Text style={[styles.colHeader, styles.colHeaderFlex]}>Member</Text>
                <Text style={styles.colHeader}>P(Votes Yes)</Text>
              </View>
            </View>
          )}

          {memberPhase === "unlocked" && filteredMemberCount === 0 && (
            <Text style={styles.noResultsText}>No members match.</Text>
          )}
        </>
      )}
    </>
  );
});

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ tier, isLoggedIn, budget, budgetLimit, billPassed, isCurrentCongress, onGenerate, navigation, theme, styles }: any) {
  const noCredits = tier === 1 && budget <= 0;
  const disabled = noCredits || billPassed || !isCurrentCongress;

  if (!isCurrentCongress) {
    return (
      <View style={styles.card}>
        <EmptyLead theme={theme} styles={styles} />
        <View style={styles.amberNotice}>
          <Ionicons name="time-outline" size={14} color={COLOR_AMBER} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.amberNoticeText}>Predictions are only available for the current Congress.</Text>
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.card}>
        <EmptyLead theme={theme} styles={styles} />
        <Pressable style={[styles.btnPrimary, styles.btnSpaceBelow]} onPress={() => navigation.navigate("Login")}>
          <Ionicons name="lock-closed-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.btnPrimaryText}>Log in to generate a prediction</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.btnGhostText}>Create an account</Text>
        </Pressable>
      </View>
    );
  }

  if (tier === 0) {
    return (
      <View style={styles.card}>
        <EmptyLead theme={theme} styles={styles} />
        <View style={styles.amberNotice}>
          <Ionicons name="lock-closed" size={14} color={COLOR_AMBER} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.amberNoticeText}>
            <Text style={styles.amberNoticeHighlight}>Vote predictions are a Plus & Premium feature. </Text>
            Upgrade your plan to generate AI floor-vote forecasts.
          </Text>
        </View>
        <Pressable style={[styles.btnPrimary, styles.btnSpaceBelow]} onPress={() => navigation.navigate("Plans")}>
          <Text style={styles.btnPrimaryText}>Upgrade to Plus</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("Plans")}>
          <Text style={styles.btnGhostText}>Compare plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <EmptyLead theme={theme} styles={styles} />
      <Pressable
        style={[styles.btnPrimary, disabled && styles.btnDisabled]}
        onPress={disabled ? undefined : onGenerate}
      >
        <Ionicons name="flash-outline" size={15} color={disabled ? "#888" : "#fff"} style={{ marginRight: 6 }} />
        <Text style={[styles.btnPrimaryText, disabled && styles.btnPrimaryTextDisabled]}>Request a prediction</Text>
      </Pressable>
      {tier === 1 ? (
        <CreditMeter budget={budget} budgetLimit={budgetLimit} theme={theme} styles={styles} />
      ) : (
        <View style={styles.premiumRow}>
          <View style={styles.premiumBadge}><Text style={styles.premiumBadgeTextPurple}>Premium</Text></View>
          <Text style={styles.premiumDesc}>Unlimited predictions & full access.</Text>
        </View>
      )}
    </View>
  );
}

// ── Prediction Unavailable Notice ─────────────────────────────────────────────
const UNAVAILABLE_META: Record<string, { title: string; icon: string }> = {
  missing_text: { title: "Bill Text Not Yet Available", icon: "document-text-outline" },
  missing_subjects: { title: "Bill Subjects Not Yet Available", icon: "pricetags-outline" },
  missing_text_and_subjects: { title: "Bill Data Not Yet Available", icon: "hourglass-outline" },
};

function UnavailableNotice({ unavailable, theme, styles }: any) {
  const meta = UNAVAILABLE_META[unavailable.reason] ?? { title: "Prediction Unavailable", icon: "alert-circle-outline" };
  return (
    <View style={[styles.card, styles.unavailableCard]}>
      <View style={styles.unavailableIconCircle}>
        <Ionicons name={meta.icon as any} size={20} color={COLOR_AMBER} />
      </View>
      <Text style={styles.unavailableTitle}>{meta.title}</Text>
      <Text style={styles.unavailableDetail}>{unavailable.detail}</Text>
      <Text style={styles.unavailableNote}>
        Check back later — this data is added as Congress publishes it.
      </Text>
    </View>
  );
}

function EmptyLead({ theme, styles }: any) {
  return (
    <View style={styles.emptyLeadContainer}>
      <Ionicons name="flash-outline" size={28} color="#7d8590" />
      <Text style={styles.emptyLeadTitle}>AI Vote Prediction</Text>
      <Text style={styles.emptyLeadBody}>
        Monte-Carlo simulation forecasting the bill's likelihood of passage and how each member is expected to vote.
      </Text>
    </View>
  );
}

function CreditMeter({ budget, budgetLimit, theme, styles }: any) {
  const used = budgetLimit - budget;
  const fill = budget <= 0 ? COLOR_RED : budget <= 3 ? COLOR_AMBER : COLOR_GREEN;
  return (
    <View style={styles.creditMeterContainer}>
      <View style={styles.creditMeterHeaderRow}>
        <Text style={styles.creditMeterLabel}>Daily Prediction Credits</Text>
        <Text style={[styles.creditMeterCount, { color: fill }]}>{budget} of {budgetLimit} left</Text>
      </View>
      <View style={styles.creditMeterBarRow}>
        {Array.from({ length: budgetLimit }).map((_, i) => (
          <View key={i} style={[styles.creditMeterSegment, { backgroundColor: i < used ? theme.secondary : fill }]} />
        ))}
      </View>
      <Text style={styles.creditMeterNote}>
        {budget <= 0 ? "Daily limit reached — resets at midnight ET." : "Generating a prediction uses 1 credit."}
      </Text>
    </View>
  );
}

// ── Generating State ──────────────────────────────────────────────────────────
function GeneratingState({ theme, styles }: any) {
  return (
    <View style={[styles.card, styles.generatingContainer]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.generatingTitle}>Simulating floor votes…</Text>
      <Text style={styles.generatingSubtext}>This may take a few seconds</Text>
    </View>
  );
}

// ── Chamber Toggle ────────────────────────────────────────────────────────────
const ChamberToggle = React.memo(function ChamberToggle({ activeChamber, toggleAnim, onSwitch, theme, styles }: any) {
  const thumbLeft = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "50%"] });
  return (
    <View style={styles.chamberToggleContainer}>
      <Animated.View style={[styles.chamberThumb, { left: thumbLeft }]} />
      <View style={styles.chamberSeparator} pointerEvents="none" />
      {(["house", "senate"] as const).map((ch) => (
        <Pressable key={ch} style={styles.chamberOption} onPress={() => onSwitch(ch)}>
          <Text style={[styles.chamberOptionText, activeChamber === ch && styles.chamberOptionActive]}>
            {ch === "house" ? "House" : "Senate"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

// ── Passage Summary ───────────────────────────────────────────────────────────
const PassageSummary = React.memo(function PassageSummary({ stats, threshold, predData, theme, styles }: any) {
  const { passProb, median, p5, p95 } = stats;
  const passing = passProb >= 0.5;
  const col = probColor(passProb);

  const timestampStr = predData?.generated_at
    ? (() => {
        try {
          return new Date(predData.generated_at).toLocaleString([], {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          });
        } catch { return null; }
      })()
    : null;

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsGrid}>
        {/* Column 1: passage prob + needed to pass */}
        <View style={styles.statsCol}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Passage Probability</Text>
            <Text style={[styles.statBig, { color: col }]}>{(passProb * 100).toFixed(1)}%</Text>
            <View style={[
              styles.passBadge,
              { backgroundColor: (passing ? COLOR_GREEN : COLOR_ORANGE) + "30", borderColor: (passing ? COLOR_GREEN : COLOR_ORANGE) + "66" },
            ]}>
              <Text style={[styles.passBadgeText, { color: passing ? COLOR_GREEN : COLOR_ORANGE }]}>
                {passing ? "Likely to Pass" : "Likely to Fail"}
              </Text>
            </View>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Needed to Pass</Text>
            <Text style={styles.statMonoAmber}>{threshold}</Text>
          </View>
        </View>

        {/* Column 2: median + range */}
        <View style={styles.statsCol}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Median Yes</Text>
            <Text style={styles.statMono}>{median}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>90% Range</Text>
            <Text style={styles.statMonoSubtext}>{p5}–{p95}</Text>
          </View>
        </View>
      </View>

      {timestampStr && (
        <Text style={styles.predTimestamp}>Generated {timestampStr}</Text>
      )}
    </View>
  );
});

// ── Histogram ─────────────────────────────────────────────────────────────────
const HIST_HEIGHT = 130;

const HistogramView = React.memo(function HistogramView({ entries, threshold, stats, activeChamber, theme, styles }: any) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { total, maxCount } = stats;
  const chamberLabel = activeChamber === "house" ? "Predicted House Floor Vote · Yes Count" : "Predicted Senate Floor Vote · Yes Count";

  return (
    <View style={[styles.card, styles.histCardPad]}>
      <View style={styles.histHeaderRow}>
        <Text style={styles.histLabel}>{chamberLabel}</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLOR_GREEN }]} />
            <Text style={styles.legendText}>Passes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLOR_ORANGE }]} />
            <Text style={styles.legendText}>Fails</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.histBarsContainer, { minWidth: Math.max(entries.length * 8, 280) }]}>
          {entries.map((bar: DistEntry) => {
            const barH = maxCount > 0 ? (bar.count / maxCount) * HIST_HEIGHT : 2;
            const isPass = bar.vote >= threshold;
            const isActive = hovered === bar.vote;
            const barColor = isPass ? COLOR_GREEN : COLOR_ORANGE;
            return (
              <Pressable
                key={bar.vote}
                onPressIn={() => setHovered(bar.vote)}
                onPressOut={() => setHovered(null)}
                style={[styles.histBar, { height: barH, backgroundColor: isActive ? barColor : barColor + "b0" }]}
              >
                {isActive && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{bar.vote} Yes</Text>
                    <Text style={[styles.tooltipSub, { color: isPass ? COLOR_GREEN : COLOR_ORANGE }]}>
                      {total > 0 ? ((bar.count / total) * 100).toFixed(1) : 0}% of sims
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.histAxisRow}>
        <Text style={styles.histAxisLabel}>{stats.min}</Text>
        {stats.max !== stats.min && (
          <Text style={styles.histAxisLabel}>{Math.round((stats.min + stats.max) / 2)}</Text>
        )}
        <Text style={styles.histAxisLabel}>{stats.max}</Text>
      </View>
      <View style={styles.histAxisRow}>
        <Text style={[styles.histAxisLabel, { color: COLOR_AMBER }]}>← Fails</Text>
        <Text style={styles.histAxisLabel}>({threshold} to pass)</Text>
        <Text style={[styles.histAxisLabel, { color: COLOR_GREEN }]}>Passes →</Text>
      </View>
    </View>
  );
});

// ── Member Row ────────────────────────────────────────────────────────────────
const MemberRow = React.memo(function MemberRow({ member, rank, theme, styles }: { member: MemberEntry; rank: number; theme: any; styles: any }) {
  const col = probColor(member.prob);
  const partyColor = PARTY_COLORS[member.party] ?? theme.subtext;
  const seat = member.district != null ? `${member.party} · ${member.state}-${member.district}` : `${member.party} · ${member.state}`;

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberMainRow}>
        <Text style={styles.memberRank}>{rank}</Text>
        <Text style={[styles.memberName, styles.memberNameFlex]} numberOfLines={1}>{member.name}</Text>
        <Text style={[styles.memberProb, { color: col }]}>{Math.round(member.prob * 100)}%</Text>
      </View>
      <View style={styles.memberSubRow}>
        <Text style={[styles.memberSeat, { color: partyColor }]}>{seat}</Text>
        <View style={styles.memberProbBar}>
          <View style={[styles.memberProbFill, { width: `${member.prob * 100}%`, backgroundColor: col }]} />
        </View>
      </View>
    </View>
  );
});

// ── Locked Members ────────────────────────────────────────────────────────────
const PLACEHOLDER_MEMBERS = Array.from({ length: 5 }, (_, i) => ({
  name: "Representative Name", party: "D", state: "NY", district: i + 1, prob: 0.5,
}));

function LockedMembers({ tier, budget, budgetLimit, memberPhase, onReveal, navigation, theme, styles }: any) {
  const isRevealing = memberPhase === "revealing";
  const noCredits = tier === 1 && budget <= 0;
  const lockColor = tier === 1 ? COLOR_BLUE : COLOR_AMBER;

  return (
    <View>
      <View style={styles.lockedPlaceholder}>
        {PLACEHOLDER_MEMBERS.map((m, i) => (
          <MemberRow key={i} member={m as MemberEntry} rank={i + 1} theme={theme} styles={styles} />
        ))}
      </View>

      <View style={[styles.lockOverlay, { backgroundColor: theme.background + "ee" }]}>
        <View style={[styles.lockIconCircle, { borderColor: lockColor + "55" }]}>
          <Ionicons name="lock-closed" size={20} color={lockColor} />
        </View>
        <Text style={styles.lockTitle}>Per-Member Predictions</Text>

        {tier >= 2 ? null : tier === 1 ? (
          <>
            <Text style={styles.lockBody}>See each legislator's probability of voting Yes.</Text>
            <Pressable
              style={[styles.btnPrimary, styles.btnReveal, (noCredits || isRevealing) && styles.btnDisabled]}
              onPress={noCredits || isRevealing ? undefined : onReveal}
            >
              {isRevealing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnPrimaryText}>Loading members…</Text>
                </>
              ) : (
                <Text style={styles.btnPrimaryText}>Reveal per-member predictions · 1 credit</Text>
              )}
            </Pressable>
            <Text style={[styles.lockNote, { color: noCredits ? COLOR_RED : theme.subtext }]}>
              {noCredits ? "Daily limit reached — resets at midnight ET." : `${budget} of ${budgetLimit} credits left today`}
            </Text>
            <Text style={styles.lockNote}>
              Once revealed, accessible for 24 hours without additional credits.
            </Text>
          </>
        ) : tier === 0 ? (
          <>
            <Text style={styles.lockBody}>
              <Text style={styles.lockBodyHighlight}>Available on Plus & Premium. </Text>
              See exactly how likely each member is to vote Yes.
            </Text>
            <Pressable style={[styles.btnPrimary, styles.btnReveal]} onPress={() => navigation.navigate("Plans")}>
              <Text style={styles.btnPrimaryText}>Upgrade to Plus</Text>
            </Pressable>
            <Pressable style={[styles.btnGhost, styles.btnRevealGhost]} onPress={() => navigation.navigate("Plans")}>
              <Text style={styles.btnGhostText}>Compare plans</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.lockBody}>Log in with a Plus or Premium plan to see each member's probability of voting Yes.</Text>
            <Pressable style={[styles.btnPrimary, styles.btnReveal]} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.btnPrimaryText}>Log in</Text>
            </Pressable>
            <Pressable style={[styles.btnGhost, styles.btnRevealGhost]} onPress={() => navigation.navigate("Plans")}>
              <Text style={styles.btnGhostText}>See plans</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (theme: any, isLandscape = false) =>
  StyleSheet.create({
    // ── Layout
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: isLandscape ? "18%" : "6%",
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    // Widen the list and pad its content back by the same amount so card
    // side-shadows aren't clipped at the scroll view's edges.
    list: {
      marginHorizontal: -12,
    },
    scrollContent: {
      paddingBottom: 20,
      paddingHorizontal: 12,
    },
    listFooter: {
      height: 40,
    },

    // ── Base card (shared by header, empty state, histogram, member controls)
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    controlsCardPad: {
      padding: 12,
      marginBottom: 2,
    },
    histCardPad: {
      padding: 14,
      marginBottom: 14,
    },

    // ── Header card internals
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.titleText,
      letterSpacing: 0.3,
    },
    betaBadge: {
      backgroundColor: COLOR_AMBER,
      borderRadius: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    betaText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#0d1117",
    },
    billId: {
      fontSize: 11,
      fontWeight: "400",
      color: theme.subtext,
    },

    // ── Banners
    noticeBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: COLOR_AMBER + "22",
      borderWidth: 1,
      borderColor: COLOR_AMBER + "66",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: COLOR_ORANGE + "22",
      borderWidth: 1,
      borderColor: COLOR_ORANGE + "44",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    noticeTextAmber: {
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 18,
      color: COLOR_AMBER,
      flex: 1,
    },
    noticeTextOrange: {
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 18,
      color: COLOR_ORANGE,
      flex: 1,
    },

    // ── Prediction unavailable notice
    unavailableCard: {
      alignItems: "center",
      borderColor: COLOR_AMBER + "44",
      paddingVertical: 22,
    },
    unavailableIconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: COLOR_AMBER + "55",
      backgroundColor: COLOR_AMBER + "1c",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    unavailableTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.titleText,
      marginBottom: 8,
      textAlign: "center",
    },
    unavailableDetail: {
      fontSize: 12.5,
      fontWeight: "400",
      color: theme.subtext,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 280,
    },
    unavailableNote: {
      fontSize: 10.5,
      fontWeight: "400",
      color: COLOR_AMBER,
      marginTop: 10,
      textAlign: "center",
      lineHeight: 16,
    },

    // ── Empty state
    emptyLeadContainer: {
      alignItems: "center",
      marginBottom: 22,
    },
    emptyLeadTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.titleText,
      marginTop: 8,
      marginBottom: 6,
    },
    emptyLeadBody: {
      fontSize: 13,
      fontWeight: "400",
      color: theme.subtext,
      lineHeight: 20,
      textAlign: "center",
    },
    amberNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: COLOR_AMBER + "22",
      borderWidth: 1,
      borderColor: COLOR_AMBER + "40",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    amberNoticeText: {
      fontSize: 12.5,
      fontWeight: "400",
      color: "#e3c270",
      lineHeight: 20,
      flex: 1,
    },
    amberNoticeHighlight: {
      fontWeight: "700",
      color: "#f0d385",
    },

    // ── Credit meter
    creditMeterContainer: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    creditMeterHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    creditMeterLabel: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    creditMeterCount: {
      fontSize: 11,
      fontWeight: "600",
    },
    creditMeterBarRow: {
      flexDirection: "row",
      gap: 3,
    },
    creditMeterSegment: {
      flex: 1,
      height: 5,
      borderRadius: 99,
    },
    creditMeterNote: {
      fontSize: 10.5,
      fontWeight: "400",
      color: theme.subtext,
      marginTop: 9,
    },

    // ── Buttons
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 20,
    },
    btnPrimaryText: {
      fontSize: 14.5,
      fontWeight: "700",
      color: "#fff",
    },
    btnPrimaryTextDisabled: {
      color: theme.subtext,
    },
    btnGhost: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 20,
    },
    btnGhostText: {
      fontSize: 14.5,
      fontWeight: "600",
      color: theme.subtext,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnSpaceBelow: {
      marginBottom: 10,
    },
    btnReveal: {
      marginTop: 12,
    },
    btnRevealGhost: {
      marginTop: 8,
    },

    // ── Badges & pills
    premiumBadge: {
      borderWidth: 1,
      borderColor: COLOR_PURPLE + "44",
      backgroundColor: COLOR_PURPLE + "1c",
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    premiumBadgeTextPurple: {
      fontSize: 9.5,
      fontWeight: "600",
      color: COLOR_PURPLE,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    premiumRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 14,
    },
    premiumDesc: {
      fontSize: 12,
      fontWeight: "400",
      color: theme.subtext,
    },

    // ── Section / divider
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 20,
    },
    sectionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    memberSortLabel: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    chamberSubLabel: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // ── Generating state
    generatingContainer: {
      alignItems: "center",
      paddingVertical: 36,
    },
    generatingTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginTop: 14,
      marginBottom: 4,
    },
    generatingSubtext: {
      fontSize: 12,
      fontWeight: "400",
      color: theme.subtext,
    },

    // ── Chamber toggle
    chamberToggleContainer: {
      flexDirection: "row",
      backgroundColor: theme.secondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      marginBottom: 16,
      position: "relative",
      height: 44,
      overflow: "hidden",
    },
    chamberThumb: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "50%",
      backgroundColor: theme.primary,
      borderRadius: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      
    },
    chamberSeparator: {
      position: "absolute",
      top: 6,
      bottom: 6,
      left: "50%",
      width: 1,
      backgroundColor: theme.border,
      zIndex: 2,
      opacity: 0.5,
    },
    chamberOption: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    chamberOptionText: {
      fontSize: 13.5,
      fontWeight: "500",
      color: theme.subtext,
    },
    chamberOptionActive: {
      fontWeight: "700",
      color: "#fff",
    },

    // ── Stats grid (2-column layout)
    statsCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 8,
    },
    statsCol: {
      flex: 1,
      gap: 8,
    },
    statCell: {
      backgroundColor: theme.secondary,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flex: 1,
    },
    statLabel: {
      fontSize: 9.5,
      fontWeight: "400",
      color: theme.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    statBig: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    statMono: {
      fontSize: 20,
      fontWeight: "500",
      color: theme.text,
      fontVariant: ["tabular-nums"],
    },
    statMonoAmber: {
      fontSize: 20,
      fontWeight: "500",
      color: COLOR_AMBER,
      fontVariant: ["tabular-nums"],
    },
    statMonoSubtext: {
      fontSize: 20,
      fontWeight: "500",
      color: theme.subtext,
      fontVariant: ["tabular-nums"],
    },
    passBadge: {
      borderWidth: 1,
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: "flex-start",
      marginTop: 8,
    },
    passBadgeText: {
      fontSize: 10.5,
      fontWeight: "600",
    },
    predTimestamp: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
      marginTop: 10,
      textAlign: "right",
    },

    // ── Histogram
    histHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderRadius: 12,
      marginBottom: 10,
    },
    histLabel: {
      fontSize: 9.5,
      fontWeight: "400",
      color: theme.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      flex: 1,
    },
    legendRow: {
      flexDirection: "row",
      gap: 10,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
    },
    histBarsContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: HIST_HEIGHT,
      gap: 1,
    },
    histBar: {
      flex: 1,
      minWidth: 6,
      borderRadius: 2,
    },
    histAxisRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
      paddingHorizontal: 2,
    },
    histAxisLabel: {
      fontSize: 9,
      fontWeight: "400",
      color: theme.subtext,
    },
    tooltip: {
      position: "absolute",
      bottom: "110%",
      left: "50%",
      transform: [{ translateX: -30 }],
      backgroundColor: "#000",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 7,
      padding: 6,
      minWidth: 60,
      zIndex: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
    },
    tooltipText: {
      fontSize: 10.5,
      fontWeight: "400",
      color: theme.text,
      textAlign: "center",
    },
    tooltipSub: {
      fontSize: 9.5,
      fontWeight: "400",
      textAlign: "center",
    },

    // ── Member controls (search + filter)
    memberSearch: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.secondary,
      color: theme.text,
      fontSize: 13,
      fontWeight: "400",
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    partyFilterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    partyChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
    },
    partyChipText: {
      fontSize: 11.5,
      fontWeight: "500",
    },
    memberCountLabel: {
      fontSize: 10,
      fontWeight: "400",
      color: theme.subtext,
      marginLeft: "auto",
    },
    colHeaderRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    colHeader: {
      fontSize: 8.5,
      fontWeight: "400",
      color: theme.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    colHeaderRank: {
      width: 24,
    },
    colHeaderFlex: {
      flex: 1,
    },
    noResultsText: {
      fontSize: 13,
      fontWeight: "400",
      color: theme.subtext,
      textAlign: "center",
      padding: 24,
    },

    // ── Member rows
    memberRow: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    memberMainRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },
    memberSubRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 5,
    },
    memberRank: {
      fontSize: 11,
      fontWeight: "400",
      color: theme.subtext,
      minWidth: 20,
    },
    memberName: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },
    memberNameFlex: {
      flex: 1,
    },
    memberProb: {
      fontSize: 13.5,
      fontWeight: "500",
    },
    memberSeat: {
      fontSize: 10,
      fontWeight: "400",
      width: 70,
    },
    memberProbBar: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.secondary,
      overflow: "hidden",
    },
    memberProbFill: {
      height: "100%",
      borderRadius: 3,
    },

    // ── Lock overlay
    lockedPlaceholder: {
      opacity: 0.15,
    },
    lockOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
      borderRadius: 12,
    },
    lockIconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      backgroundColor: theme.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    lockTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.titleText,
      marginBottom: 8,
      textAlign: "center",
    },
    lockBody: {
      fontSize: 12.5,
      fontWeight: "400",
      color: theme.subtext,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 280,
    },
    lockBodyHighlight: {
      fontWeight: "700",
      color: "#f0d385",
    },
    lockNote: {
      fontSize: 10.5,
      fontWeight: "400",
      color: theme.subtext,
      marginTop: 6,
      textAlign: "center",
      lineHeight: 16,
    },
  });
