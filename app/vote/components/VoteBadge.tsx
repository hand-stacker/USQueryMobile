import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  navigation?: any;
  voteId: number;
  allowBillNav?: boolean;
}

function navToBill(navigation: any, voteId: any, allowBillNav: boolean) {
  navigation.navigate("Vote_info", {vote_id: voteId, allowBillNav: allowBillNav});
}

export default function VoteBadge({navigation, voteId, allowBillNav = false}: Props) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <Pressable onPress={() => navToBill(navigation, voteId, allowBillNav)} style={styles.billBadge} accessibilityRole="button">
      <Text style={styles.billBadgeText}>Open Vote</Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  billBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  billBadgeText: {
    color: theme.innerText,
    fontWeight: '700',
    fontSize: 16,
  }
});