import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'; // v10.3-fresh-sync
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { RADIUS } from '../theme/radius';
import { SPACING } from '../theme/spacing';
import { SHADOWS } from '../theme/shadows';
import { TYPOGRAPHY } from '../theme/typography';

export const IconButton = ({ icon, label, onPress, size = 56 }) => {
    const { colors, isDark } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.wrapper}
        >
            <View style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                },
                !isDark && SHADOWS.light
            ]}>
                <View style={[
                    styles.iconCircle,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: colors.primary,
                    }
                ]}>
                    <Ionicons
                        name={icon}
                        size={size * 0.5}
                        color={colors.textOnPrimary || '#FFF'}
                    />
                </View>
                <Text
                    style={[
                        styles.label,
                        { color: colors.textPrimary }
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '33.33%',
        padding: SPACING.sm,
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
    },
    iconCircle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.bold,
        textAlign: 'center',
    }
});
