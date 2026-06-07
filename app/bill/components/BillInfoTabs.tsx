import OverflowList from '@/app/components/OverflowList';
import MemberPill, { BillMember } from '@/app/member/components/MemberPill';
import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BillBadge from './BillBadge';

interface Props {
  sponsor?: BillMember | null;
  cosponsors?: BillMember[];
  subjects?: { name: string }[];
  policyArea?: string;
  relatedBills?: string[];
  navigation: any;
}

type TabId = 'SPONSOR' | 'SUBJECTS' | 'RELATED';
const TABS: TabId[] = ['SPONSOR', 'SUBJECTS', 'RELATED'];

export default function BillInfoTabs({ sponsor, cosponsors = [], subjects = [], policyArea, relatedBills = [], navigation }: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [tab, setTab] = useState<TabId>('SPONSOR');

  return (
    <View style={styles.card}>
      <View style={styles.tabStrip}>
        {TABS.map((t, i) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tab,
                active && styles.tabActive,
                active && i !== 0 && styles.tabActiveLeftBorder,
                active && i !== TABS.length - 1 && styles.tabActiveRightBorder,
              ]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tabContent}>
        {tab === 'SPONSOR' && (
          <View>
            <Text style={styles.sectionMeta}>SPONSOR</Text>
            {sponsor
              ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><MemberPill member={sponsor} /></View>
              : <Text style={styles.emptyText}>No sponsor information available</Text>
            }
            {cosponsors.length > 0 && (
              <>
                <Text style={[styles.sectionMeta, { marginTop: 16 }]}>COSPONSORS</Text>
                <OverflowList
                  title="COSPONSORS"
                  data={cosponsors}
                  keyExtractor={(c, i) => `${c.name}_${i}`}
                  renderItem={({ item: c }: { item: BillMember }) => (
                    <View style={{ marginBottom: 6 }}>
                      <MemberPill member={c} />
                    </View>
                  )}
                />
              </>
            )}
          </View>
        )}

        {tab === 'SUBJECTS' && (
          <View>
            {policyArea ? (
              <>
                <Text style={styles.sectionMeta}>POLICY AREA</Text>
                <Text style={[styles.policyAreaText, { color: theme.primary }]}>{policyArea}</Text>
                <Text style={[styles.sectionMeta, { marginTop: 14 }]}>SUBJECTS</Text>
              </>
            ) : (
              <Text style={styles.sectionMeta}>SUBJECTS</Text>
            )}
            {subjects.length > 0 ? (
              <OverflowList
                title="SUBJECTS"
                data={subjects}
                keyExtractor={(s, i) => `${s.name}_${i}`}
                renderItem={({ item: s }: { item: { name: string } }) => (
                  <View style={[styles.subjectChip, { marginBottom: 6 }]}>
                    <Text style={styles.subjectChipText}>{s.name}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyText}>No subjects listed</Text>
            )}
          </View>
        )}

        {tab === 'RELATED' && (
          <View>
            <Text style={styles.sectionMeta}>RELATED BILLS</Text>
            {relatedBills.length > 0 ? (
              <OverflowList
                title="RELATED BILLS"
                data={relatedBills}
                keyExtractor={(b, i) => `${b}_${i}`}
                renderItem={({ item: b }: { item: string }) => (
                  <View style={{ marginBottom: 6 }}>
                    <BillBadge navigation={navigation} billNum={Number(b)} />
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyText}>No related bills</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabStrip: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    backgroundColor: theme.background,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabActive: {
    // The card supplies the top + outer side borders (via its own border).
    // The active tab only "opens" its bottom edge into the content below.
    backgroundColor: theme.card,
    borderBottomWidth: 0,
  },
  tabActiveLeftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: theme.border,
    borderTopLeftRadius: 10,
  },
  tabActiveRightBorder: {
    borderRightWidth: 1,
    borderRightColor: theme.border,
    borderTopRightRadius: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.subtext,
  },
  tabLabelActive: {
    color: theme.primary,
  },
  tabContent: {
    padding: 14,
  },
  sectionMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.subtext,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  policyAreaText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  subjectChipText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.subtext,
    fontStyle: 'italic',
  },
});
