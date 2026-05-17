import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

export default function FinancialSummary({ revenue, expenses, netResult, trend, trendType }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    const formatCurrency = (val) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Estilo da tag de tendência adaptativa
    const trendBg = trendType === 'up' 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(239, 68, 68, 0.15)';
    
    const trendColor = trendType === 'up' 
        ? '#10B981' 
        : '#F87171';

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: activeColors.textMuted || '#6B7280' }]}>RESUMO FINANCEIRO</Text>
                <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
                    <Ionicons 
                        name={trendType === 'up' ? 'arrow-up' : 'arrow-down'} 
                        size={12} 
                        color={trendColor} 
                    />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                        {trend}%
                    </Text>
                </View>
            </View>

            <View style={styles.mainValueContainer}>
                <Text style={[styles.mainLabel, { color: activeColors.textMuted || '#9CA3AF' }]}>RESULTADO LÍQUIDO</Text>
                <Text style={[styles.mainValue, { color: netResult >= 0 ? (activeColors.success || '#10B981') : (activeColors.error || '#EF4444') }]}>
                    {formatCurrency(netResult)}
                </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: activeColors.border || '#F3F4F6' }]}/ >

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <View style={[styles.dot, { backgroundColor: activeColors.success || '#10B981' }]} />
                    <View>
                        <Text style={[styles.detailLabel, { color: activeColors.textMuted || '#9CA3AF' }]}>RECEITAS</Text>
                        <Text style={[styles.detailValue, { color: activeColors.text || '#374151' }]}>{formatCurrency(revenue)}</Text>
                    </View>
                </View>
                <View style={styles.detailItem}>
                    <View style={[styles.dot, { backgroundColor: activeColors.error || '#F87171' }]} />
                    <View>
                        <Text style={[styles.detailLabel, { color: activeColors.textMuted || '#9CA3AF' }]}>DESPESAS</Text>
                        <Text style={[styles.detailValue, { color: activeColors.text || '#374151' }]}>{formatCurrency(expenses)}</Text>
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
        fontWeight: 'bold',
        marginBottom: 4,
    },
    mainValue: {
        fontSize: 28,
        fontWeight: '900',
    },
    divider: {
        height: 1,
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
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
