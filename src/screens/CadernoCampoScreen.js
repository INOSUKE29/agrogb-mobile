import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar as RNStatusBar, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';

export default function CadernoCampoScreen({ navigation }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTimeline = async () => {
        setLoading(true);
        try {
            // MOCK UNIFIED TIMELINE: Lendo Colheitas, Vendas, Custos, Plantio e Anotações Livres
            // Para simplificar a query SQLite (Que não suporta full FULL OUTER JOIN complexo de forma fácil), faremos UNION ALL

            const query = `
                SELECT 'COLHEITA' as tipo, data, cultura || ' - ' || produto || ' (' || quantidade || 'kg)' as descricao, observacao
                FROM colheitas WHERE is_deleted = 0
                UNION ALL
                SELECT 'VENDA' as tipo, data, cliente || ' - ' || produto || ' (R$ ' || valor || ')' as descricao, observacao
                FROM vendas WHERE is_deleted = 0
                UNION ALL
                SELECT 'CUSTO' as tipo, data, tipo || ' - ' || produto || ' (R$ ' || valor_total || ')' as descricao, observacao
                FROM custos WHERE is_deleted = 0
                UNION ALL
                SELECT 'COMPRA' as tipo, data, item || ' (R$ ' || valor || ')' as descricao, observacao
                FROM compras WHERE is_deleted = 0
                UNION ALL
                SELECT 'PLANTIO' as tipo, data, cultura || ' (' || area || ' ha)' as descricao, observacao
                FROM plantio WHERE is_deleted = 0
                ORDER BY data DESC
                LIMIT 50
            `;

            const res = await executeQuery(query);
            const data = [];
            for (let i = 0; i < res.rows.length; i++) {
                data.push(res.rows.item(i));
            }
            setTimeline(data);
        } catch (e) {
            console.error('Timeline Error:', e);
            // Ignorar erro se tabela plantio/anotacoes ainda n existir
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadTimeline(); }, []));

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: '#D1FAE5' };
            case 'VENDA': return { name: 'cash', color: '#3B82F6', bg: '#DBEAFE' };
            case 'CUSTO': return { name: 'trending-down', color: '#EF4444', bg: '#FEE2E2' };
            case 'COMPRA': return { name: 'cart', color: '#F59E0B', bg: '#FEF3C7' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: '#EDE9FE' };
            case 'ANOTAÇÃO': return { name: 'document-text', color: '#6B7280', bg: '#F3F4F6' };
            default: return { name: 'ellipse', color: '#9CA3AF', bg: '#F9FAFB' };
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#064E3B" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Caderno Agrícola</Text>
                    <Text style={styles.headerSub}>Histórico Cronológico Auto</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {timeline.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="journal-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Nenhum registro no caderno ainda.</Text>
                            <Text style={styles.emptySub}>Comece lançando colheitas, vendas ou anotações.</Text>
                        </View>
                    ) : (
                        timeline.map((item, index) => {
                            const iconConfig = getIcon(item.tipo);
                            // Simulação de formatação amigável de data
                            let dateLabel = item.data;
                            if (dateLabel && dateLabel.includes('T')) dateLabel = dateLabel.split('T')[0];

                            return (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                                            <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
                                        </View>
                                        {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <Text style={styles.dateText}>{dateLabel.split('-').reverse().join('/')}</Text>
                                        <View style={styles.card}>
                                            <View style={styles.cardTop}>
                                                <Text style={[styles.tipoBadge, { color: iconConfig.color }]}>{item.tipo}</Text>
                                            </View>
                                            <Text style={styles.descText}>{item.descricao}</Text>
                                            {item.observacao ? (
                                                <Text style={styles.obsText}>"{item.observacao}"</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* FAB MANUAIS */}
            <TouchableOpacity style={styles.fab} onPress={() => alert('Nota Manual entrará na Fase 5')}>
                <Ionicons name="pencil" size={24} color="#FFF" />
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { backgroundColor: '#064E3B', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: '#A7F3D0', fontSize: 12 },
    backBtn: { padding: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 100 },

    // Timeline
    timelineItem: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { alignItems: 'center', width: 40, marginRight: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: -5, marginBottom: -10 },

    timelineContent: { flex: 1, paddingBottom: 25 },
    dateText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 8 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    tipoBadge: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    descText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
    obsText: { fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6 },

    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 15 },
    emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },

    fab: {
        position: 'absolute', bottom: 30, right: 30,
        backgroundColor: '#10B981', width: 60, height: 60, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center', elevation: 5
    }
});
