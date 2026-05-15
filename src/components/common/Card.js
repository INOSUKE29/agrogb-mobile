import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function Card({ children, style, noPadding = false }) {
    return (
        <View style={[
            styles.card, 
            noPadding && { padding: 0 },
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme?.colors?.card || '#FFFFFF',
        borderRadius: theme?.metrics?.radius || 12,
        padding: theme?.spacing?.md || 16,
        marginBottom: theme?.spacing?.md || 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    }
});
