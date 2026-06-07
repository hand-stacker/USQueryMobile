import NavReturn from "@/app/components/NavReturn";
import { retrieveUserSession } from "@/app/encrypted-storage/functions";
import { authRequest } from "@/app/hooks/authRequest";

const BILL_QUERY_BASE_URL = "https://www.usquery.com";
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

const HOUSE_THRESHOLD = 218;
const SENATE_THRESHOLD = 51;
const PLUS_DAILY = 10;

// Amber/green/orange prediction colors (not theme-dependent)
const COLOR_GREEN = "#2ea87e";
const COLOR_ORANGE = "#e8833a";
const COLOR_AMBER = "#d29922";
const COLOR_RED = "#f85149";
const COLOR_BLUE = "#388bfd";
const COLOR_PURPLE = "#a371f7";
const PARTY_COLORS: Record<string, string> = { D: COLOR_BLUE, R: COLOR_RED, I: COLOR_PURPLE };

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
interface PredData { house_dist: Record<string, number>; senate_dist: Record<string, number>; credits_remaining: number | null }
interface MembersData { members_house: MemberEntry[]; members_senate: MemberEntry[]; credits_remaining: number | null }


interface Props { navigation: any; route: any }

export default function VotePredictionsScreen({ navigation, route }: Props) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const styles = useMemo(() => createStyles(theme, isLandscape), [theme, isLandscape]);

  const { bill_id, bill_passed } = route.params as { bill_id: string; bill_passed: boolean };

  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [budget, setBudget] = useState(PLUS_DAILY);
  const [phase, setPhase] = useState<"empty" | "generating" | "ready">("empty");
  const [predData, setPredData] = useState<PredData | null>(null);
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [memberPhase, setMemberPhase] = useState<"locked" | "revealing" | "unlocked">("locked");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChamber, setActiveChamber] = useState<"house" | "senate">("house");
  const [memberSearch, setMemberSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState<"all" | "D" | "R">("all");

  const toggleAnim = useRef(new Animated.Value(0)).current;

  const loadScreen = useCallback(async () => {
    setLoading(true);
    try {
      const session = await retrieveUserSession();
      const isAuthenticated = !!session?.accessToken;
      setIsLoggedIn(isAuthenticated);

      const [statusResult, predResult] = await Promise.allSettled([
        isAuthenticated ? authRequest("subscription/status/") : Promise.resolve(null),
        authRequest(`/bill-query/prediction/generate/${bill_id}/`, {}, { baseUrl: BILL_QUERY_BASE_URL }),
      ]);

      let tierVal = 0;
      if (statusResult.status === "fulfilled" && statusResult.value) {
        tierVal = statusResult.value.tier ?? 0;
        setTier(tierVal);
        setBudget(statusResult.value.daily_prediction_credits ?? PLUS_DAILY);
      }

      if (predResult.status === "fulfilled" && predResult.value?.house_dist && predResult.value?.senate_dist) {
        const data = predResult.value;
        setPredData({ house_dist: data.house_dist, senate_dist: data.senate_dist, credits_remaining: data.credits_remaining ?? null });
        if (data.member_reveal_unlocked || tierVal >= 2) {
          try {
            const memData = await authRequest(`/bill-query/prediction/members/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
            if (memData?.success) {
              setMembersData(memData);
              setMemberPhase("unlocked");
            }
          } catch { /* member load failure is non-fatal */ }
        }
        setPhase("ready");
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
    setPhase("generating");
    try {
      const data = await authRequest(`/bill-query/prediction/generate/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (data?.error) {
        const errCode = data.error;
        if (errCode === "upgrade_required") setErrorMsg("Upgrade your plan to generate predictions.");
        else if (errCode === "bill_passed") setErrorMsg("Predictions unavailable — this bill has already passed.");
        else if (errCode === "not_eligible") setErrorMsg("Predictions are only available for the current Congress.");
        else if (errCode === "daily_limit") setErrorMsg("You've used all your prediction credits for today.");
        else setErrorMsg("Something went wrong. Please try again.");
        setPhase("empty"); return;
      }
      setPredData({ house_dist: data.house_dist, senate_dist: data.senate_dist, credits_remaining: data.credits_remaining });
      if (data.credits_remaining !== null) setBudget(data.credits_remaining);

      // Fetch member data (free after generate since member_reveal_unlocked: true)
      const memData = await authRequest(`/bill-query/prediction/members/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (memData?.success) {
        setMembersData(memData);
        setMemberPhase("unlocked");
      } else {
        setMemberPhase("locked");
      }
      setPhase("ready");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again."); setPhase("empty");
    }
  }, [bill_id]);

  const handleReveal = useCallback(async () => {
    if (budget <= 0) return;
    setMemberPhase("revealing");
    try {
      const data = await authRequest(`/bill-query/prediction/members/${bill_id}/`, { method: "POST" }, { baseUrl: BILL_QUERY_BASE_URL });
      if (data?.success) {
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
      duration: 260,
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
  const chamberMembers = activeChamber === "house" ? (membersData?.members_house ?? []) : (membersData?.members_senate ?? []);

  const filteredMembers = useMemo(() => {
    return chamberMembers.filter(m =>
      (partyFilter === "all" || m.party === partyFilter) &&
      (memberSearch === "" || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.state.toLowerCase().includes(memberSearch.toLowerCase()))
    );
  }, [chamberMembers, partyFilter, memberSearch]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <NavReturn onPress={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.headerTitle}>Vote Predictions</Text>
              <View style={styles.betaBadge}><Text style={styles.betaText}>Beta</Text></View>
            </View>
            <Text style={styles.billId}>Bill {bill_id}</Text>
          </View>
        </View>

        {/* Bill passed banner */}
        {bill_passed && (
          <View style={[styles.noticeBanner, { borderColor: COLOR_AMBER + "66" }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLOR_AMBER} style={{ marginRight: 8 }} />
            <Text style={[styles.noticeText, { color: COLOR_AMBER, flex: 1 }]}>This bill has already passed. Predictions may not be available.</Text>
          </View>
        )}

        {/* Error banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={COLOR_ORANGE} style={{ marginRight: 8 }} />
            <Text style={[styles.noticeText, { color: COLOR_ORANGE, flex: 1 }]}>{errorMsg}</Text>
          </View>
        )}

        {phase === "empty" && <EmptyState tier={tier} isLoggedIn={isLoggedIn} budget={budget} billPassed={bill_passed} onGenerate={handleGenerate} navigation={navigation} theme={theme} styles={styles} />}
        {phase === "generating" && <GeneratingState theme={theme} styles={styles} />}
        {phase === "ready" && predData && (
          <ReadyState
            houseStats={houseStats} senateStats={senateStats} activeChamber={activeChamber}
            toggleAnim={toggleAnim} onSwitchChamber={switchChamber}
            tier={tier} budget={budget} memberPhase={memberPhase} onReveal={handleReveal}
            filteredMembers={filteredMembers} totalMemberCount={chamberMembers.length}
            memberSearch={memberSearch} setMemberSearch={setMemberSearch}
            partyFilter={partyFilter} setPartyFilter={setPartyFilter}
            navigation={navigation} theme={theme} styles={styles}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tier, isLoggedIn, budget, billPassed, onGenerate, navigation, theme, styles }: any) {
  const noCredits = tier === 1 && budget <= 0;
  const disabled = noCredits || billPassed;

  if (!isLoggedIn) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyLead />
        <Pressable style={[styles.btnPrimary, { marginBottom: 10 }]} onPress={() => navigation.navigate("Login")}>
          <Ionicons name="lock-closed-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.btnPrimaryText}>Log in to generate a prediction</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("Register")}>
          <Text style={[styles.btnGhostText, { color: theme.subtext }]}>Create an account</Text>
        </Pressable>
      </View>
    );
  }

  if (tier === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyLead />
        <View style={styles.amberNotice}>
          <Ionicons name="lock-closed" size={14} color={COLOR_AMBER} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.amberNoticeText}>
            <Text style={{ fontWeight: "700", color: "#f0d385" }}>Vote predictions are a Plus & Premium feature. </Text>
            Upgrade your plan to generate AI floor-vote forecasts.
          </Text>
        </View>
        <Pressable style={[styles.btnPrimary, { marginBottom: 10 }]} onPress={() => navigation.navigate("Plans")}>
          <Text style={styles.btnPrimaryText}>Upgrade to Plus</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("Plans")}>
          <Text style={[styles.btnGhostText, { color: theme.subtext }]}>Compare plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <EmptyLead />
      <Pressable
        style={[styles.btnPrimary, disabled && styles.btnDisabled]}
        onPress={disabled ? undefined : onGenerate}
      >
        <Ionicons name="flash-outline" size={15} color={disabled ? "#888" : "#fff"} style={{ marginRight: 6 }} />
        <Text style={[styles.btnPrimaryText, disabled && { color: theme.subtext }]}>Request a prediction</Text>
      </Pressable>
      {tier === 1 ? (
        <CreditMeter budget={budget} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
          <View style={styles.premiumBadge}><Text style={[styles.premiumBadgeText, { color: COLOR_PURPLE }]}>Premium</Text></View>
          <Text style={{ fontSize: 12, color: theme.subtext ?? "#A0A0A0", fontWeight: "400" }}>Unlimited predictions & full access.</Text>
        </View>
      )}
    </View>
  );
}

function EmptyLead() {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={{ alignItems: "center", marginBottom: 22 }}>
      <Ionicons name="flash-outline" size={28} color="#7d8590" />
      <Text style={{ fontSize: 18, fontWeight: "700", color: theme.titleText, marginTop: 8, marginBottom: 6 }}>AI Vote Prediction</Text>
      <Text style={{ fontSize: 13, color: theme.subtext, lineHeight: 20, textAlign: "center", fontWeight: "400" }}>
        Monte-Carlo simulation forecasting the bill's likelihood of passage and how each member is expected to vote.
      </Text>
    </View>
  );
}

function CreditMeter({ budget }: { budget: number }) {
  const { theme } = useContext(ThemeContext);
  const used = PLUS_DAILY - budget;
  const fill = budget <= 0 ? COLOR_RED : budget <= 3 ? COLOR_AMBER : COLOR_GREEN;
  return (
    <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 10, color: theme.subtext, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "400" }}>Daily Prediction Credits</Text>
        <Text style={{ fontSize: 11, color: fill, fontWeight: "600" }}>{budget} of {PLUS_DAILY} left</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {Array.from({ length: PLUS_DAILY }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i < used ? theme.secondary : fill }} />
        ))}
      </View>
      <Text style={{ fontSize: 10.5, color: theme.subtext, marginTop: 9, fontWeight: "400" }}>
        {budget <= 0 ? "Daily limit reached — resets at midnight ET." : "Generating a prediction uses 1 credit."}
      </Text>
    </View>
  );
}

// ── Generating State ─────────────────────────────────────────────────────────
function GeneratingState({ theme, styles }: any) {
  return (
    <View style={[styles.section, { alignItems: "center", paddingVertical: 36 }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, marginTop: 14, marginBottom: 4 }}>Simulating floor votes…</Text>
      <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: "400" }}>This may take a few seconds</Text>
    </View>
  );
}

// ── Ready State ──────────────────────────────────────────────────────────────
function ReadyState({
  houseStats, senateStats, activeChamber, toggleAnim, onSwitchChamber,
  tier, budget, memberPhase, onReveal,
  filteredMembers, totalMemberCount, memberSearch, setMemberSearch, partyFilter, setPartyFilter,
  navigation, theme, styles,
}: any) {
  const stats = activeChamber === "house" ? houseStats : senateStats;
  const threshold = activeChamber === "house" ? HOUSE_THRESHOLD : SENATE_THRESHOLD;
  const chamberlabel = activeChamber === "house" ? "House of Representatives" : "Senate";

  return (
    <>
      <ChamberToggle activeChamber={activeChamber} toggleAnim={toggleAnim} onSwitch={onSwitchChamber} theme={theme} styles={styles} />
      <PassageSummary stats={stats} threshold={threshold} theme={theme} styles={styles} />
      {/* Both histograms stay mounted; only the active one is visible — no recompute on switch */}
      <View style={{ display: (activeChamber === "house" ? "flex" : "none") as "flex" | "none" }}>
        <HistogramView entries={houseStats.entries} threshold={HOUSE_THRESHOLD} stats={houseStats} activeChamber="house" theme={theme} styles={styles} />
      </View>
      <View style={{ display: (activeChamber === "senate" ? "flex" : "none") as "flex" | "none" }}>
        <HistogramView entries={senateStats.entries} threshold={SENATE_THRESHOLD} stats={senateStats} activeChamber="senate" theme={theme} styles={styles} />
      </View>
      <View style={[styles.divider, { marginVertical: 20 }]} />

      {/* Member section header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={styles.sectionLabel}>Per-Member Predictions</Text>
        {(tier >= 2) && (
          <View style={styles.premiumBadge}><Text style={[styles.premiumBadgeText, { color: COLOR_PURPLE }]}>Premium · Unlimited</Text></View>
        )}
      </View>
      {memberPhase === "unlocked" && (
        <Text style={{ fontSize: 10, color: theme.subtext, marginBottom: 10, letterSpacing: 0.3, fontWeight: "400" }}>Sorted by P(votes Yes), high → low</Text>
      )}
      <Text style={{ fontSize: 10, color: theme.subtext, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "400" }}>{chamberlabel}</Text>

      {memberPhase === "unlocked" ? (
        <MemberList
          members={filteredMembers} total={totalMemberCount}
          search={memberSearch} onSearch={setMemberSearch}
          party={partyFilter} onParty={setPartyFilter}
          theme={theme} styles={styles}
        />
      ) : (
        <LockedMembers
          tier={tier} budget={budget} memberPhase={memberPhase}
          onReveal={onReveal} navigation={navigation} theme={theme} styles={styles}
        />
      )}
    </>
  );
}

function ChamberToggle({ activeChamber, toggleAnim, onSwitch, theme, styles }: any) {
  const thumbLeft = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "52%"] });
  return (
    <View style={styles.chamberToggleContainer}>
      <Animated.View style={[styles.chamberThumb, { left: thumbLeft }]} />
      {(["house", "senate"] as const).map((ch) => (
        <Pressable key={ch} style={styles.chamberOption} onPress={() => onSwitch(ch)}>
          <Text style={[styles.chamberOptionText, activeChamber === ch && styles.chamberOptionActive]}>
            {ch === "house" ? "House" : "Senate"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PassageSummary({ stats, threshold, theme, styles }: any) {
  const { passProb, median, p5, p95 } = stats;
  const passing = passProb >= 0.5;
  const col = probColor(passProb);
  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statCell, { flex: 2 }]}>
        <Text style={styles.statLabel}>Passage Probability</Text>
        <Text style={[styles.statBig, { color: col }]}>{(passProb * 100).toFixed(1)}%</Text>
        <View style={[styles.passBadge, { backgroundColor: (passing ? COLOR_GREEN : COLOR_ORANGE) + "30", borderColor: (passing ? COLOR_GREEN : COLOR_ORANGE) + "66" }]}>
          <Text style={[styles.passBadgeText, { color: passing ? COLOR_GREEN : COLOR_ORANGE }]}>
            {passing ? "Likely to Pass" : "Likely to Fail"}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Median Yes</Text>
          <Text style={styles.statMono}>{median}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>90% Range</Text>
          <Text style={[styles.statMono, { color: theme.subtext }]}>{p5}–{p95}</Text>
        </View>
      </View>
      <View style={[styles.statCell, { flex: 1 }]}>
        <Text style={styles.statLabel}>Needed to Pass</Text>
        <Text style={[styles.statMono, { color: COLOR_AMBER, fontSize: 20 }]}>{threshold}</Text>
      </View>
    </View>
  );
}

const HIST_HEIGHT = 130;

function HistogramView({ entries, threshold, stats, activeChamber, theme, styles }: any) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { total, maxCount } = stats;
  const chamberLabel = activeChamber === "house" ? "Predicted House Floor Vote · Yes Count" : "Predicted Senate Floor Vote · Yes Count";
  const range = (stats.max - stats.min) || 1;

  return (
    <View style={styles.histContainer}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <Text style={styles.histLabel}>{chamberLabel}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: COLOR_GREEN }} />
            <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: "400" }}>Passes</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: COLOR_ORANGE }} />
            <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: "400" }}>Fails</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: HIST_HEIGHT, gap: 1, minWidth: Math.max(entries.length * 8, 280) }}>
          {entries.map((bar: DistEntry, i: number) => {
            const barH = maxCount > 0 ? (bar.count / maxCount) * HIST_HEIGHT : 2;
            const isPass = bar.vote >= threshold;
            const isActive = hovered === bar.vote;
            const barColor = isPass ? COLOR_GREEN : COLOR_ORANGE;
            return (
              <Pressable
                key={bar.vote}
                onPressIn={() => setHovered(bar.vote)}
                onPressOut={() => setHovered(null)}
                style={{ flex: 1, minWidth: 6, height: barH, backgroundColor: isActive ? barColor : barColor + "b0", borderRadius: 2 }}
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

      {/* X-axis labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: "400" }}>{stats.min}</Text>
        {stats.max !== stats.min && (
          <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: "400" }}>{Math.round((stats.min + stats.max) / 2)}</Text>
        )}
        <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: "400" }}>{stats.max}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 9, color: COLOR_AMBER, fontWeight: "400" }}>← Fails</Text>
        <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: "400" }}>({threshold} to pass)</Text>
        <Text style={{ fontSize: 9, color: COLOR_GREEN, fontWeight: "400" }}>Passes →</Text>
      </View>
    </View>
  );
}

// ── Member List ──────────────────────────────────────────────────────────────
function MemberList({ members, total, search, onSearch, party, onParty, theme, styles }: any) {
  const partyOpts: [string, string][] = [["all", "All"], ["D", "Dem"], ["R", "Rep"]];
  return (
    <View style={styles.memberListContainer}>
      <TextInput
        style={styles.memberSearch}
        value={search}
        onChangeText={onSearch}
        placeholder="Search name or state…"
        placeholderTextColor={theme.subtext}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {partyOpts.map(([k, l]) => {
          const isOn = party === k;
          const c = k === "D" ? COLOR_BLUE : k === "R" ? COLOR_RED : theme.subtext;
          return (
            <Pressable key={k} onPress={() => onParty(k)}
              style={[styles.partyChip, { backgroundColor: isOn ? c + "22" : "transparent", borderColor: isOn ? c + "77" : theme.border }]}>
              <Text style={[styles.partyChipText, { color: isOn ? c : theme.subtext }]}>{l}</Text>
            </Pressable>
          );
        })}
        <Text style={{ fontSize: 10, color: theme.subtext, marginLeft: "auto", fontWeight: "400" }}>{members.length} members</Text>
      </View>

      {/* Column headers */}
      <View style={{ flexDirection: "row", paddingHorizontal: 4, marginBottom: 6 }}>
        <Text style={[styles.colHeader, { width: 24 }]}>#</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>Member</Text>
        <Text style={[styles.colHeader]}>P(Votes Yes)</Text>
      </View>

      {members.length === 0 ? (
        <Text style={{ color: theme.subtext, textAlign: "center", padding: 24, fontSize: 13, fontWeight: "400" }}>No members match.</Text>
      ) : (
        members.map((m: MemberEntry, i: number) => (
          <MemberRow key={`${m.name}-${i}`} member={m} rank={i + 1} theme={theme} styles={styles} />
        ))
      )}
    </View>
  );
}

function MemberRow({ member, rank, theme, styles }: { member: MemberEntry; rank: number; theme: any; styles: any }) {
  const col = probColor(member.prob);
  const partyColor = PARTY_COLORS[member.party] ?? theme.subtext;
  const seat = member.district != null ? `${member.party} · ${member.state}-${member.district}` : `${member.party} · ${member.state}`;

  return (
    <View style={styles.memberRow}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={[styles.memberRank]}>{rank}</Text>
        <Text style={[styles.memberName, { flex: 1 }]} numberOfLines={1}>{member.name}</Text>
        <Text style={[styles.memberProb, { color: col }]}>{Math.round(member.prob * 100)}%</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 }}>
        <Text style={{ fontSize: 10, color: partyColor, width: 70, fontWeight: "400" }}>{seat}</Text>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.secondary, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${member.prob * 100}%`, backgroundColor: col, borderRadius: 3 }} />
        </View>
      </View>
    </View>
  );
}

// ── Locked Members ───────────────────────────────────────────────────────────
const PLACEHOLDER_MEMBERS = Array.from({ length: 5 }, (_, i) => ({
  name: "Representative Name", party: "D", state: "NY", district: i + 1, prob: 0.5,
}));

function LockedMembers({ tier, budget, memberPhase, onReveal, navigation, theme, styles }: any) {
  const isRevealing = memberPhase === "revealing";
  const noCredits = tier === 1 && budget <= 0;
  const lockColor = tier === 1 ? COLOR_BLUE : COLOR_AMBER;

  return (
    <View>
      {/* Dimmed placeholder rows */}
      <View style={{ opacity: 0.15, pointerEvents: "none" }}>
        {PLACEHOLDER_MEMBERS.map((m, i) => (
          <MemberRow key={i} member={m as MemberEntry} rank={i + 1} theme={theme} styles={styles} />
        ))}
      </View>

      {/* Lock overlay */}
      <View style={[styles.lockOverlay, { backgroundColor: theme.background + "ee" }]}>
        <View style={[styles.lockIconCircle, { borderColor: lockColor + "55" }]}>
          <Ionicons name="lock-closed" size={20} color={lockColor} />
        </View>
        <Text style={[styles.lockTitle]}>Per-Member Predictions</Text>

        {tier >= 2 ? null : tier === 1 ? (
          <>
            <Text style={styles.lockBody}>See each legislator's probability of voting Yes.</Text>
            <Pressable
              style={[styles.btnPrimary, (noCredits || isRevealing) && styles.btnDisabled, { marginTop: 12 }]}
              onPress={noCredits || isRevealing ? undefined : onReveal}
            >
              {isRevealing ? (
                <><ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} /><Text style={styles.btnPrimaryText}>Loading members…</Text></>
              ) : (
                <Text style={styles.btnPrimaryText}>Reveal per-member predictions · 1 credit</Text>
              )}
            </Pressable>
            <Text style={{ fontSize: 10.5, color: noCredits ? COLOR_RED : theme.subtext, marginTop: 6, textAlign: "center", fontWeight: "400" }}>
              {noCredits ? "Daily limit reached — resets at midnight ET." : `${budget} of ${PLUS_DAILY} credits left today`}
            </Text>
            <Text style={{ fontSize: 10.5, color: theme.subtext, marginTop: 4, textAlign: "center", lineHeight: 16, fontWeight: "400" }}>
              Once revealed, accessible for 24 hours without additional credits.
            </Text>
          </>
        ) : tier === 0 ? (
          <>
            <Text style={styles.lockBody}><Text style={{ fontWeight: "700", color: "#f0d385" }}>Available on Plus & Premium. </Text>See exactly how likely each member is to vote Yes.</Text>
            <Pressable style={[styles.btnPrimary, { marginTop: 12 }]} onPress={() => navigation.navigate("Plans")}>
              <Text style={styles.btnPrimaryText}>Upgrade to Plus</Text>
            </Pressable>
            <Pressable style={[styles.btnGhost, { marginTop: 8 }]} onPress={() => navigation.navigate("Plans")}>
              <Text style={[styles.btnGhostText, { color: theme.subtext }]}>Compare plans</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.lockBody}>Log in with a Plus or Premium plan to see each member's probability of voting Yes.</Text>
            <Pressable style={[styles.btnPrimary, { marginTop: 12 }]} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.btnPrimaryText}>Log in</Text>
            </Pressable>
            <Pressable style={[styles.btnGhost, { marginTop: 8 }]} onPress={() => navigation.navigate("Plans")}>
              <Text style={[styles.btnGhostText, { color: theme.subtext }]}>See plans</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: any, isLandscape = false) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: isLandscape ? "18%" : "4%", paddingTop: isLandscape ? "6%" : "24%" },
    scrollContent: { paddingBottom: 20 },
    headerCard: { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: 16, fontWeight: "700", color: theme.titleText, letterSpacing: 0.3 },
    betaBadge: { backgroundColor: COLOR_AMBER, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
    betaText: { fontSize: 10, fontWeight: "700", color: "#0d1117" },
    billId: { fontSize: 11, color: theme.subtext, fontWeight: "400" },
    noticeBanner: { flexDirection: "row", alignItems: "flex-start", backgroundColor: COLOR_AMBER + "22", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
    errorBanner: { flexDirection: "row", alignItems: "flex-start", backgroundColor: COLOR_ORANGE + "22", borderWidth: 1, borderColor: COLOR_ORANGE + "44", borderRadius: 10, padding: 12, marginBottom: 12 },
    noticeText: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
    emptyContainer: { backgroundColor: theme.card, borderRadius: 14, padding: 22, marginBottom: 12, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
    amberNotice: { flexDirection: "row", alignItems: "flex-start", backgroundColor: COLOR_AMBER + "22", borderWidth: 1, borderColor: COLOR_AMBER + "40", borderRadius: 12, padding: 14, marginBottom: 16 },
    amberNoticeText: { fontSize: 12.5, color: "#e3c270", lineHeight: 20, flex: 1, fontWeight: "400" },
    btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20 },
    btnPrimaryText: { fontSize: 14.5, fontWeight: "700", color: "#fff" },
    btnGhost: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20 },
    btnGhostText: { fontSize: 14.5, fontWeight: "600" },
    btnDisabled: { opacity: 0.5 },
    premiumBadge: { borderWidth: 1, borderColor: COLOR_PURPLE + "44", backgroundColor: COLOR_PURPLE + "1c", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
    premiumBadgeText: { fontSize: 9.5, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
    section: { backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    divider: { height: 1, backgroundColor: theme.border },
    sectionLabel: { fontSize: 12, fontWeight: "600", color: theme.text, textTransform: "uppercase", letterSpacing: 0.8 },
    chamberToggleContainer: { flexDirection: "row", backgroundColor: theme.secondary, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 4, marginBottom: 16, position: "relative", height: 44 },
    chamberThumb: { position: "absolute", top: 4, bottom: 4, width: "47%", backgroundColor: theme.card, borderRadius: 9, borderWidth: 1, borderColor: theme.border, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 3 },
    chamberOption: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
    chamberOptionText: { fontSize: 13.5, fontWeight: "500", color: theme.subtext },
    chamberOptionActive: { fontWeight: "700", color: theme.text },
    statsGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
    statCell: { backgroundColor: theme.secondary, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
    statLabel: { fontSize: 9.5, color: theme.subtext, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: "400" },
    statBig: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
    statMono: { fontSize: 20, fontWeight: "500", color: theme.text, fontVariant: ["tabular-nums"] },
    passBadge: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 8 },
    passBadgeText: { fontSize: 10.5, fontWeight: "600" },
    histContainer: { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
    histLabel: { fontSize: 9.5, color: theme.subtext, textTransform: "uppercase", letterSpacing: 0.6, flex: 1, fontWeight: "400" },
    tooltip: { position: "absolute", bottom: "110%", left: "50%", transform: [{ translateX: -30 }], backgroundColor: "#000", borderWidth: 1, borderColor: theme.border, borderRadius: 7, padding: 6, minWidth: 60, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 18 },
    tooltipText: { fontSize: 10.5, color: theme.text, textAlign: "center", fontWeight: "400" },
    tooltipSub: { fontSize: 9.5, textAlign: "center", fontWeight: "400" },
    memberListContainer: { backgroundColor: theme.card, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    memberSearch: { margin: 10, padding: 10, borderRadius: 10, backgroundColor: theme.secondary, color: theme.text, fontSize: 13, borderWidth: 1, borderColor: theme.border, fontWeight: "400" },
    partyChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, marginBottom: 4 },
    partyChipText: { fontSize: 11.5, fontWeight: "500" },
    colHeader: { fontSize: 8.5, color: theme.subtext, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "400" },
    memberRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    memberRank: { fontSize: 11, color: theme.subtext, minWidth: 20, fontWeight: "400" },
    memberName: { fontSize: 14, fontWeight: "500", color: theme.text },
    memberProb: { fontSize: 13.5, fontWeight: "500" },
    lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", padding: 22, borderRadius: 12 },
    lockIconCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, backgroundColor: theme.secondary, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    lockTitle: { fontSize: 16, fontWeight: "700", color: theme.titleText, marginBottom: 8, textAlign: "center" },
    lockBody: { fontSize: 12.5, color: theme.subtext, lineHeight: 20, textAlign: "center", maxWidth: 280, fontWeight: "400" },
  });
