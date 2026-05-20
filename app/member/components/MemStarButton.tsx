import { starMember, unstarMember } from '@/app/api/members';
import { navigate } from '@/app/navigation/navigationRef';
import { useFavoritesStore } from '@/app/store/favoriteSubjectsStore';
import { useStarredMembersStore } from '@/app/store/starredMembersStore';
import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  membershipId: string | number;
  style?: ViewStyle | any;
  onChange?: (isStarred: boolean) => void;
};

export default function MemStarButton({ membershipId, style, onChange }: Props) {
  const { theme } = useContext(ThemeContext);
  const loggedIn = useFavoritesStore(s => s.loggedIn);
  const id = String(membershipId);
  const stars = useStarredMembersStore((s) => s.stars);
  const addStar = useStarredMembersStore((s) => s.addStar);
  const removeStar = useStarredMembersStore((s) => s.removeStar);
  const limitReached = useStarredMembersStore((s) => s.limitReached);
  const setLimitReached = useStarredMembersStore((s) => s.setLimitReached);
  const isStarred = stars.includes(id);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (!loggedIn) {
      Alert.alert('Log in to save members', 'Create a free account to save and track members.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => navigate('Settings', { screen: 'Login' }) },
      ]);
      return;
    }
    if (!isStarred && limitReached) {
      Alert.alert('Save limit reached', 'You have reached the maximum number of saved members. Unsave a member to free up a spot, or upgrade your plan for more.');
      return;
    }
    setLoading(true);
    try {
      if (isStarred) {
        const ret = await unstarMember(id);
        if (ret?.status !== 'unstarred') return;
        removeStar(id);
        onChange?.(false);
      } else {
        const ret = await starMember(id);
        if (ret?.status === 'starred' || ret?.error?.__all__?.[0]?.includes('already exists')) {
          addStar(id);
          onChange?.(true);
          return;
        }
        setLimitReached(true);
        Alert.alert('Save limit reached', 'You have reached the maximum number of saved members. Unsave a member to free up a spot, or upgrade your plan for more.');
      }
    } catch (e) {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  if (!loggedIn) {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.pill, styles.loginPill, style]}
        accessibilityLabel="Log in to save"
      >
        <Text style={styles.loginText}>Log in to save</Text>
      </Pressable>
    );
  }

  const atLimit = !isStarred && limitReached;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.pill, isStarred ? styles.savedPill : atLimit ? styles.limitPill : styles.savePill, style]}
      accessibilityLabel={isStarred ? 'Unsave member' : atLimit ? 'Save limit reached' : 'Save member'}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isStarred ? '#fff' : theme.subtext} />
      ) : (
        <Text style={[styles.pillText, isStarred ? styles.savedText : atLimit ? styles.limitText : styles.saveText]}>
          {isStarred ? '★  Saved' : atLimit ? '☆  Limit reached' : '☆  Save'}
        </Text>
      )}
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPill: {
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: 'transparent',
  },
  savePill: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  savedPill: {
    backgroundColor: '#f59e0b',
    borderWidth: 0,
  },
  limitPill: {
    borderWidth: 1,
    borderColor: theme.subtext,
    backgroundColor: theme.secondary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  savedText: {
    color: '#fff',
  },
  saveText: {
    color: theme.subtext,
  },
  limitText: {
    color: theme.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
});
