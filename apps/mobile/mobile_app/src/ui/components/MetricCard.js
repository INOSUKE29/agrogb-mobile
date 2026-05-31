import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';

export const MetricCard = ({ icon, label, value, color }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconBox, { backgroundColor: (color || colors.primary || '#1E8E5A') + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    value: {
        fontSize: 16,
        fontWeight: TYPOGRAPHY.weight.black,
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: TYPOGRAPHY.weight.bold,
        textTransform: 'uppercase',
        textAlign: 'center',
        opacity: 0.9
    }
});
