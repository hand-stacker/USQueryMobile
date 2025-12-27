import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  result: string;
}

export default function ResultBadge({result}: Props) {

    const resultPassed = typeof result === 'string' && /pass|yea|aye/i.test(result);
    const resultFailed = typeof result === 'string' && /fail|nay|no|present/i.test(result);
    return (
        <View style={[styles.resultBadge, resultPassed ? styles.passed : resultFailed ? styles.failed : styles.neutral]}>
        <Text style={styles.resultText} numberOfLines={1} ellipsizeMode="tail">{result ?? '—'}</Text>
        </View>
  );
}

const styles = StyleSheet.create({
    resultBadge: {
        backgroundColor: '#6ebbeeff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
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
