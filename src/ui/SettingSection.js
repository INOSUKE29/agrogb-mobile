import React from 'react';
import { COLORS } from '../styles/theme';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SettingSection({ title, children }) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase'
    },
    content: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    }
});
