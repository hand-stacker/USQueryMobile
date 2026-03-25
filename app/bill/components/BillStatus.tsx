import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    status_type: boolean;
}


export default function BillStatus({status_type}: Props) {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
  return (
    <View style={styles.labelContainer}>
        <View style={[styles.labelBar, status_type ? styles.colorPassed : styles.colorFailed]} />
        <Text style={styles.label}>
            {status_type ? "Passed" : "Still just a bill"}
        </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    labelBar: {
        width: 4,
        height: 18,
        borderRadius: 2,
        marginRight: 8,
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 12,
        marginBottom: 8,
    },
    colorPassed: {
        backgroundColor: "#16A34A",
    },
    colorFailed: {
        backgroundColor: "#EF4444",
    },
    label: {
        fontSize: 16,
        color: theme.text,
        fontWeight: "700",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    }
});