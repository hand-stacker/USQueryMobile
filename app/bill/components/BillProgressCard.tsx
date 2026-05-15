import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext, useRef } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

type Color = 'green' | 'blue' | 'red' | 'gray';

interface SingleStep { kind: 'step'; title: string; color: Color; label: string }
interface MultiStep  { kind: 'multi'; title: string; items: [Color, string][] }
interface Connector  { kind: 'conn'; done: boolean }
type Part = SingleStep | MultiStep | Connector;

function buildPipeline(
  sc: number,
  origin: string,
  outer: string,
  confHist: boolean,
  vetoHist: boolean,
  passed: boolean,
): Part[] {
  const isConf = sc >= 50 && sc <= 59;
  const isVeto = sc >= 70 && sc <= 79;
  const parts: Part[] = [];

  const ic: Color = sc === 9 ? 'red' : 'green';
  parts.push({ kind: 'step', title: 'Intro', color: ic, label: sc === 9 ? 'Expired' : 'Introduced' });
  parts.push({ kind: 'conn', done: sc >= 10 });

  if (isConf || confHist) {
    let items: [Color, string][];
    if (sc === 50)            { items = [['blue', `${origin}: Awaiting`], ['blue', `${outer}: Awaiting`]]; }
    else if (sc >= 51 && sc <= 53) { items = [['blue', `${origin}: Considering`], ['blue', `${outer}: Considering`]]; }
    else if (sc === 54)       { items = [['green', `${origin}: Passed`], ['blue', `${outer}: Considering`]]; }
    else if (sc === 59)       { items = [['red', 'Expired'], ['red', 'Expired']]; }
    else                      { items = [['green', `${origin}: Passed`], ['green', `${outer}: Passed`]]; }
    parts.push({ kind: 'multi', title: 'Conference', items });
    parts.push({ kind: 'conn', done: sc >= 60 || isVeto });
  } else {
    let oc: Color, ol: string;
    if      (sc < 10)              { oc = 'gray';  ol = '...'; }
    else if (sc === 10)            { oc = 'blue';  ol = 'In Committee'; }
    else if (sc === 19)            { oc = 'red';   ol = 'Expired in\nCommittee'; }
    else if (sc === 20)            { oc = 'blue';  ol = 'Reported to\nFloor'; }
    else if (sc === 21)            { oc = 'green'; ol = 'Amended'; }
    else if (sc === 22)            { oc = 'green'; ol = 'Passed\nAmended'; }
    else if (sc === 25)            { oc = 'green'; ol = 'Passed'; }
    else if (sc === 27 || sc === 29) { oc = 'green'; ol = 'Expired after\nPassage'; }
    else if (sc === 28)            { oc = 'red';   ol = 'Expired on\nFloor'; }
    else if (sc === 41)            { oc = 'blue';  ol = 'Received\nAmended'; }
    else                           { oc = 'green'; ol = 'Passed'; }
    parts.push({ kind: 'step', title: origin, color: oc, label: ol });
    parts.push({ kind: 'conn', done: (sc >= 21 && sc < 27) || sc >= 30 });

    let xc: Color, xl: string;
    if      (sc === 27 || sc === 28 || sc === 29) { xc = 'gray';  xl = '...'; }
    else if (sc === 21)            { xc = 'blue';  xl = 'Received\nAmended'; }
    else if (sc < 30)              { xc = 'gray';  xl = '...'; }
    else if (sc === 30)            { xc = 'blue';  xl = 'In Committee'; }
    else if (sc === 39)            { xc = 'red';   xl = 'Expired in\nCommittee'; }
    else if (sc === 40)            { xc = 'blue';  xl = 'Reported'; }
    else if (sc === 41)            { xc = 'green'; xl = 'Amended'; }
    else if (sc === 42)            { xc = 'green'; xl = 'Passed\nAmended'; }
    else if (sc === 45)            { xc = 'green'; xl = 'Passed'; }
    else if (sc === 47 || sc === 49) { xc = 'green'; xl = 'Expired after\nPassage'; }
    else if (sc === 48)            { xc = 'red';   xl = 'Expired on\nFloor'; }
    else if (sc >= 60 || isVeto)   { xc = 'green'; xl = 'Passed'; }
    else                           { xc = 'gray';  xl = '...'; }
    parts.push({ kind: 'step', title: outer, color: xc, label: xl });
    parts.push({ kind: 'conn', done: sc >= 60 || isVeto });
  }

  if (isVeto || vetoHist) {
    let vitems: [Color, string][];
    if (sc === 75 || (passed && vetoHist)) {
      vitems = [['green', `Override: ${origin}`], ['green', `Override: ${outer}`], ['green', 'Overridden']];
    } else if (sc === 71) {
      vitems = [['green', `Override: ${origin}`], ['gray', outer], ['red', 'Vetoed']];
    } else if (sc === 72) {
      vitems = [['gray', origin], ['green', `Override: ${outer}`], ['red', 'Vetoed']];
    } else if (sc === 76) {
      vitems = [['red', `Failed: ${origin}`], ['gray', outer], ['red', 'Vetoed']];
    } else if (sc === 77) {
      vitems = [['gray', origin], ['red', `Failed: ${outer}`], ['red', 'Vetoed']];
    } else {
      vitems = [['gray', origin], ['gray', outer], ['red', 'Vetoed']];
    }
    parts.push({ kind: 'multi', title: 'Pres. Veto', items: vitems });
  } else {
    let pc: Color, pl: string;
    if      (sc === 49) { pc = 'gray';  pl = 'Expired'; }
    else if (sc === 60) { pc = 'blue';  pl = 'Enrolled'; }
    else if (sc === 61) { pc = 'green'; pl = 'Law Signed'; }
    else if (sc === 62) { pc = 'green'; pl = 'Law w/o\nSignature'; }
    else if (sc === 63) { pc = 'green'; pl = 'Law over\nVeto'; }
    else if (sc === 69) { pc = 'red';   pl = 'Pocket\nVetoed'; }
    else                { pc = 'gray';  pl = '...'; }
    parts.push({ kind: 'step', title: 'Pres. Act.', color: pc, label: pl });
  }

  return parts;
}

interface Props {
  status_code: number;
  origin: string;
  outer: string;
  conf_in_history?: boolean;
  veto_in_history?: boolean;
  passed?: boolean;
}

export default function BillProgressCard({
  status_code,
  origin,
  outer,
  conf_in_history = false,
  veto_in_history = false,
  passed = false,
}: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const dotBg = (c: Color): string => {
    if (c === 'green') return '#22c55e';
    if (c === 'blue')  return theme.primary;
    if (c === 'red')   return '#ef4444';
    return theme.inactive;
  };

  const labelClr = (c: Color): string => {
    if (c === 'green') return '#22c55e';
    if (c === 'blue')  return theme.primary;
    if (c === 'red')   return '#ef4444';
    return theme.subtext;
  };

  const parts = buildPipeline(status_code, origin, outer, conf_in_history, veto_in_history, passed);

  const scrollRef = useRef<ScrollView>(null);

  const partWidth = (p: Part) => p.kind === 'conn' ? 16 : p.kind === 'step' ? 68 : 104;

  const lastGreenX = (() => {
    let result = -1;
    let x = 0;
    for (const p of parts) {
      const isGreen =
        (p.kind === 'step' && p.color === 'green') ||
        (p.kind === 'multi' && p.items.some(([c]) => c === 'green'));
      if (isGreen) result = x;
      x += partWidth(p);
    }
    return result;
  })();

  const handleLayout = (e: LayoutChangeEvent) => {
    if (lastGreenX < 0) return;
    const containerWidth = e.nativeEvent.layout.width;
    const lastPartW = (() => {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const isGreen =
          (p.kind === 'step' && p.color === 'green') ||
          (p.kind === 'multi' && p.items.some(([c]) => c === 'green'));
        if (isGreen) return partWidth(p);
      }
      return 68;
    })();
    const targetX = lastGreenX + lastPartW - containerWidth;
    scrollRef.current?.scrollTo({ x: Math.max(0, targetX), animated: false });
  };

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={styles.labelBar} />
        <Text style={styles.labelText}>LEGISLATIVE PROGRESS</Text>
      </View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track} onLayout={handleLayout}>
        {parts.map((part, i): React.ReactNode => {
          if (part.kind === 'conn') {
            return <View key={i} style={[styles.connector, part.done && styles.connectorDone]} />;
          }
          if (part.kind === 'step') {
            return (
              <View key={i} style={styles.stepCol}>
                <Text style={styles.stepTitle}>{part.title}</Text>
                <View style={[styles.dot, { backgroundColor: dotBg(part.color), borderColor: dotBg(part.color) }]} />
                <Text style={[styles.stepLabel, { color: labelClr(part.color) }]}>{part.label}</Text>
              </View>
            );
          }
          return (
            <View key={i} style={styles.multiCol}>
              <Text style={styles.stepTitle}>{part.title}</Text>
              {part.items.map(([c, t], j) => (
                <View key={j} style={styles.multiItem}>
                  <View style={[styles.dotSmall, { backgroundColor: dotBg(c), borderColor: dotBg(c) }]} />
                  <Text style={[styles.multiLabel, { color: labelClr(c) }]}>{t}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginRight: 8,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.subtext,
    letterSpacing: 0.8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  stepCol: {
    alignItems: 'center',
    width: 68,
  },
  stepTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.subtext,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
    lineHeight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
    letterSpacing: 0.2,
  },
  connector: {
    height: 1.5,
    width: 16,
    backgroundColor: theme.border,
    marginTop: 19,
    alignSelf: 'flex-start',
  },
  connectorDone: {
    backgroundColor: '#22c55e',
  },
  multiCol: {
    alignItems: 'flex-start',
    width: 104,
  },
  multiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  multiLabel: {
    fontSize: 8,
    lineHeight: 11,
    flex: 1,
    letterSpacing: 0.2,
    fontWeight: '600',
  },
});
