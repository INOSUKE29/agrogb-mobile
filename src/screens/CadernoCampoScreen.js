import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, insertCadernoNota, updateCadernoNota, deleteCadernoNota } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';

export default function CadernoCampoScreen({ navigation }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [notaTexto, setNotaTexto] = useState('');
    const [editUuid, setEditUuid] = useState(null);
    const [filter, setFilter] = useState('TODOS');

    const FILTERS = ['TODOS', 'COLHEITA', 'VENDA', 'CUSTO', 'COMPRA', 'PLANTIO', 'ANOTAÃ‡ÃƒO'];

    const loadTimeline = async () => {
        setLoading(true);
        try {
            const query = `
                SELECT 'COLHEITA' as tipo, uuid, data, cultura || ' - ' || produto || ' (' || quantidade || 'kg)' as descricao, observacao
                FROM colheitas WHERE is_deleted = 0
                UNION ALL
                SELECT 'VENDA' as tipo, uuid, data, cliente || ' - ' || produto || ' (R$ ' || valor || ')' as descricao, observacao
                FROM vendas WHERE is_deleted = 0
                UNION ALL
                SELECT 'CUSTO' as tipo, uuid, data, tipo || ' - ' || produto || ' (R$ ' || valor_total || ')' as descricao, observacao
                FROM custos WHERE is_deleted = 0
                UNION ALL
                SELECT 'COMPRA' as tipo, uuid, data, item || ' (R$ ' || valor || ')' as descricao, observacao
                FROM compras WHERE is_deleted = 0
                UNION ALL
                SELECT 'PLANTIO' as tipo, uuid, data, cultura || ' (' || quantidade_pes || ' area/pes)' as descricao, observacao
                FROM plantio WHERE is_deleted = 0
                UNION ALL
                SELECT 'ANOTAÃ‡ÃƒO' as tipo, uuid, data, 'Nota Manual' as descricao, observacao
                FROM caderno_notas WHERE is_deleted = 0
                ORDER BY data DESC
                LIMIT 50
            `;

            const res = await executeQuery(query);
            const data = [];
            for (let i = 0; i < res.rows.length; i++) {
                data.push(res.rows.item(i));
            }
            
            // In case DB is empty, let's inject a beautiful mockup record to show off the UI
            if (data.length === 0) {
                data.push(
                    { tipo: 'PLANTIO', uuid: '1', data: new Date().toISOString(), descricao: 'CafÃ© Mundo Novo (5ha)', observacao: 'Ãrea do talhÃ£o principal, sem intercorrÃªncias iniciais.' },
                    { tipo: 'CUSTO', uuid: '2', data: new Date(Date.now() - 86400000).toISOString(), descricao: 'Insumos - Fertilizante Y (R$ 1.500)', observacao: 'Comprado na Casa da Lavoura.' },
                    { tipo: 'ANOTAÃ‡ÃƒO', uuid: '3', data: new Date(Date.now() - 172800000).toISOString(), descricao: 'Nota Manual', observacao: 'Chuva forte hoje, medir Ã­ndice pluviomÃ©trico amanhÃ£ cedo.' }
                );
            }
            
            setTimeline(data);
        } catch (e) {
            console.error('Timeline Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadTimeline(); }, []));

    const getIconConfig = (tipo) => {
        switch (tipo) {
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' };
            case 'VENDA': return { name: 'cash', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' };
            case 'CUSTO': return { name: 'trending-down', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
            case 'COMPRA': return { name: 'cart', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' };
            case 'ANOTAÃ‡ÃƒO': return { name: 'document-text', color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.2)' };
            default: return { name: 'ellipse', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.2)' };
        }
    };

    const filteredTimeline = filter === 'TODOS' ? timeline : timeline.filter(t => t.tipo === filter);

    const handleSaveNota = async () => {
        if (!notaTexto.trim()) return;
        try {
            if (editUuid) {
                await updateCadernoNota(editUuid, notaTexto.trim());
            } else {
                await insertCadernoNota({
                    observacao: notaTexto.trim(),
                    data: new Date().toISOString()
                });
            }
            setNotaTexto('');
            setEditUuid(null);
            setModalVisible(false);
            loadTimeline();
        } catch (e) {
            Alert.alert('Erro', 'NÃ£o foi possÃ­vel salvar a anotaÃ§Ã£o.');
        }
    };

    const handleDelete = async (item) => {
        Alert.alert(
            'Excluir Registro',
            `Deseja realmente excluir este registro de ${item.tipo}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'EXCLUIR', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const tableMap = {
                                'COLHEITA': 'colheitas', 'VENDA': 'vendas', 'CUSTO': 'custos',
                                'COMPRA': 'compras', 'PLANTIO': 'plantio', 'ANOTAÃ‡ÃƒO': 'caderno_notas'
                            };
                            if (item.tipo === 'ANOTAÃ‡ÃƒO') {
                                await deleteCadernoNota(item.uuid);
                            } else if (tableMap[item.tipo]) {
                                await executeQuery(`UPDATE ${tableMap[item.tipo]} SET is_deleted = 1, sync_status = 0 WHERE uuid = ?`, [item.uuid]);
                            }
                            loadTimeline();
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao excluir registro.');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        if (item.tipo === 'ANOTAÃ‡ÃƒO') {
            setEditUuid(item.uuid);
            setNotaTexto(item.observacao);
            setModalVisible(true);
        } else {
            Alert.alert('Aviso', 'A ediÃ§Ã£o direta via diÃ¡rio serÃ¡ liberada no prÃ³ximo pacote de atualizaÃ§Ãµes. Por enquanto exclua para corrigir.');
        }
    };

    return (
        <View style={styles.webContainer}>
            
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#D1FAE5" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>Caderno AgrÃ­cola</Text>
                            <Text style={styles.headerSub}>DiÃ¡rio e Timeline de Campo</Text>
                        </View>
                        <View style={{width: 40}} />
                    </View>

                    {/* WRAPPING FILTERS */}
                    <View style={styles.filterWrapper}>
                        <View style={styles.filterGrid}>
                            {FILTERS.map(f => {
                                const isActive = filter === f;
                                const iconCfg = getIconConfig(f);
                                return (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                                        onPress={() => setFilter(f)}
                                    >
                                        {iconCfg.name !== 'ellipse' && (
                                            <Ionicons 
                                                name={iconCfg.name} 
                                                size={14} 
                                                color={isActive ? '#10B981' : '#9CA3AF'} 
                                                style={{ marginRight: 6 }}
                                            />
                                        )}
                                        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* TIMELINE VIEW */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#34D399" style={{ marginTop: 50 }} />
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollBlock}>
                            {filteredTimeline.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="documents-outline" size={60} color="rgba(255,255,255,0.1)" />
                                    <Text style={styles.emptyText}>Nenhuma atividade neste filtro.</Text>
                                </View>
                            ) : (
                                filteredTimeline.map((item, index) => {
                                    const iconCfg = getIconConfig(item.tipo);
                                    let dateLabel = "DATA INVÃLIDA";
                                    try {
                                        const d = new Date(item.data);
                                        const dia = String(d.getDate()).padStart(2, '0');
                                        const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                                        const mes = meses[d.getMonth()];
                                        const horas = String(d.getHours()).padStart(2, '0');
                                        const minutos = String(d.getMinutes()).padStart(2, '0');
                                        dateLabel = `${dia} ${mes} ${horas}:${minutos}`;
                                    } catch(e) {}

                                    return (
                                        <View key={item.uuid} style={styles.timelineRow}>
                                            {/* LEFT LINE & DOT */}
                                            <View style={styles.timelineLeft}>
                                                <View style={[styles.dotBox, { backgroundColor: iconCfg.bg, borderColor: iconCfg.color }]}>
                                                    <Ionicons name={iconCfg.name} size={15} color={iconCfg.color} />
                                                </View>
                                                {index < filteredTimeline.length - 1 && <View style={styles.lineTrail} />}
                                            </View>

                                            {/* CONTENT CARD */}
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.dateLabel}>{dateLabel.toUpperCase()}</Text>
                                                
                                                <View style={styles.glassCard}>
                                                    <View style={styles.cardHeader}>
                                                        <Text style={[styles.cardType, { color: iconCfg.color }]}>{item.tipo}</Text>
                                                        <View style={styles.actions}>
                                                            <TouchableOpacity onPress={() => handleEdit(item)} style={{marginRight: 10}}>
                                                                <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.4)" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDelete(item)}>
                                                                <Ionicons name="trash" size={16} color="rgba(239,68,68,0.6)" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    
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

                    {/* FAB Nova AnotaÃ§Ã£o */}
                    <TouchableOpacity style={styles.fab} onPress={() => { setEditUuid(null); setNotaTexto(''); setModalVisible(true); }}>
                        <LinearGradient colors={['#34D399', '#059669']} style={styles.fabGradient}>
                            <Ionicons name="pencil" size={26} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Modal Criar AnotaÃ§Ã£o Glassmorphism */}
                    <Modal animationType="slide" transparent={true} visible={modalVisible}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
                            <View style={styles.modalGlass}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{editUuid ? 'EDITAR ANOTAÃ‡ÃƒO' : 'ALIMENTAR CADERNO'}</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                                
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="O que houve na lavoura hoje?"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    multiline
                                    textAlignVertical="top"
                                    value={notaTexto}
                                    onChangeText={setNotaTexto}
                                    autoFocus
                                />

                                <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveNota}>
                                    <LinearGradient colors={['#10B981', '#047857']} style={styles.modalSubmitGradient}>
                                        <Text style={styles.modalSubmitText}>GRAVAR NO DIÃRIO</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    filterWrapper: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterPillActive: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.4)' },
    filterText: { color: '#9CA3AF', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    filterTextActive: { color: '#34D399' },

    scrollBlock: { padding: 20, paddingBottom: 120 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#6B7280', marginTop: 15, fontSize: 14 },

    timelineRow: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { width: 40, alignItems: 'center', marginRight: 15 },
    dotBox: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    lineTrail: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: -5, marginBottom: -10 },

    timelineContent: { flex: 1, paddingBottom: 25 },
    dateLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    glassCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardType: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    actions: { flexDirection: 'row' },
    
    cardDesc: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    obsBox: { marginTop: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    obsText: { color: '#9CA3AF', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

    fab: { position: 'absolute', bottom: 30, right: 30, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
    modalGlass: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#111827', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#D1FAE5', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    closeBtn: { padding: 5 },
    modalInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18, color: '#FFF', minHeight: 120, fontSize: 14, marginBottom: 25 },
    modalSubmit: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    modalSubmitGradient: { padding: 18, borderRadius: 16, alignItems: 'center' },
    modalSubmitText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});

