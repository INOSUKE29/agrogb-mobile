import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AgronomistCadernoScreen({ route, navigation }) {
    const { clientId, clientName } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState([]);
    const [filter, setFilter] = useState('TODOS');

    const FILTERS = ['TODOS', 'COLHEITA', 'PLANTIO', 'ANOTAÇÃO'];

    useEffect(() => {
        // Simulando busca do caderno via Nuvem (Supabase)
        const fetchRemoteTimeline = async () => {
            setLoading(true);
            setTimeout(() => {
                setTimeline([
                    { uuid: '1', tipo: 'PLANTIO', data: new Date().toISOString(), descricao: 'Café Mundo Novo (5ha)', observacao: 'Área do talhão principal, sem intercorrências iniciais.' },
                    { uuid: '2', tipo: 'ANOTAÇÃO', data: new Date(Date.now() - 86400000).toISOString(), descricao: 'Nota do Produtor', observacao: 'Chuva forte hoje, medir índice pluviométrico amanhã cedo.' },
                    { uuid: '3', tipo: 'COLHEITA', data: new Date(Date.now() - 172800000).toISOString(), descricao: 'Café Conilon (1200kg)', observacao: 'Grãos de excelente qualidade.' }
                ]);
                setLoading(false);
            }, 1000);
        };
        fetchRemoteTimeline();
    }, [clientId]);

    const getIconConfig = (tipo) => {
        switch (tipo) {
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
            case 'ANOTAÇÃO': return { name: 'document-text', color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.1)' };
            default: return { name: 'ellipse', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)' };
        }
    };

    const filteredTimeline = filter === 'TODOS' ? timeline : timeline.filter(t => t.tipo === filter);

    return (
        <SafeAreaView style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.headerTitle}>Monitoramento</Text>
                    <Text style={styles.headerSub}>{clientName || 'Cliente Selecionado'}</Text>
                </View>
                <View style={styles.readOnlyBadge}>
                    <Ionicons name="eye" size={14} color="#10B981" />
                    <Text style={styles.readOnlyText}>LEITURA</Text>
                </View>
            </View>

            {/* FILTROS */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {FILTERS.map(f => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* LISTA / TIMELINE */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Buscando registros da nuvem...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={styles.infoText}>
                            Diário oficial do produtor. Histórico financeiro foi ocultado por privacidade.
                        </Text>
                    </View>

                    {filteredTimeline.length === 0 ? (
                        <View style={styles.center}>
                            <Ionicons name="documents-outline" size={40} color="#334155" />
                            <Text style={styles.loadingText}>Nenhum registro encontrado.</Text>
                        </View>
                    ) : (
                        filteredTimeline.map((item, index) => {
                            const iconCfg = getIconConfig(item.tipo);
                            const d = new Date(item.data);
                            const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                            return (
                                <View key={item.uuid} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.dotBox, { backgroundColor: iconCfg.bg, borderColor: iconCfg.color }]}>
                                            <Ionicons name={iconCfg.name} size={15} color={iconCfg.color} />
                                        </View>
                                        {index < filteredTimeline.length - 1 && <View style={styles.lineTrail} />}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <Text style={styles.dateLabel}>{dateLabel}</Text>
                                        <View style={styles.glassCard}>
                                            <Text style={[styles.cardType, { color: iconCfg.color }]}>{item.tipo}</Text>
                                            <Text style={styles.cardDesc}>{item.descricao}</Text>
                                            {item.observacao ? (
                                                <View style={styles.obsBox}>
                                                    <Text style={styles.obsText}>"{item.observacao}"</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
    readOnlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    readOnlyText: { color: '#10B981', fontSize: 10, fontWeight: '900', marginLeft: 4, letterSpacing: 0.5 },
    
    filterWrapper: { padding: 15, borderBottomWidth: 1, borderColor: '#1E293B' },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
    filterPillActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' },
    filterText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
    filterTextActive: { color: '#3B82F6' },

    content: { padding: 20, paddingBottom: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    loadingText: { color: '#94A3B8', marginTop: 10, fontSize: 14 },
    infoBox: { flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 15, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
    infoText: { color: '#BFDBFE', fontSize: 13, lineHeight: 18, marginLeft: 10, flex: 1 },

    timelineRow: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { width: 40, alignItems: 'center', marginRight: 15 },
    dotBox: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: '#1E293B' },
    lineTrail: { width: 2, flex: 1, backgroundColor: '#334155', marginTop: -5, marginBottom: -10 },

    timelineContent: { flex: 1, paddingBottom: 25 },
    dateLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    glassCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
    cardType: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    cardDesc: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    obsBox: { marginTop: 10, backgroundColor: '#0F172A', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    obsText: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic', lineHeight: 18 }
});
