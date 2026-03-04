import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Modal, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import GlowFAB from '../ui/GlowFAB';
import { DARK, MODAL_OVERLAY } from '../styles/darkTheme';

const TABS = ['CAMPO', 'PESQUISA'];

export default function MonitoramentoScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('CAMPO');
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fieldNote, setFieldNote] = useState('');
    const [fieldLocal, setFieldLocal] = useState('');
    const [loading, setLoading] = useState(false);
    const [addModal, setAddModal] = useState(false);

    useFocusEffect(useCallback(() => {
        loadHistory();
    }, []));

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`SELECT * FROM monitoramento_entidade ORDER BY data DESC LIMIT 50`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return Alert.alert('Atenção', 'Digite o que deseja pesquisar.');
        const query = encodeURIComponent(searchQuery.trim());
        const url = `https://www.google.com/search?q=${query}+agricultura+doença+praga`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) Linking.openURL(url);
        else Alert.alert('Erro', 'Não foi possível abrir o navegador.');
    };

    const handleSaveNote = async () => {
        if (!fieldNote.trim()) { Alert.alert('Atenção', 'Escreva uma observação.'); return; }
        const { v4: uuidv4 } = require('uuid');
        try {
            await executeQuery(
                `INSERT INTO monitoramento_entidade (uuid, cultura_id, data, observacao_usuario, status, nivel_confianca, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?)`,
                [uuidv4(), fieldLocal.toUpperCase() || 'GERAL', new Date().toISOString(), fieldNote.toUpperCase(), 'CONFIRMADO', 'TÉCNICO', new Date().toISOString(), new Date().toISOString()]
            );
            setFieldNote(''); setFieldLocal('');
            setAddModal(false); loadHistory();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    return (
        <AppContainer>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>MONITORAMENTO</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* TABS */}
            <View style={styles.tabBar}>
                {TABS.map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                        <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t === 'CAMPO' ? '📋 DIÁRIO DE CAMPO' : '🔍 PESQUISAR'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.glowLine} />

            {/* TAB: CAMPOS */}
            {activeTab === 'CAMPO' && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={history}
                        keyExtractor={i => i.uuid}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <GlowCard style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <View style={styles.pill}>
                                        <Text style={styles.pillText}>{new Date(item.data).toLocaleDateString('pt-BR').slice(0, 5)}</Text>
                                    </View>
                                    <Text style={styles.local}>{item.cultura_id || 'GERAL'}</Text>
                                </View>
                                <Text style={styles.note} numberOfLines={3}>{item.observacao_usuario}</Text>
                            </GlowCard>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="leaf-outline" size={56} color={DARK.glowBorder} />
                                <Text style={styles.emptyText}>Nenhum registro no diário.</Text>
                            </View>
                        }
                    />
                    <GlowFAB onPress={() => setAddModal(true)} icon="add" />
                </View>
            )}

            {/* TAB: PESQUISA */}
            {activeTab === 'PESQUISA' && (
                <View style={{ flex: 1, padding: 20 }}>
                    <GlowCard>
                        <Text style={styles.cardLabel}>PESQUISAR PRAGA / DOENÇA</Text>
                        <Text style={styles.cardDesc}>Digite o nome da praga, doença ou sintoma. O sistema abrirá uma busca no Google com foco em agricultura.</Text>
                        <GlowInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Ex: mancha foliar morango, ferrugem soja..."
                            style={{ marginTop: 12 }}
                        />
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            <Ionicons name="search" size={20} color="#061E1A" />
                            <Text style={styles.searchBtnText}>PESQUISAR NO GOOGLE</Text>
                        </TouchableOpacity>
                    </GlowCard>

                    <GlowCard style={{ marginTop: 16 }}>
                        <Text style={styles.cardLabel}>PESQUISAS RÁPIDAS</Text>
                        {['pragas morango', 'ferrugem soja', 'fungicida tomate', 'deficiência nitrogênio folha'].map(q => (
                            <TouchableOpacity key={q} style={styles.quickTag} onPress={() => { setSearchQuery(q); setActiveTab('PESQUISA'); }}>
                                <Ionicons name="search-circle-outline" size={16} color={DARK.glow} />
                                <Text style={styles.quickTagText}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </GlowCard>
                </View>
            )}

            {/* MODAL ADICIONAR NOTA */}
            <Modal visible={addModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                            <Text style={styles.modalTitle}>NOVO REGISTRO DE CAMPO</Text>
                            <TouchableOpacity onPress={() => setAddModal(false)}><Ionicons name="close" size={24} color={DARK.textMuted} /></TouchableOpacity>
                        </View>
                        <Text style={styles.fieldLabel}>LOCAL / CULTURA</Text>
                        <GlowInput placeholder="Ex: Talhão 1, Morango" value={fieldLocal} onChangeText={t => setFieldLocal(t.toUpperCase())} />
                        <Text style={styles.fieldLabel}>OBSERVAÇÃO</Text>
                        <GlowInput style={{ height: 90, textAlignVertical: 'top' }} multiline value={fieldNote} onChangeText={t => setFieldNote(t.toUpperCase())} placeholder="Descreva o que foi observado no campo..." />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                                <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                                <Text style={{ color: '#061E1A', fontWeight: 'bold' }}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '900', color: DARK.textPrimary, letterSpacing: 1 },
    glowLine: { height: 1, backgroundColor: DARK.glowLine },

    tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 2, backgroundColor: 'rgba(0,255,156,0.06)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: DARK.glowBorder },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: DARK.glow },
    tabText: { fontSize: 11, fontWeight: 'bold', color: DARK.textMuted },
    tabTextActive: { color: '#061E1A' },

    pill: { backgroundColor: 'rgba(0,255,156,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: DARK.glowBorder },
    pillText: { fontSize: 10, fontWeight: 'bold', color: DARK.glow },
    local: { fontSize: 13, fontWeight: 'bold', color: DARK.textPrimary },
    note: { fontSize: 13, color: DARK.textSecondary, lineHeight: 20 },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: DARK.textMuted, marginTop: 16, fontSize: 15 },

    cardLabel: { fontSize: 11, fontWeight: '900', color: DARK.glow, letterSpacing: 1.2, marginBottom: 10 },
    cardDesc: { fontSize: 13, color: DARK.textSecondary, lineHeight: 20, marginBottom: 6 },

    searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: DARK.glow, borderRadius: 14, paddingVertical: 14, gap: 10, marginTop: 12, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    searchBtnText: { color: '#061E1A', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    quickTag: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 10 },
    quickTagText: { color: DARK.textSecondary, fontSize: 13 },

    overlay: { flex: 1, backgroundColor: MODAL_OVERLAY, justifyContent: 'flex-end' },
    modal: { backgroundColor: DARK.modal, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: DARK.glowBorder },
    modalTitle: { fontSize: 14, fontWeight: '900', color: DARK.textPrimary },
    fieldLabel: { fontSize: 10, fontWeight: '800', color: DARK.textMuted, letterSpacing: 1, marginBottom: 6, marginTop: 12 },

    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
    saveBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: DARK.glow, alignItems: 'center', justifyContent: 'center', shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});
