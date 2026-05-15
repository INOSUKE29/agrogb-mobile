import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MetricCard from '../common/MetricCard';

export default function KPIGrid({ kpis }) {
    if (!kpis || kpis.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>INDICADORES DE PERFORMANCE</Text>
            <View style={styles.grid}>
                {kpis.map((kpi) => (
                    <View key={kpi.id} style={styles.gridItem}>
                        <MetricCard 
                            title={kpi.title}
                            value={kpi.value}
                            icon={kpi.icon}
                            trend={kpi.trend}
                            trendType={kpi.trendType}
                            color={kpi.color}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 15,
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6B7280',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '50%',
        padding: 5,
    }
});
