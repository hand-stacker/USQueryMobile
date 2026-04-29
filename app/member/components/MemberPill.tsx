import { ThemeContext } from '@/app/theme/themeContext';
import { useContext } from 'react';
import { Text, View } from 'react-native';
import { getPartyInfo } from './MemberInfographic';

export interface BillMember {
  name: string;
  party: string;
  state: string;
}

export default function MemberPill({ member }: { member: BillMember }) {
  const { theme } = useContext(ThemeContext);
  const { name: partyName, color: partyColor } = getPartyInfo(member.party);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: partyColor + '55',
      backgroundColor: partyColor + '18',
    }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: partyColor }} />
      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.text }}>
        {member.name}
        {' · '}
        <Text style={{ color: partyColor, fontWeight: '700' }}>{partyName}</Text>
        {' - '}
        {member.state}
      </Text>
    </View>
  );
}
