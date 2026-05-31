import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function SettingItem({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    value, 
    type = 'chevron', 
    color,
    disabled = false
}) {
    const { colors } = useTheme();
    const itemColor = color || colors.primary;

    return (
        <TouchableOpacity 
            style={[styles.container, disabled && { opacity: 0.5 }]} 
            onPress={onPress}
            disabled={disabled || type === 'switch'}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: itemColor + '15' }]}>
                <Ionicons name={icon} size={20} color={itemColor} />
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
            </View>

            <View style={styles.actionContainer}>
                {type === 'switch' ? (
                    <Switch
                        value={!!value}
                        onValueChange={onPress}
                        trackColor={{ false: colors.glassBorder, true: itemColor + '40' }}
                        thumbColor={value ? itemColor : '#f4f3f4'}
                    />
                ) : type === 'text' ? (
                    <Text style={[styles.valueText, { color: colors.primary }]}>{value}</Text>
                ) : (
                    <View style={styles.chevronBox}>
                         {value && <Text style={[styles.valueText, { color: colors.textMuted, marginRight: 8 }]}>{value}</Text>}
                         <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 15,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    actionContainer: {
        marginLeft: 10,
        alignItems: 'flex-end',
    },
    valueText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chevronBox: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
