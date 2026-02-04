import { starBill, unstarBill } from '@/app/api/bills';
import { useStarredBillsStore } from '@/app/store/starredBillsStore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
  billId: string | number;
  size?: number;
  style?: ViewStyle | any;
  onChange?: (isStarred: boolean) => void;
};

export default function StarButton({ billId, size = 22, style, onChange }: Props) {
  const id = String(billId);
  const stars = useStarredBillsStore((s) => s.stars);
  const addStar = useStarredBillsStore((s) => s.addStar);
  const removeStar = useStarredBillsStore((s) => s.removeStar);
  const isStarred = stars.includes(id);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (isStarred) {
        const ret = await unstarBill(id);
        if (ret?.status !== "unstarred") return;
        removeStar(id);
        onChange?.(false);
      } else {
        const ret = await starBill(id);
        if (ret?.status == "starred" || ret?.error?.__all__?.[0]?.includes('already exists')) {
          addStar(id);
          onChange?.(true);
          return;
        }
        Alert.alert('Star limit reached', 'You have reached the maximum number of starred bills.');
        return;
      }
    } catch (e) {
      // ignore network errors; optimistic update already applied
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.btn, style]} accessibilityLabel={isStarred ? 'Unstar' : 'Star'}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={[styles.star, { fontSize: size, color: isStarred ? '#f59e0b' : '#9CA3AF' }]}>
          {isStarred ? '★' : '☆'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    lineHeight: 20,
  },
});
