import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar as RNStatusBar, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, insertCadernoNota, getComercialMetrics, getProdutividadeMetrics } from '../database/database';

export default function CadernoCampoScreen({ navigation }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [notaTexto, setNotaTexto] = useState('');
    const [activeTab, setActiveTab] = useState('HISTORICO');

    // Comercial State
    const [comercialData, setComercialData] = useState({
        vendidoMes: 0, encPendentes: 0, metaMensal: 10000, frescoMes: 0, congeladoMes: 0, topClientes: []
    });

    // Produtividade & Encomendas State
    const [produtividadeData, setProdutividadeData] = useState({
        totalCaixas: 0, totalKg: 0, totalDescarte: 0, descartePerc: 0, kgPorPe: 0, topAreas: []
    });
    const [encomendasList, setEncomendasList] = useState([]);

    const loadTimeline = async () => {
        setLoading(true);
        try {
            // MOCK UNIFIED TIMELINE: Lendo Colheitas, Vendas, Custos, Plantio e Anotações
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
                SELECT 'PLANTIO' as tipo, data, cultura || ' (' || quantidade_pes || ' area/pes)' as descricao, observacao
                FROM plantio WHERE is_deleted = 0
                UNION ALL
                SELECT 'ANOTAÇÃO' as tipo, data, 'Nota Manual' as descricao, observacao
                FROM caderno_notas WHERE is_deleted = 0
                ORDER BY data DESC
                LIMIT 50
            `;

            const res = await executeQuery(query);
            const data = [];
            for (let i = 0; i < res.rows.length; i++) {
                data.push(res.rows.item(i));
            }
            setTimeline(data);

            const metrics = await getComercialMetrics();
            setComercialData(metrics);

            const prodData = await getProdutividadeMetrics();
            setProdutividadeData(prodData);

            const resOrders = await executeQuery(`
                SELECT o.*, c.nome as cliente_nome, p.nome as produto_nome
                FROM orders o
                LEFT JOIN clientes c ON o.cliente_id = c.uuid
                LEFT JOIN cadastro p ON o.produto_id = p.uuid
                WHERE o.is_deleted = 0
                ORDER BY 
                    CASE o.status
                        WHEN 'PENDENTE' THEN 1
                        WHEN 'PARCIAL' THEN 2
                        WHEN 'CONCLUIDA' THEN 3
                        ELSE 4
                    END,
                    o.data_prevista ASC
                LIMIT 5
            `);
            const ordersArray = [];
            for (let i = 0; i < resOrders.rows.length; i++) ordersArray.push(resOrders.rows.item(i));
            setEncomendasList(ordersArray);

        } catch (e) {
            console.error('Timeline Error:', e);
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

    const handleSaveNota = async () => {
        if (!notaTexto.trim()) {
            Alert.alert('Aviso', 'Escreva algo para salvar.');
            return;
        }
        try {
            await insertCadernoNota({
                observacao: notaTexto.trim(),
                data: new Date().toISOString()
            });
            setNotaTexto('');
            setModalVisible(false);
            loadTimeline();
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível salvar a anotação.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDENTE': return '#F59E0B';
            case 'PARCIAL': return '#3B82F6';
            case 'CONCLUIDA': return '#10B981';
            case 'CANCELADA': return '#EF4444';
            default: return '#6B7280';
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
                    {/* TABS */}
                    <View style={styles.tabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {['HISTORICO', 'COMERCIAL', 'PRODUTIVIDADE', 'ENCOMENDAS'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                        {tab === 'HISTORICO' ? 'Histórico' : tab === 'COMERCIAL' ? 'Comercial' : tab === 'PRODUTIVIDADE' ? 'Produtividade' : 'Encomendas'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {activeTab === 'HISTORICO' && (
                        timeline.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="journal-outline" size={60} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Nenhum registro no caderno ainda.</Text>
                                <Text style={styles.emptySub}>Comece lançando colheitas, vendas ou compras.</Text>
                            </View>
                        ) : (
                            timeline.map((item, index) => {
                                const iconConfig = getIcon(item.tipo);
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
                                            <Text style={styles.dateText}>{dateLabel ? dateLabel.split('-').reverse().join('/') : '--'}</Text>
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
                        )
                    )}

                    {activeTab === 'COMERCIAL' && (
                        <View style={styles.comercialContainer}>

                            <View style={styles.kpiRow}>
                                <View style={[styles.kpiCard, { backgroundColor: '#10B981' }]}>
                                    <Text style={styles.kpiLabel}>VENDIDO (MÊS)</Text>
                                    <Text style={styles.kpiValue}>R$ {comercialData.vendidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                </View>
                                <View style={[styles.kpiCard, { backgroundColor: '#F59E0B' }]}>
                                    <Text style={styles.kpiLabel}>ENC. PENDENTES</Text>
                                    <Text style={styles.kpiValue}>R$ {comercialData.encPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                </View>
                            </View>

                            {/* META PROGRESSO */}
                            <View style={styles.insightBox}>
                                <Text style={styles.boxTitle}>META MENSAL DE FATURAMENTO</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaText}>Progresso</Text>
                                    <Text style={styles.metaTextVal}>
                                        {((comercialData.vendidoMes / comercialData.metaMensal) * 100).toFixed(1)}% de R$ {comercialData.metaMensal}
                                    </Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min((comercialData.vendidoMes / comercialData.metaMensal) * 100, 100)}%` }]} />
                                </View>
                            </View>

                            {/* PROPORÇÃO FRESCO VS CONGELADO */}
                            <View style={styles.insightBox}>
                                <Text style={styles.boxTitle}>TIPO DE COLHEITA (MÊS)</Text>
                                <View style={styles.pizzaBarBg}>
                                    <View style={[styles.pizzaFresco, { flex: comercialData.frescoMes || 1 }]} />
                                    <View style={[styles.pizzaCongelado, { flex: comercialData.congeladoMes || 0 }]} />
                                </View>
                                <View style={styles.legendRow}>
                                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendTxt}>Fresco ({comercialData.frescoMes}g/cx)</Text></View>
                                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendTxt}>Congelado ({comercialData.congeladoMes}kg)</Text></View>
                                </View>
                            </View>

                            {/* TOP CLIENTES */}
                            <View style={styles.insightBox}>
                                <Text style={styles.boxTitle}>TOP 3 CLIENTES</Text>
                                {comercialData.topClientes.length === 0 ? <Text style={styles.obsText}>Nenhuma venda no mês.</Text> :
                                    comercialData.topClientes.map((c, i) => (
                                        <View key={i} style={styles.clientRow}>
                                            <View style={styles.clientRank}><Text style={styles.clientRankTxt}>{i + 1}º</Text></View>
                                            <Text style={styles.clientName}>{c.nome}</Text>
                                            <Text style={styles.clientVal}>R$ {c.total_comprado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                        </View>
                                    ))
                                }
                            </View>

                        </View>
                    )}

                    {activeTab === 'PRODUTIVIDADE' && (
                        <View style={styles.comercialContainer}>
                            <View style={styles.kpiRow}>
                                <View style={[styles.kpiCard, { backgroundColor: '#8B5CF6' }]}>
                                    <Text style={styles.kpiLabel}>TOTAL COLHIDO (MÊS)</Text>
                                    <Text style={styles.kpiValue}>{produtividadeData.totalCaixas} cx</Text>
                                    <Text style={{ color: '#EDE9FE', fontSize: 11, marginTop: 2 }}>{produtividadeData.totalKg} kg</Text>
                                </View>
                                <View style={[styles.kpiCard, { backgroundColor: '#EF4444' }]}>
                                    <Text style={styles.kpiLabel}>PERDA / DESCARTE</Text>
                                    <Text style={styles.kpiValue}>{produtividadeData.descartePerc}%</Text>
                                    <Text style={{ color: '#FEE2E2', fontSize: 11, marginTop: 2 }}>{produtividadeData.totalDescarte} kg total</Text>
                                </View>
                            </View>

                            <View style={styles.insightBox}>
                                <Text style={styles.boxTitle}>EFICIÊNCIA AGRÍCOLA (MÊS)</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaText}>Rendimento Padrão</Text>
                                    <Text style={styles.metaTextVal}>{produtividadeData.kgPorPe} kg/pé</Text>
                                </View>
                            </View>

                            <View style={styles.insightBox}>
                                <Text style={styles.boxTitle}>RANKING ÁREA/TALHÃO (MÊS)</Text>
                                {produtividadeData.topAreas.length === 0 ? <Text style={styles.obsText}>Nenhuma colheita no mês associada a áreas.</Text> :
                                    produtividadeData.topAreas.map((a, i) => (
                                        <View key={i} style={styles.clientRow}>
                                            <View style={[styles.clientRank, { backgroundColor: '#EDE9FE' }]}><Text style={[styles.clientRankTxt, { color: '#8B5CF6' }]}>{i + 1}º</Text></View>
                                            <Text style={styles.clientName}>{a.nome}</Text>
                                            <Text style={[styles.clientVal, { color: '#8B5CF6' }]}>{a.total_colhido} kg</Text>
                                        </View>
                                    ))
                                }
                            </View>
                        </View>
                    )}

                    {activeTab === 'ENCOMENDAS' && (
                        <View style={styles.comercialContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.boxTitle, { marginBottom: 0 }]}>PRÓXIMAS ENTREGAS (TOP 5)</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Encomendas')}>
                                    <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>Ver Todas</Text>
                                </TouchableOpacity>
                            </View>

                            {encomendasList.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="cube-outline" size={60} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>Sem Encomendas Pendentes.</Text>
                                </View>
                            ) : (
                                encomendasList.map((item, i) => (
                                    <View key={i} style={[styles.card, { marginBottom: 10, padding: 12 }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <Text style={[styles.clientName, { fontSize: 14 }]}>{item.cliente_nome}</Text>
                                            <View style={[styles.tipoBadge, { backgroundColor: getStatusColor(item.status), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, color: '#FFF' }]}>
                                                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>{item.status}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: '#4B5563' }}>📦 {item.produto_nome}</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                                            <Text style={{ fontSize: 11, color: '#6B7280' }}>Previsto: {item.data_prevista || '--'}</Text>
                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>Restam: {item.quantidade_restante} {item.unidade}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* FAB MANUAIS */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="pencil" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* MODAL NOVA NOTA */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nova Anotação de Campo</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.inputArea}
                            placeholder="Descreva observações, anomalias climáticas ou lembretes da lavoura..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                            value={notaTexto}
                            onChangeText={setNotaTexto}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNota}>
                            <Text style={styles.saveBtnText}>Salvar no Caderno</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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

    // Tabs
    tabsContainer: { marginBottom: 20 },
    tab: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 10 },
    tabActive: { backgroundColor: '#10B981' },
    tabText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    tabTextActive: { color: '#FFF' },

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
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, minHeight: 300 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    inputArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 15, height: 120, fontSize: 16, color: '#1F2937', marginBottom: 20 },
    saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Comercial
    comercialContainer: { paddingBottom: 20 },
    kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    kpiCard: { flex: 1, borderRadius: 12, padding: 15, elevation: 2 },
    kpiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    kpiValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    insightBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
    boxTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 12, letterSpacing: 1 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metaText: { fontSize: 13, color: '#4B5563', fontWeight: 'bold' },
    metaTextVal: { fontSize: 13, color: '#10B981', fontWeight: '900' },
    progressBarBg: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: 12, backgroundColor: '#10B981', borderRadius: 6 },
    pizzaBarBg: { height: 20, flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
    pizzaFresco: { backgroundColor: '#10B981' },
    pizzaCongelado: { backgroundColor: '#3B82F6' },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendTxt: { fontSize: 12, color: '#6B7280', fontWeight: 'bold' },
    clientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    clientRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    clientRankTxt: { fontSize: 10, fontWeight: 'bold', color: '#6B7280' },
    clientName: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    clientVal: { fontSize: 14, fontWeight: '900', color: '#10B981' }
});
