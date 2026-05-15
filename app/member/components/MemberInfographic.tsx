import AccentCard from "@/app/components/AccentCard";
import { ThemeContext } from "@/app/theme/themeContext";
import { memo, useCallback, useContext, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export type VoteType = 'yea' | 'nay' | 'pres' | 'novt';

interface Props {
  node: any;
  handlePress: () => void;
  voteType?: VoteType | null;
}

function computeInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getPartyInfo(party: string | null | undefined): { name: string; color: string } {
  if (!party) return { name: '', color: '#9ca3af' };
  const p = party.trim().charAt(0).toUpperCase();
  if (p === 'R' ) return { name: 'Republican', color: '#ef4444' };
  if (p === 'D' || p === 'DEM') return { name: 'Democratic',  color: '#3b82f6' };
  if (p === 'I' || p === 'IND') return { name: 'Independent', color: '#9ca3af' };
  if (p === 'L' || p === 'LIB') return { name: 'Libertarian', color: '#f59e0b' };
  if (p === 'G' || p === 'GRN') return { name: 'Green',       color: '#22c55e' };
  return { name: party, color: '#9ca3af' };
}

const VOTE_BADGE: Record<VoteType, { label: string; color: string; bg: string }> = {
  yea:  { label: 'YEA',     color: '#22c55e', bg: 'rgba(34,197,94,0.15)'   },
  nay:  { label: 'NAY',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  pres: { label: 'PRESENT', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  novt: { label: 'NO VOTE', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const MemberInfographic = ({ node, handlePress, voteType }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const fullName  = useMemo(() => node?.member?.fullName ?? node?.member__full_name ?? 'Unknown', [node?.member?.fullName, node?.member__full_name]);
  const imageUrl  = useMemo(() => node?.member?.imageLink ?? node?.member__image_link ?? null, [node?.member?.imageLink, node?.member__image_link]);
  const initials  = useMemo(() => computeInitials(fullName), [fullName]);
  const imgSource = useMemo(() => (imageUrl ? { uri: imageUrl } : undefined), [imageUrl]);
  const districtNum = node?.district_num ?? node?.districtNum ?? null;

  const onPress = useCallback(() => { handlePress?.(); }, [handlePress]);
  const { name: partyName, color: partyColor } = useMemo(
    () => getPartyInfo(node?.party),
    [node?.party],
  );
  const badge = voteType ? VOTE_BADGE[voteType] : null;  

  return (
    <AccentCard accentColor={partyColor} style={{ marginBottom: 0 }}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.avatarWrap}>
          {imgSource ? (
            <Image source={imgSource} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
          <Text style={styles.subText} numberOfLines={1} ellipsizeMode="tail">
            {node?.state ?? ''}{districtNum !== null ? `-${districtNum}` : ''}
            {partyName ? (
              <>
                {' · '}
                <Text style={{ color: partyColor }}>{partyName}</Text>
              </>
            ) : null}
          </Text>
        </View>
        {badge && (
          <View style={[styles.voteBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.voteBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
      </Pressable>
    </AccentCard>
  );
};

export default memo(MemberInfographic);

const createStyles = (theme: any) => StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 56,
    height: 56,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7c7e81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: theme.subtext,
     fontWeight: '600',
      fontSize: 16 
    },
  textWrap: {
    flex: 1,
    justifyContent: 'center' 
  },
  text:    {
    fontSize: 16, 
    color: theme.text,    
    fontWeight: '600' 
  },
  subText: {
    fontSize: 13,
    color: theme.subtext,
    marginTop: 2,
    fontWeight: '400',
  },
  voteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    flexShrink: 0,
    alignSelf: 'center',
  },
  voteBadgeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    letterSpacing: 0.5 
  },
});
