import { ThemeContext } from "@/app/theme/themeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  bill_id: string;
  bill_passed: boolean;
  bill_title: string;
  navigation: any;
}

export default function AIFeaturesCarousel({ bill_id, bill_passed, bill_title, navigation }: Props) {
  const { theme } = useContext(ThemeContext);
  const s = styles(theme);
  const [page, setPage] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const features = [
    {
      key: "predictions",
      label: "Vote Predictions",
      description: "AI-powered floor vote forecast · Monte-Carlo simulation",
      iconName: "flash-outline" as const, //Ionicons wouldn't accept a normal string
      iconColor: "#d29922",
      iconBg: "#d2992222",
      iconBorder: "#d2992255",
      onPress: () => navigation.navigate("Vote_Predictions", { bill_id, bill_passed }),
    },
    {
      key: "chat",
      label: "Ask AI",
      description: "Chat with AI about this bill's impact and details",
      iconName: "chatbubble-ellipses-outline" as const,
      iconColor: theme.primary,
      iconBg: theme.primary + "22",
      iconBorder: theme.primary + "55",
      onPress: () => navigation.navigate("Bill_Chat", { bill_id, bill_title }),
    },
  ];

  const count = features.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref of the current page so the timer/gesture always read the latest.
  const pageRef = useRef(page);
  pageRef.current = page;

  // Fade out, switch to the given page, fade back in.
  const goTo = useCallback((next: number) => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setPage(((next % count) + count) % count);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fade, count]);

  // (Re)start the 5s auto-advance timer.
  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => goTo(pageRef.current + 1), 5000);
  }, [goTo]);

  useEffect(() => {
    startTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startTimer]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -40) goTo(pageRef.current + 1);
        else if (g.dx >= 40) goTo(pageRef.current - 1);
        startTimer();
      },
    })
  ).current;

  const f = features[page];

  return (
    <View style={s.wrapper}>
      <View style={s.sectionHeader}>
        <View style={s.accentBar} />
        <Text style={s.sectionTitle}>AI Features</Text>
      </View>

      <View style={s.card} {...pan.panHandlers}>
        <Animated.View style={{ opacity: fade }}>
          <Pressable
            style={({ pressed }) => [s.featureRow, { opacity: pressed ? 0.72 : 1 }]}
            onPress={f.onPress}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14}}>
              <View style={[s.iconContainer, { backgroundColor: f.iconBg, borderColor: f.iconBorder }]}>
                <Ionicons name={f.iconName} size={22} color={f.iconColor} />
              </View>
            </View>
            <View style={s.textBlock}>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureDescription}>{f.description}</Text>
            </View>
          </Pressable>
        </Animated.View>

        <View style={s.dots}>
          {features.map((_, i) => (
            <View key={i} style={[s.dot, i === page && s.dotActive]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  wrapper: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  accentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.text,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
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
  featureRow: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.titleText,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.subtext,
    lineHeight: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: theme.primary,
  },
});
