import { ThemeContext } from "@/app/theme/themeContext";
import { useCallback, useContext, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

type VoteTally = 'YEA' | 'NAY' | 'SPLIT' | 'UNKNOWN';

// Tile cartogram layout: [stateAbbr, col, row] 
const STATE_TILES: [string, number, number][] = [
  // Row 0
  ["WA",0,0],["MT",2,0],["ND",3,0],["MN",4,0],["WI",5,0],["MI",6,0],["NY",9,0],["VT",10,0],["ME",11,0],
  // Row 1
  ["OR",0,1],["ID",2,1],["WY",3,1],["SD",4,1],["IL",5,1],["IN",6,1],["OH",7,1],["PA",8,1],["MA",10,1],["NH",11,1],
  // Row 2
  ["CA",0,2],["NV",1,2],["UT",2,2],["CO",3,2],["NE",4,2],["IA",5,2],["KY",6,2],["WV",7,2],["VA",8,2],["NJ",9,2],["CT",10,2],["RI",11,2],
  // Row 3
  ["AZ",1,3],["NM",2,3],["KS",4,3],["MO",5,3],["TN",6,3],["NC",7,3],["SC",8,3],["MD",9,3],["DE",10,3],
  // Row 4
  ["TX",3,4],["OK",4,4],["AR",5,4],["MS",6,4],["AL",7,4],["GA",8,4],["DC",9,4],
  // Row 5
  ["AK",0,5],["LA",5,5],["FL",9,5],
  // Row 6
  ["HI",1,6],
];

const COLS = 12;
const ROWS = 7;
const CELL = 20;
const GAP = 2;

const YEA_COLOR  = '#22c55e';
const NAY_COLOR  = '#ef4444';
const SPLIT_COLOR = '#6b7280';

function computeStateVotes(yeas: any[], nays: any[]): Record<string, VoteTally> {
  const counts: Record<string, { yea: number; nay: number }> = {};

  const tally = (arr: any[], key: 'yea' | 'nay') => {
    for (const item of arr) {
      const m = item.node ?? item;
      const st: string | undefined = m?.state;
      if (!st) continue;
      counts[st] = counts[st] ?? { yea: 0, nay: 0 };
      counts[st][key]++;
    }
  };

  tally(yeas, 'yea');
  tally(nays, 'nay');

  const result: Record<string, VoteTally> = {};
  for (const [st, { yea, nay }] of Object.entries(counts)) {
    if (yea > nay)      result[st] = 'YEA';
    else if (nay > yea) result[st] = 'NAY';
    else                result[st] = 'SPLIT';
  }
  return result;
}

interface Props {
  yeas: any[];
  nays: any[];
  pres: any[];
  novt: any[];
}

export default function GeoMap({ yeas, nays }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [expanded, setExpanded] = useState(true);
  const [mapWidth, setMapWidth] = useState(0);

  const onMapLayout = useCallback((e: LayoutChangeEvent) => {
    setMapWidth(e.nativeEvent.layout.width);
  }, []);

  const dynamicCell = mapWidth > 0
    ? Math.floor((mapWidth - (COLS - 1) * GAP) / COLS)
    : CELL;

  const stateVotes = useMemo(() => computeStateVotes(yeas, nays), [yeas, nays]);

  const grid = useMemo(() => {
    const g: Record<string, string> = {};
    STATE_TILES.forEach(([st, col, row]) => { g[`${col},${row}`] = st; });
    return g;
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Geo Map</Text>
        <Pressable onPress={() => setExpanded(v => !v)} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.toggle, { color: theme.primary }]}>{expanded ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>

      {expanded && (
        <>
          <Text style={styles.subtitle}>States colored by majority vote of their delegation</Text>
          <View style={styles.mapGrid} onLayout={onMapLayout}>
            {Array.from({ length: ROWS }, (_, r) => (
              <View key={r} style={styles.row}>
                {Array.from({ length: COLS }, (_, c) => {
                  const st = grid[`${c},${r}`];
                  if (!st) return <View key={c} style={{ width: dynamicCell, height: dynamicCell }} />;

                  const v: VoteTally = stateVotes[st] ?? 'UNKNOWN';
                  const bgColor =
                    v === 'YEA' ? YEA_COLOR + '40' :
                    v === 'NAY' ? NAY_COLOR + '40' :
                    SPLIT_COLOR + '33';
                  const borderColor =
                    v === 'YEA' ? YEA_COLOR + '88' :
                    v === 'NAY' ? NAY_COLOR + '88' :
                    SPLIT_COLOR + '55';
                  const textColor =
                    v === 'YEA' ? YEA_COLOR :
                    v === 'NAY' ? NAY_COLOR :
                    SPLIT_COLOR;

                  return (
                    <View key={c} style={[styles.cell, { width: dynamicCell, height: dynamicCell, backgroundColor: bgColor, borderColor }]}>
                      <Text style={[styles.cellText, { color: textColor, fontSize: Math.max(6, Math.floor(dynamicCell * 0.38)) }]}>{st}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.legend}>
            {[
              { color: YEA_COLOR,   label: 'Yea' },
              { color: NAY_COLOR,   label: 'Nay' },
              { color: SPLIT_COLOR, label: 'Split / No Data' },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color + '40', borderColor: color + '88' }]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title:    { fontSize: 14, fontWeight: '600', color: theme.text },
  subtitle: { fontSize: 11, color: theme.subtext, marginBottom: 10, fontWeight: '400' },
  toggle:   { fontSize: 13, fontWeight: '600' },
  mapGrid: { flexDirection: 'column', gap: GAP, marginBottom: 10 },
  row:     { flexDirection: 'row', gap: GAP },
  cell: {
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: { fontWeight: '700', letterSpacing: 0.1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2, borderWidth: 1 },
  legendLabel: { fontSize: 10, color: theme.subtext, fontWeight: '400' },
});
