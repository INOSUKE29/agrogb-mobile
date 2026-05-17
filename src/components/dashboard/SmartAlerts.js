import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function SmartAlerts({ alerts, navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    if (!alerts || alerts.length === 0) return null;

    const getColors = (type) => {
        const isDark = theme?.theme_mode === 'dark';
        switch (type) {
            case 'danger': 
                return { 
                    bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', 
                    text: isDark ? '#F87171' : '#991B1B', 
                    icon: 'alert-circle', 
                    border: '#EF4444' 
                };
            case 'warning': 
                return { 
                    bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', 
                    text: isDark ? '#FBBF24' : '#92400E', 
                    icon: 'warning', 
                    border: '#F59E0B' 
                };
            default: 
                return { 
                    bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE', 
                    text: isDark ? '#60A5FA' : '#1E40AF', 
                    icon: 'information-circle', 
                    border: '#3B82F6' 
                };
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>ALERTAS INTELIGENTES</Text>
            {alerts.map((alert) => {
                const colors = getColors(alert.type);
                return (
                    <TouchableOpacity 
                        key={alert.id} 
                        style={[styles.alertCard, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
                        onPress={() => alert.screen && navigation.navigate(alert.screen)}
                    >
                        <Ionicons name={colors.icon} size={20} color={colors.text} style={styles.icon} />
                        <View style={styles.content}>
                            <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title.toUpperCase()}</Text>
                            <Text style={[styles.alertMsg, { color: colors.text }]}>{alert.message}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.text} opacity={0.5} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 15,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        borderLeftWidth: 5,
        elevation: 1,
    },
    icon: {
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 2,
    },
    alertMsg: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    }
});
