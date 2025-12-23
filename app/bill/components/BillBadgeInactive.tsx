import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  billNum: number;
}

function getBillIdentifier(billNum: number): string {
  interface TypeMap {
    [key: number]: string;
  }

  const types: TypeMap = {
    0: 'S',
    1: 'S.RES',
    2: 'S.J.RES',
    3: 'S.CON.RES',
    4: 'HR',
    5: 'H.RES',
    6: 'H.J.RES',
    7: 'H.CON.RES',
  };

  let indx: number;
  let num: string;
  const n = Number(billNum) || 0;
  if (n >= 100000000) {
    num = (n % 100000).toString();
    indx = Math.floor(n / 100000) % 10;
  } else {
    num = (n % 10000).toString();
    indx = Math.floor(n / 10000) % 10;
  }
  return `${types[indx]}-${num}`;
}

export default function BillBadgeInactive({billNum}: Props) {
  const label = getBillIdentifier(billNum);
  return (
    <View style={styles.billBadge}>
      <Text style={styles.billBadgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  billBadge: {
    backgroundColor: '#0b1226',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  billBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
