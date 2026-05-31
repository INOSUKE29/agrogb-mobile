import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';

/**
 * DashboardContent - Painel Financeiro e Produtividade de BI 📊🌾
 * Apresenta KPIs e listagem de talhões com estilo luxo e contraste
 * calibrado em ambos os temas.
 */
export default function DashboardContent({ data }) {
    const { theme } = useTheme();
    const colors = theme?.colors || {};
    const { health = { receita: 0, despesa: 0, lucro: 0, margem: 0 }, productivity = [] } = data || {};

    const formattedReceita = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(health.receita);
    const formattedDespesa = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(health.despesa);
    const formattedLucro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(health.lucro);
    const formattedMargem = health.margem ? `${health.margem.toFixed(1)}%` : '0%';

    return (
        <View style={styles.container}>
            {/* KPI Grid */}
            <View style={styles.grid}>
                <View style={styles.col}>
                    <Card style={[styles.kpiCard, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
                        <Text style={styles.label}>RECEITA TOTAL</Text>
                        <Text style={[styles.val, { color: colors.success || '#10B981' }]}>{formattedReceita}</Text>
                    </Card>
                </View>
                <View style={styles.col}>
                    <Card style={[styles.kpiCard, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
                        <Text style={styles.label}>DESPESA TOTAL</Text>
                        <Text style={[styles.val, { color: colors.danger || '#EF4444' }]}>{formattedDespesa}</Text>
                    </Card>
                </View>
            </View>

            <View style={styles.grid}>
                <View style={styles.col}>
                    <Card style={[styles.kpiCard, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
                        <Text style={styles.label}>LUCRO LÍQUIDO</Text>
                        <Text style={[styles.val, { color: health.lucro >= 0 ? (colors.success || '#10B981') : (colors.danger || '#EF4444') }]}>{formattedLucro}</Text>
                    </Card>
                </View>
                <View style={styles.col}>
                    <Card style={[styles.kpiCard, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
                        <Text style={styles.label}>MARGEM ROI</Text>
                        <Text style={[styles.val, { color: colors.primary || '#A3E635' }]}>{formattedMargem}</Text>
                    </Card>
                </View>
            </View>

            {/* Produtividade por Talhão */}
            <Card style={[styles.prodCard, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
                <Text style={[styles.sectionTitle, { color: colors.text || '#FFF' }]}>Produtividade por Talhão</Text>
                {productivity && productivity.length > 0 ? (
                    productivity.map((item, index) => {
                        const prodVal = item.produtividade ? parseFloat(item.produtividade).toFixed(1) : '0';
                        return (
                            <View key={index} style={styles.prodRow}>
                                <View style={styles.rowInfo}>
                                    <Text style={[styles.talhaoName, { color: colors.text || '#FFF' }]}>{item.talhao}</Text>
                                    <Text style={styles.talhaoArea}>{item.area_ha} Ha</Text>
                                </View>
                                <View style={styles.rowValue}>
                                    <Text style={[styles.talhaoVal, { color: colors.primary || '#A3E635' }]}>{prodVal} Kg/Ha</Text>
                                    <Text style={styles.talhaoTotal}>{parseFloat(item.total_kg || 0).toLocaleString('pt-BR')} Kg</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.emptyText}>Nenhuma colheita registrada para calcular produtividade.</Text>
                )}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginTop: 10 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    col: { flex: 1 },
    kpiCard: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    label: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 4 },
    val: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
    prodCard: { padding: 20, marginTop: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 16 },
    prodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    rowInfo: { gap: 2 },
    talhaoName: { fontSize: 14, fontWeight: '800' },
    talhaoArea: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600' },
    rowValue: { alignItems: 'flex-end', gap: 2 },
    talhaoVal: { fontSize: 14, fontWeight: '900' },
    talhaoTotal: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600' },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginVertical: 10, fontWeight: '600' }
});
