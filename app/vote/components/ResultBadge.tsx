import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  result: string;
}

export default function ResultBadge({result}: Props) {

    const resultPassed = typeof result === 'string' && /pass|yea|aye|agreed|accepted/i.test(result);
    const resultFailed = typeof result === 'string' && /fail|nay|no|rejected|defeated/i.test(result);
    return (
        <View style={[styles.resultBadge, resultPassed ? styles.passed : resultFailed ? styles.failed : styles.neutral]}>
        <Text style={styles.resultText} numberOfLines={1} ellipsizeMode="tail">{result ?? '—'}</Text>
        </View>
  );
}

const styles = StyleSheet.create({
    resultBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        color: '#fff',
        fontWeight: '700',
        alignSelf: 'flex-start',
    },
    resultText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    passed: { backgroundColor: '#16A34A' },
    failed: { backgroundColor: '#EF4444' },
    neutral: { backgroundColor: '#6B7280' },
});
