import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface Props {
    status_type: boolean;
}


export default function BillStatus({status_type}: Props) {
  return (
    <Text style={[styles.statusPill, status_type ? styles.statusPassed : styles.statusFailed]}>
        {status_type ? "Passed" : "Still just a bill"}
    </Text>
  );
}

const styles = StyleSheet.create({
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        fontWeight: "700",
        fontSize: 16,
        color: "white",
        alignSelf: 'flex-start'
    },
    statusPassed: {
        backgroundColor: "#16A34A",
    },
    statusFailed: {
        backgroundColor: "#EF4444",
    },
});
