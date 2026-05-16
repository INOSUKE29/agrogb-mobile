import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import { VictoryPie } from 'victory-native';

const { width } = Dimensions.get('window');

export default function CentroCustosScreen({ navigation }) {
    const { theme } = useTheme();
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const res = await executeQuery(
                'SELECT categoria, SUM(valor) as total FROM financeiro_transacoes WHERE tipo = "PAGAR" AND is_deleted = 0 GROUP BY categoria'
            );
            const rows = [];
            let sum = 0;
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                rows.push({ x: item.categoria, y: item.total });
                sum += item.total;
            }
            setData(rows);
            setTotal(sum);
        } catch (e) { console.error(e); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CENTRO DE CUSTOS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Distribuição percentual de despesas</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>ANÁLISE POR CATEGORIA</Text>
                    {data.length > 0 ? (
                        <View style={{ alignItems: 'center' }}>
                            <VictoryPie
                                data={data}
                                width={width * 0.8}
                                height={width * 0.8}
                                colorScale={["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#6B7280"]}
                                innerRadius={70}
                                labels={({ datum }) => `${datum.x}: ${((datum.y / total) * 100).toFixed(0)}%`}
                                style={{
                                    labels: { fontSize: 10, fontWeight: 'bold', fill: '#4B5563' }
                                }}
                            />
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>TOTAL GERAL</Text>
                                <Text style={styles.totalValue}>R$ {total.toLocaleString('pt-BR')}</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.empty}>Nenhum dado para exibir.</Text>
                    )}
                </Card>

                <Text style={styles.sectionTitle}>DETALHAMENTO</Text>
                {data.map((item, index) => (
                    <Card key={index} style={styles.catCard}>
                        <View style={styles.catRow}>
                            <View style={[styles.dot, { backgroundColor: ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#6B7280"][index % 6] }]} />
                            <Text style={styles.catName}>{item.x}</Text>
                            <Text style={styles.catValue}>R$ {item.y.toLocaleString('pt-BR')}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressInner, { width: `${(item.y / total) * 100}%`, backgroundColor: ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#6B7280"][index % 6] }]} />
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    chartCard: { padding: 20, alignItems: 'center' },
    chartTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 },
    totalContainer: { position: 'absolute', top: '45%', alignItems: 'center' },
    totalLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
    totalValue: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 25, marginBottom: 15 },
    catCard: { marginBottom: 10, padding: 15 },
    catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    catName: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#374151' },
    catValue: { fontSize: 13, fontWeight: '900', color: '#1F2937' },
    progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressInner: { height: '100%', borderRadius: 3 },
    empty: { marginTop: 30, color: '#9CA3AF', fontWeight: 'bold' }
});
