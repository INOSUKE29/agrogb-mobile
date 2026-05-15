import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import Card from '../common/Card';

export default function FinancialSummary({ revenue, expenses, netResult, trend, trendType }) {
    const formatCurrency = (val) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>RESUMO FINANCEIRO</Text>
                <View style={[styles.trendBadge, { backgroundColor: trendType === 'up' ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Ionicons 
                        name={trendType === 'up' ? 'arrow-up' : 'arrow-down'} 
                        size={12} 
                        color={trendType === 'up' ? '#059669' : '#B91C1C'} 
                    />
                    <Text style={[styles.trendText, { color: trendType === 'up' ? '#059669' : '#B91C1C' }]}>
                        {trend}%
                    </Text>
                </View>
            </View>

            <View style={styles.mainValueContainer}>
                <Text style={styles.mainLabel}>RESULTADO LÍQUIDO</Text>
                <Text style={[styles.mainValue, { color: netResult >= 0 ? '#10B981' : '#EF4444' }]}>
                    {formatCurrency(netResult)}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                    <View>
                        <Text style={styles.detailLabel}>RECEITAS</Text>
                        <Text style={styles.detailValue}>{formatCurrency(revenue)}</Text>
                    </View>
                </View>
                <View style={styles.detailItem}>
                    <View style={[styles.dot, { backgroundColor: '#F87171' }]} />
                    <View>
                        <Text style={styles.detailLabel}>DESPESAS</Text>
                        <Text style={styles.detailValue}>{formatCurrency(expenses)}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: -15, // Sobreposição sutil com o header
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6B7280',
        letterSpacing: 1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    mainValueContainer: {
        marginBottom: 20,
    },
    mainLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    mainValue: {
        fontSize: 28,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 15,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    detailLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    }
});
