import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Modal, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowFAB from '../ui/GlowFAB';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import { v4 as uuidv4 } from 'uuid';

const TABS = ['CAMPO', 'PESQUISA'];
const CATEGORIAS = ['PRAGA', 'DOENÇA', 'NUTRIÇÃO', 'CLIMA', 'OUTROS'];
const SEVERIDADES = [
    { label: 'BAIXA', color: '#10B981', icon: 'check-circle-outline' },
    { label: 'MÉDIA', color: '#F59E0B', icon: 'alert-circle-outline' },
    { label: 'ALTA', color: '#EF4444', icon: 'alert-decagram-outline' }
];

export default function MonitoramentoScreen({ navigation }) {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('CAMPO');
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fieldNote, setFieldNote] = useState('');
    const [fieldLocal, setFieldLocal] = useState('');
    const [fieldCategoria, setFieldCategoria] = useState('OUTROS');
    const [fieldSeveridade, setFieldSeveridade] = useState('BAIXA');
    const [loading, setLoading] = useState(false);
    const [addModal, setAddModal] = useState(false);

    useFocusEffect(useCallback(() => {
        loadHistory();
    }, []));

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`SELECT * FROM monitoramento_entidade WHERE status != 'EXCLUIDO' ORDER BY data DESC LIMIT 50`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
        } finally { setLoading(false); }
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
        try {
            await executeQuery(
                `INSERT INTO monitoramento_entidade (uuid, cultura_id, data, observacao_usuario, status, nivel_confianca, severidade, categoria, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), fieldLocal.toUpperCase() || 'GERAL', new Date().toISOString(), fieldNote.toUpperCase(), 'CONFIRMADO', 'TÉCNICO', fieldSeveridade, fieldCategoria, new Date().toISOString(), new Date().toISOString()]
            );
            setFieldNote(''); setFieldLocal(''); setFieldCategoria('OUTROS'); setFieldSeveridade('BAIXA');
            setAddModal(false); loadHistory();
            showToast('Observação de campo salva!');
        } catch (e) {
            console.error('Erro ao salvar monitoramento:', e);
            Alert.alert('Erro', 'Falha ao salvar. Verifique se o banco está atualizado.');
        }
    };

    const getSeveridadeStyle = (sev) => {
        const s = SEVERIDADES.find(x => x.label === sev) || SEVERIDADES[0];
        return { color: s.color, icon: s.icon };
    };

    const renderItem = ({ item, index }) => {
        const sevStyle = getSeveridadeStyle(item.severidade);
        const isLast = index === history.length - 1;

        return (
            <View style={styles.timelineRow}>
                {/* LINHA DE TIMELINE */}
                <View style={styles.timelineSidebar}>
                    <View style={[styles.timelineDot, { backgroundColor: sevStyle.color }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />}
                </View>

                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder, flex: 1 }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerInfo}>
                            <View style={[styles.pill, { backgroundColor: sevStyle.color + '20', borderColor: sevStyle.color + '40' }]}>
                                <MaterialCommunityIcons name={sevStyle.icon} size={14} color={sevStyle.color} />
                                <Text style={[styles.pillText, { color: sevStyle.color }]}>{item.severidade}</Text>
                            </View>
                            <Text style={[styles.categoryPill, { color: colors.textMuted }]}>#{item.categoria}</Text>
                        </View>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </Text>
                    </View>

                    <Text style={[styles.localTitle, { color: colors.textPrimary }]}>{item.cultura_id || 'GERAL'}</Text>
                    <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={4}>
                        {item.observacao_usuario}
                    </Text>

                    <View style={styles.cardFooter}>
                        <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>REGISTRADO POR VOCÊ</Text>
                    </View>
                </GlowCard>
            </View>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader title="Monitoramento & Pragas" onBack={() => navigation.goBack()} />

            {/* TABS PREMIUM */}
            <View style={[styles.tabContainer, { backgroundColor: colors.card + '80' }]}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tabBtn, activeTab === t && { backgroundColor: colors.primary }]}
                        onPress={() => setActiveTab(t)}
                    >
                        <Text style={[styles.tabLabel, { color: activeTab === t ? '#FFF' : colors.textSecondary }]}>
                            {t === 'CAMPO' ? 'DIÁRIO' : 'PESQUISA'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'CAMPO' ? (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={history}
                        keyExtractor={item => item.uuid}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <MaterialCommunityIcons name="leaf-off-outline" size={64} color={colors.glassBorder} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum registro encontrado.</Text>
                            </View>
                        }
                    />
                    <GlowFAB icon="add" onPress={() => setAddModal(true)} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.searchContainer}>
                    <GlowCard style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                        <Text style={[styles.cardLabel, { color: colors.primary }]}>PESQUISA INTELIGENTE</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                            Busque soluções técnicas, bulas ou sintomas diretamente no Google com filtros agrícolas aplicados.
                        </Text>
                        <GlowInput
                            placeholder="Ex: Ferrugem asiática soja..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <PrimaryButton
                            label="PESQUISAR NO GOOGLE"
                            icon="search"
                            onPress={handleSearch}
                            style={{ marginTop: 10 }}
                        />
                    </GlowCard>

                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ATALHOS RÁPIDOS</Text>
                    <View style={styles.quickActions}>
                        {['Pragas Morango', 'Ferrugem Soja', 'Fungicidas Tomate', 'Carencia de Boro'].map(q => (
                            <TouchableOpacity
                                key={q}
                                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                                onPress={() => { setSearchQuery(q); handleSearch(); }}
                            >
                                <Ionicons name="search-outline" size={16} color={colors.primary} />
                                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* MODAL NOVO REGISTRO */}
            <Modal visible={addModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>NOVA OBSERVAÇÃO</Text>
                            <TouchableOpacity onPress={() => setAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>LOCAL / TALHÃO / CULTURA</Text>
                            <GlowInput
                                placeholder="EX: TALHÃO 02 - MORANGO"
                                value={fieldLocal}
                                onChangeText={t => setFieldLocal(t.toUpperCase())}
                            />

                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CATEGORIA</Text>
                            <View style={styles.selectorRow}>
                                {CATEGORIAS.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setFieldCategoria(cat)}
                                        style={[styles.selectorBtn, fieldCategoria === cat ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.glassBorder }]}
                                    >
                                        <Text style={[styles.selectorText, { color: fieldCategoria === cat ? '#FFF' : colors.textSecondary }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 10 }]}>SEVERIDADE</Text>
                            <View style={styles.selectorRow}>
                                {SEVERIDADES.map(sev => (
                                    <TouchableOpacity
                                        key={sev.label}
                                        onPress={() => setFieldSeveridade(sev.label)}
                                        style={[styles.sevBtn, fieldSeveridade === sev.label ? { backgroundColor: sev.color, borderColor: sev.color } : { borderColor: colors.glassBorder }]}
                                    >
                                        <MaterialCommunityIcons name={sev.icon} size={16} color={fieldSeveridade === sev.label ? '#FFF' : sev.color} />
                                        <Text style={[styles.selectorText, { color: fieldSeveridade === sev.label ? '#FFF' : colors.textPrimary }]}>{sev.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 15 }]}>OBSERVAÇÃO DETALHADA</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                                multiline
                                placeholder="Descreva os sintomas, pragas observadas ou ações tomadas..."
                                placeholderTextColor={colors.placeholder}
                                value={fieldNote}
                                onChangeText={t => setFieldNote(t.toUpperCase())}
                            />

                            <PrimaryButton label="SALVAR REGISTRO" onPress={handleSaveNote} style={{ marginTop: 20 }} />
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 15, borderRadius: 15, padding: 4, height: 48 },
    tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    tabLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },

    listContent: { padding: 20, paddingBottom: 100 },
    timelineRow: { flexDirection: 'row', gap: 15 },
    timelineSidebar: { alignItems: 'center', width: 20 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 22, zIndex: 2 },
    timelineLine: { position: 'absolute', top: 34, bottom: -15, width: 2, zIndex: 1 },

    card: { marginBottom: 15, padding: 18, borderRadius: 24, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, gap: 4 },
    pillText: { fontSize: 10, fontWeight: 'bold' },
    categoryPill: { fontSize: 10, fontWeight: 'bold' },
    dateText: { fontSize: 11, fontWeight: 'bold' },
    localTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    noteText: { fontSize: 13, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
    footerText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, fontSize: 14, fontWeight: 'bold' },

    searchContainer: { padding: 20 },
    searchCard: { padding: 22, borderRadius: 24, borderWidth: 1 },
    cardLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 15 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 25, marginBottom: 15, marginLeft: 5 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
    quickLabel: { fontSize: 12, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 5 },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    selectorBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    sevBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
    selectorText: { fontSize: 11, fontWeight: 'bold' },
    textArea: { height: 120, borderRadius: 16, padding: 15, fontSize: 14, textAlignVertical: 'top', borderWidth: 1 }
});
