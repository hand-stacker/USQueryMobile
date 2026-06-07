import Markdown from "@/app/components/Markdown";
import NavReturn from "@/app/components/NavReturn";
import { retrieveUserSession } from "@/app/encrypted-storage/functions";
import { authRequest } from "@/app/hooks/authRequest";
import { useSendChatMessage } from "@/app/hooks/useSendChatMessage";
import { ThemeContext } from "@/app/theme/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BILL_QUERY_BASE_URL = "https://www.usquery.com";

const EXAMPLE_QUESTIONS = [
  "What does this bill actually do?",
  "Who would be most affected by this bill?",
  "What problem is this bill trying to solve?",
  "How much would this cost taxpayers?",
  "What are the arguments for and against this bill?",
  "Has anything like this passed before?",
  "Which groups support or oppose this bill?",
  "When would this take effect if passed?",
  "What changes would this make to existing law?",
  "How does this bill affect everyday Americans?",
];

const COLOR_GREEN = "#2ea87e";
const COLOR_AMBER = "#d29922";
const COLOR_ORANGE = "#e8833a";
const COLOR_RED = "#f85149";
const COLOR_PURPLE = "#a371f7";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  isError?: boolean;
}

interface UsageState {
  display: "count" | "donut" | "none";
  val: number | null;
  limit?: number;
}

interface Props { navigation: any; route: any }

export default function BillChatScreen({ navigation, route }: Props) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const styles = useMemo(() => createStyles(theme, isLandscape), [theme, isLandscape]);

  const { bill_id, bill_title } = route.params as { bill_id: string; bill_title: string };
  const billIdNum = useMemo(() => parseInt(String(bill_id), 10), [bill_id]);

  const [tierLoading, setTierLoading] = useState(true);
  const [tier, setTier] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [chatDisabled, setChatDisabled] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState>({ display: "none", val: null });
  const [showSources, setShowSources] = useState<string | null>(null);

  const examplePlaceholder = useMemo(
    () => EXAMPLE_QUESTIONS[Math.floor(Math.random() * EXAMPLE_QUESTIONS.length)],
    []
  );

  const { send, sending } = useSendChatMessage(billIdNum);

  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const loadTierAndUsage = useCallback(async () => {
    setTierLoading(true);
    try {
      const session = await retrieveUserSession();
      if (!session?.accessToken) { setIsLoggedIn(false); setTier(0); return; }
      setIsLoggedIn(true);
      const [status, usageData] = await Promise.all([
        authRequest("subscription/status/"),
        authRequest("/bill-query/chat/usage/", {}, { baseUrl: BILL_QUERY_BASE_URL })
          .catch(() => ({ display: "none", val: null })),
      ]);
      setTier(status.tier ?? 0);
      if (usageData?.display) setUsage(usageData);
      if (status.tier === 0) setChatDisabled(true);
    } catch {
      setIsLoggedIn(false); setTier(0); setChatDisabled(true);
    } finally {
      setTierLoading(false);
    }
  }, []);

  useEffect(() => { loadTierAndUsage(); }, [loadTierAndUsage]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending || chatDisabled) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    scrollToEnd();

    try {
      const result = await send(text, sessionId);

      if (result.sessionId && !sessionId) {
        setSessionId(result.sessionId);
      }

      if (result.error) {
        handleChatError(result.error, result.messagesRemaining ?? null, result.monthlyCostPct ?? null);
        const errMsg: Message = { id: Date.now().toString() + "_err", role: "assistant", text: errorText(result.error), isError: true };
        setMessages(prev => [...prev, errMsg]);
      } else {
        const assistantMsg: Message = {
          id: Date.now().toString() + "_ai",
          role: "assistant",
          text: result.assistantMessage ?? "",
          sources: result.sources && result.sources.length > 0 ? result.sources : undefined,
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (result.messagesRemaining !== null && result.messagesRemaining !== undefined) {
          setUsage(prev => ({ ...prev, val: result.messagesRemaining! }));
        }
        if (result.monthlyCostPct !== null && result.monthlyCostPct !== undefined) {
          setUsage(prev => ({ ...prev, val: result.monthlyCostPct! }));
        }
      }
    } catch {
      const errMsg: Message = { id: Date.now().toString() + "_err", role: "assistant", text: "Something went wrong. Please try again.", isError: true };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      scrollToEnd();
    }
  }, [inputText, sending, chatDisabled, sessionId, send, scrollToEnd]);

  const handleChatError = (error: string, messagesRemaining: number | null, monthlyCostPct: number | null) => {
    if (error === "RATE_LIMITED") {
      setChatDisabled(true);
      setLimitMessage("You've used your daily messages. Come back tomorrow.");
      setUsage(prev => ({ ...prev, val: 0 }));
    } else if (error === "MONTHLY_LIMIT_REACHED") {
      setChatDisabled(true);
      setLimitMessage("Monthly token limit reached. Resets at the start of next month.");
      setUsage(prev => ({ ...prev, val: 1.0 }));
    } else if (error === "Authentication required." || error === "Invalid or expired token.") {
      navigation.navigate("Login");
    }
  };

  const errorText = (error: string): string => {
    switch (error) {
      case "UPGRADE_REQUIRED": return "This feature requires a Plus or Premium plan. Upgrade to chat with the AI.";
      case "RATE_LIMITED": return "You've reached your daily message limit. Come back tomorrow!";
      case "MONTHLY_LIMIT_REACHED": return "Monthly token limit reached. Resets next month.";
      case "Authentication required.": return "Please log in to use the AI chatbot.";
      case "Invalid or expired token.": return "Your session expired. Please log in again.";
      case "AI_OVERLOADED": return "The AI is overloaded right now. Please try again in a moment.";
      default: return "The AI service is temporarily unavailable. Please try again.";
    }
  };

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  if (tierLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <NavReturn onPress={handleGoBack} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.primary} />
          <Text style={styles.headerTitle} numberOfLines={1}>Ask AI about this bill</Text>
        </View>
        {bill_title ? (
          <Text style={styles.headerSub} numberOfLines={2}>{bill_title}</Text>
        ) : null}
      </View>

      {/* Usage indicator */}
      {usage.display !== "none" && <UsageBar usage={usage} tier={tier} theme={theme} styles={styles} />}

      {/* Gate for non-logged-in / free users */}
      {(!isLoggedIn || tier === 0) ? (
        <GateView isLoggedIn={isLoggedIn} navigation={navigation} theme={theme} styles={styles} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyChat theme={theme} styles={styles} />}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                showSources={showSources === item.id}
                onToggleSources={() => setShowSources(prev => prev === item.id ? null : item.id)}
                theme={theme} styles={styles}
              />
            )}
          />

          {/* Limit banner */}
          {limitMessage && (
            <View style={styles.limitBanner}>
              <Ionicons name="time-outline" size={15} color={COLOR_AMBER} style={{ marginRight: 6 }} />
              <Text style={styles.limitText}>{limitMessage}</Text>
            </View>
          )}

          {/* Sending indicator */}
          {sending && (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.typingText}>Thinking…</Text>
              </View>
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={chatDisabled ? "Chat unavailable" : examplePlaceholder}
              placeholderTextColor={theme.subtext}
              multiline
              maxLength={800}
              editable={!chatDisabled && !sending}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendBtn, (!inputText.trim() || sending || chatDisabled) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending || chatDisabled}
            >
              <Ionicons name="send" size={18} color={(!inputText.trim() || sending || chatDisabled) ? theme.subtext : "#fff"} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ── Gate for unauthenticated / free users ────────────────────────────────────
function GateView({ isLoggedIn, navigation, theme, styles }: any) {
  return (
    <View style={styles.gateContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={32} color={theme.subtext} />
      <Text style={styles.gateTitle}>AI Bill Chatbot</Text>
      <Text style={styles.gateBody}>
        {!isLoggedIn
          ? "Log in with a Plus or Premium plan to chat with the AI about this bill."
          : "Upgrade to Plus or Premium to unlock AI-powered Q&A for every bill."}
      </Text>
      {!isLoggedIn ? (
        <>
          <Pressable style={[styles.btnPrimary, { marginTop: 20 }]} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.btnText}>Log in</Text>
          </Pressable>
          <Pressable style={[styles.btnGhost, { marginTop: 10 }]} onPress={() => navigation.navigate("Plans")}>
            <Text style={[styles.btnGhostText, { color: theme.subtext }]}>See plans</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={[styles.btnPrimary, { marginTop: 20 }]} onPress={() => navigation.navigate("Plans")}>
          <Text style={styles.btnText}>Upgrade to Plus</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Empty chat state ─────────────────────────────────────────────────────────
function EmptyChat({ theme, styles }: any) {
  return (
    <View style={styles.emptyChatContainer}>
      <Ionicons name="chatbubble-outline" size={28} color={theme.subtext} />
      <Text style={styles.emptyChatTitle}>Start a conversation</Text>
      <Text style={styles.emptyChatBody}>Ask anything about this bill: what it does, who it affects, or how it became law.</Text>
    </View>
  );
}

// ── Usage indicator bar ──────────────────────────────────────────────────────
function UsageBar({ usage, tier, theme, styles }: any) {
  if (usage.display === "count") {
    const used = (usage.limit ?? 10) - (usage.val ?? 0);
    const total = usage.limit ?? 10;
    const fill = (usage.val ?? 0) <= 2 ? COLOR_RED : (usage.val ?? 0) <= 4 ? COLOR_AMBER : COLOR_GREEN;
    return (
      <View style={styles.usageBar}>
        <Text style={styles.usageLabel}>{usage.val ?? 0} of {total} messages left today</Text>
        <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i < used ? theme.border : fill }} />
          ))}
        </View>
      </View>
    );
  }
  if (usage.display === "donut") {
    const pct = Math.round((usage.val ?? 0) * 100);
    const fill = pct >= 90 ? COLOR_RED : pct >= 70 ? COLOR_AMBER : COLOR_GREEN;
    return (
      <View style={styles.usageBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.usageDonut, { borderColor: fill }]}>
            <Text style={[styles.usageDonutText, { color: fill }]}>{pct}%</Text>
          </View>
          <View>
            <Text style={styles.usageLabel}>Monthly token usage</Text>
            <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: "400" }}>
              {pct >= 100 ? "Monthly limit reached" : `${pct}% of your monthly budget used`}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  return null;
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, showSources, onToggleSources, theme, styles }: {
  message: Message; showSources: boolean; onToggleSources: () => void; theme: any; styles: any
}) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAI]}>
      {!isUser && (
        <View style={styles.aiBadge}>
          <Ionicons name="flash-outline" size={12} color={theme.primary} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : (message.isError ? styles.bubbleError : styles.bubbleAI),
      ]}>
        {!isUser && !message.isError ? (
          <Markdown
            color={theme.text}
            mutedColor={theme.subtext}
            accentColor={theme.primary}
            surfaceColor={theme.secondary}
            fontSize={14}
          >
            {message.text}
          </Markdown>
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI, message.isError && { color: COLOR_ORANGE }]}>
            {message.text}
          </Text>
        )}
      </View>
      {message.sources && message.sources.length > 0 && (
        <Pressable style={styles.sourcesToggle} onPress={onToggleSources}>
          <Ionicons name={showSources ? "chevron-up-outline" : "document-text-outline"} size={12} color={theme.primary} />
          <Text style={[styles.sourcesToggleText, { color: theme.primary }]}>
            {showSources ? "Hide sources" : `${message.sources.length} source${message.sources.length > 1 ? "s" : ""}`}
          </Text>
        </Pressable>
      )}
      {showSources && message.sources && (
        <View style={styles.sourcesContainer}>
          {message.sources.map((src, i) => (
            <View key={i} style={styles.sourceItem}>
              <Text style={styles.sourceLabel}>Source {i + 1}</Text>
              <Text style={styles.sourceText} numberOfLines={4}>{src}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: any, isLandscape = false) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: isLandscape ? "18%" : "4%", paddingTop: isLandscape ? "4%" : "24%" },
    header: { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    headerTitle: { fontSize: 16, fontWeight: "700", color: theme.titleText },
    headerSub: { fontSize: 12, color: theme.subtext, marginTop: 4, lineHeight: 18, fontWeight: "400" },
    usageBar: { backgroundColor: theme.card, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
    usageLabel: { fontSize: 12, fontWeight: "600", color: theme.text },
    usageDonut: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: "center", justifyContent: "center" },
    usageDonutText: { fontSize: 11, fontWeight: "700" },
    gateContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    gateTitle: { fontSize: 20, fontWeight: "700", color: theme.titleText, marginTop: 14, marginBottom: 8 },
    gateBody: { fontSize: 14, color: theme.subtext, lineHeight: 22, textAlign: "center", fontWeight: "400" },
    btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, width: "100%" },
    btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    btnGhost: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, width: "100%" },
    btnGhostText: { fontSize: 15, fontWeight: "600" },
    messageList: { paddingVertical: 8, paddingHorizontal: 4, flexGrow: 1 },
    emptyChatContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, paddingHorizontal: 24 },
    emptyChatTitle: { fontSize: 17, fontWeight: "700", color: theme.titleText, marginTop: 12, marginBottom: 8 },
    emptyChatBody: { fontSize: 13, color: theme.subtext, lineHeight: 20, textAlign: "center", fontWeight: "400" },
    bubbleWrapper: { marginBottom: 12, maxWidth: "88%" },
    bubbleWrapperUser: { alignSelf: "flex-end" },
    bubbleWrapperAI: { alignSelf: "flex-start" },
    aiBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary + "22", borderWidth: 1, borderColor: theme.primary + "55", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleUser: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
    bubbleAI: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 4 },
    bubbleError: { backgroundColor: COLOR_ORANGE + "22", borderWidth: 1, borderColor: COLOR_ORANGE + "44", borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 14, lineHeight: 21, fontWeight: "400" },
    bubbleTextUser: { color: "#fff", fontWeight: "500" },
    bubbleTextAI: { color: theme.text, fontWeight: "400" },
    sourcesToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, paddingLeft: 2 },
    sourcesToggleText: { fontSize: 12, fontWeight: "600" },
    sourcesContainer: { marginTop: 8, gap: 8 },
    sourceItem: { backgroundColor: theme.secondary, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: theme.border },
    sourceLabel: { fontSize: 10, fontWeight: "700", color: theme.subtext, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    sourceText: { fontSize: 12, color: theme.text, lineHeight: 18, fontWeight: "400" },
    typingRow: { paddingHorizontal: 4, paddingBottom: 6, alignSelf: "flex-start" },
    typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
    typingText: { fontSize: 13, color: theme.subtext, fontStyle: "italic", fontWeight: "400" },
    limitBanner: { flexDirection: "row", alignItems: "center", backgroundColor: COLOR_AMBER + "22", borderTopWidth: 1, borderTopColor: COLOR_AMBER + "44", paddingHorizontal: 14, paddingVertical: 10 },
    limitText: { fontSize: 12, color: COLOR_AMBER, lineHeight: 18, flex: 1, fontWeight: "400" },
    inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background },
    input: { flex: 1, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: theme.text, fontSize: 14, maxHeight: 120, lineHeight: 20, fontWeight: "400" },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sendBtnDisabled: { backgroundColor: theme.secondary, opacity: 0.6 },
  });
