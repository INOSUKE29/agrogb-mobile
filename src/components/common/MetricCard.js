import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import Card from './Card';

export default function MetricCard({ title, value, icon, trend, trendType = 'up', color }) {
    const mainColor = color || theme?.colors?.primary || '#10B981';
    
    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${mainColor}15` }]}>
                    <Ionicons name={icon} size={20} color={mainColor} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trendType === 'up' ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Ionicons 
                            name={trendType === 'up' ? 'trending-up' : 'trending-down'} 
                            size={10} 
                            color={trendType === 'up' ? '#059669' : '#B91C1C'} 
                        />
                        <Text style={[styles.trendText, { color: trendType === 'up' ? '#059669' : '#B91C1C' }]}>
                            {trend}
                        </Text>
                    </View>
                )}
            </View>
            
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title.toUpperCase()}</Text>
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
        color: theme?.colors?.text || '#1F2937',
    },
    title: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme?.colors?.textMuted || '#6B7280',
        marginTop: 4,
        letterSpacing: 0.5,
    }
});
