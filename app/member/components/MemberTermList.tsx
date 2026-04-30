import AccentCard from "@/app/components/AccentCard";
import { UnscalableText } from "@/app/components/UnscalableText";
import { ThemeContext } from "@/app/theme/themeContext";
import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  termHistory: any[];
  partyColor: string;
}

export default function MemberTermList({ termHistory, partyColor }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionLabelWrap}>
        <View style={[styles.sectionLabelBar, { backgroundColor: theme.primary }]} />
        <UnscalableText style={styles.sectionLabelText}>Term History</UnscalableText>
      </View>
      {[...termHistory].reverse().map((term: any, i: number) => {
        const isActive = !term.endYear;
        const effectiveEnd = term.endYear ?? "Present";
        return (
          <AccentCard key={i} accentColor={partyColor}>
            <View style={styles.termCardTop}>
              <UnscalableText style={styles.termCongress}>{term.congress}</UnscalableText>
              <UnscalableText style={[styles.termDates, isActive && { color: partyColor }]}>
                {term.startYear} - {effectiveEnd}
              </UnscalableText>
            </View>
            <UnscalableText style={styles.termRole}>
              {term.memberType} · {term.stateCode}{term.district ? `-${term.district}` : ""}
            </UnscalableText>
            {isActive && (
              <View style={[styles.currentBadge, { backgroundColor: partyColor + "22" }]}>
                <UnscalableText style={[styles.currentBadgeText, { color: partyColor }]}>
                  CURRENT
                </UnscalableText>
              </View>
            )}
          </AccentCard>
        );
      })}
      <View style={{ height: 50 }} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingTop: 14,
    },
    sectionLabelWrap: {
      flexDirection: "row",
      alignItems: "center",
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
    termCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    termCongress: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      color: theme.subtext,
    },
    termDates: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.subtext,
    },
    termRole: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    currentBadge: {
      marginTop: 8,
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 20,
    },
    currentBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
  });
