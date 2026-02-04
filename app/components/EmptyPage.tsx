import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const EmptyPage = () => {
    return (
        <View style={[styles.container, styles.card]}>
            <Image
                source={require('../../assets/images/bald-eagle-huh.jpg')}
                style={styles.image}
                resizeMode="contain"
            />
            <Text style={styles.text}>NOTHING FOUND</Text>
        </View>
    );
};

export default EmptyPage;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    image: {
        width: 230,
        height: 200,
        marginBottom: 0,
        borderRadius: 8,
    },
    text: {
        color: '#8B0000',
        fontFamily: 'Tinos_700Bold',
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#161616',
        width: '100%',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        marginVertical: 4,
    }
});