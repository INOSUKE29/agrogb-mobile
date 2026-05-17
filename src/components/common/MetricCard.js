import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from './Card';

export default function MetricCard({ title, value, icon, trend, trendType = 'up', color }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const mainColor = color || activeColors.primary || '#10B981';

    // Badge de tendência adaptativo (Alpha transparente)
    const trendBg = trendType === 'up' 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(239, 68, 68, 0.15)';
    
    const trendColor = trendType === 'up' 
        ? '#10B981' 
        : '#F87171';

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${mainColor}18` }]}>
                    <Ionicons name={icon} size={20} color={mainColor} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
                        <Ionicons 
                            name={trendType === 'up' ? 'trending-up' : 'trending-down'} 
                            size={10} 
                            color={trendColor} 
                        />
                        <Text style={[styles.trendText, { color: trendColor }]}>
                            {trend}
                        </Text>
                    </View>
                )}
            </View>
            
            <View style={styles.content}>
                <Text style={[styles.value, { color: activeColors.text || '#1F2937' }]}>
                    {value}
                </Text>
                <Text style={[styles.title, { color: activeColors.textMuted || '#6B7280' }]}>
                    {title.toUpperCase()}
                </Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 5,
        minWidth: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 10,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 20,
        gap: 4,
    },
    trendText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        marginTop: 5,
    },
    value: {
        fontSize: 20,
        fontWeight: '900',
    },
    title: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 0.5,
    }
});
