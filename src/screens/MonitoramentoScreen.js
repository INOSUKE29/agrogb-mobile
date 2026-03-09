import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroFAB from '../ui/components/AgroFAB';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';
import { v4 as uuidv4 } from 'uuid';

const TABS = ['CAMPO', 'PESQUISA'];
const CATEGORIAS = ['PRAGA', 'DOENÇA', 'NUTRIÇÃO', 'CLIMA', 'OUTROS'];

export default function MonitoramentoScreen({ navigation }) {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('CAMPO');

    const SEVERIDADES = [
        { label: 'BAIXA', color: colors?.primary || '#10B981', icon: 'check-circle-outline' },
        { label: 'MÉDIA', color: colors?.warning || '#F59E0B', icon: 'alert-circle-outline' },
        { label: 'ALTA', color: colors?.danger || '#EF4444', icon: 'alert-decagram-outline' }
    ];

    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fieldNote, setFieldNote] = useState('');
    const [fieldLocal, setFieldLocal] = useState('');
    const [fieldCategoria, setFieldCategoria] = useState('OUTROS');
    const [fieldSeveridade, setFieldSeveridade] = useState('BAIXA');
    const [addModal, setAddModal] = useState(false);

    useFocusEffect(useCallback(() => { loadHistory(); }, []));

    const loadHistory = async () => {
        try {
            const res = await executeQuery(`SELECT * FROM monitoramento_entidade WHERE status != 'EXCLUIDO' ORDER BY data DESC LIMIT 50`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch { }
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
                <View style={styles.timelineSidebar}>
                    <View style={[styles.timelineDot, { backgroundColor: sevStyle.color }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>

                <Card style={[styles.card, { flex: 1 }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerInfo}>
                            <View style={[styles.pill, { backgroundColor: sevStyle.color + '15', borderColor: sevStyle.color + '30' }]}>
                                <MaterialCommunityIcons name={sevStyle.icon} size={14} color={sevStyle.color} />
                                <Text style={[styles.pillText, { color: sevStyle.color }]}>{item.severidade}</Text>
                            </View>
                            <Text style={[styles.categoryPill, { color: colors.textSecondary }]}>#{item.categoria}</Text>
                        </View>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </Text>
                    </View>

                    <Text style={[styles.localTitle, { color: colors.textPrimary }]}>{item.cultura_id || 'GERAL'}</Text>
                    <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={4}>
                        {item.observacao_usuario}
                    </Text>

                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                        <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>REGISTRADO POR VOCÊ</Text>
                    </View>
                </Card>
            </View>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader title="MONITORAMENTO & PRAGAS" onBack={() => navigation.goBack()} />

            <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                                <MaterialCommunityIcons name="leaf-off-outline" size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum registro encontrado.</Text>
                            </View>
                        }
                    />
                    <AgroFAB icon="add" onPress={() => setAddModal(true)} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.searchContainer} showsVerticalScrollIndicator={false}>
                    <Card style={styles.searchCard}>
                        <Text style={[styles.cardLabel, { color: colors.primary }]}>PESQUISA INTELIGENTE</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                            Busque soluções técnicas, bulas ou sintomas diretamente no Google com filtros agrícolas aplicados.
                        </Text>
                        <AgroInput
                            placeholder="Ex: Ferrugem asiática soja..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <AgroButton
                            title="PESQUISAR NO GOOGLE"
                            icon="search"
                            onPress={handleSearch}
                            style={{ marginTop: 10 }}
                        />
                    </Card>

                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ATALHOS RÁPIDOS</Text>
                    <View style={styles.quickActions}>
                        {['Pragas Morango', 'Ferrugem Soja', 'Fungicidas Tomate', 'Carencia de Boro'].map(q => (
                            <TouchableOpacity
                                key={q}
                                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => { setSearchQuery(q); handleSearch(); }}
                            >
                                <Ionicons name="search-outline" size={16} color={colors.primary} />
                                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            <Modal visible={addModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalContent} noPadding>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>NOVA OBSERVAÇÃO</Text>
                            <TouchableOpacity onPress={() => setAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25 }}>
                            <AgroInput
                                label="LOCAL / TALHÃO / CULTURA"
                                placeholder="EX: TALHÃO 02 - MORANGO"
                                value={fieldLocal}
                                onChangeText={t => setFieldLocal(t.toUpperCase())}
                            />

                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CATEGORIA</Text>
                            <View style={styles.selectorRow}>
                                {CATEGORIAS.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setFieldCategoria(cat)}
                                        style={[styles.selectorBtn, { borderColor: colors.border }, fieldCategoria === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    >
                                        <Text style={[styles.selectorText, { color: fieldCategoria === cat ? '#FFF' : colors.textSecondary }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 15 }]}>SEVERIDADE</Text>
                            <View style={styles.selectorRow}>
                                {SEVERIDADES.map(sev => (
                                    <TouchableOpacity
                                        key={sev.label}
                                        onPress={() => setFieldSeveridade(sev.label)}
                                        style={[styles.sevBtn, { borderColor: colors.border }, fieldSeveridade === sev.label && { backgroundColor: sev.color, borderColor: sev.color }]}
                                    >
                                        <MaterialCommunityIcons name={sev.icon} size={16} color={fieldSeveridade === sev.label ? '#FFF' : sev.color} />
                                        <Text style={[styles.selectorText, { color: fieldSeveridade === sev.label ? '#FFF' : colors.textPrimary }]}>{sev.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <AgroInput
                                label="OBSERVAÇÃO DETALHADA"
                                multiline
                                style={{ height: 120, marginTop: 15 }}
                                placeholder="Descreva os sintomas, pragas observadas ou ações tomadas..."
                                value={fieldNote}
                                onChangeText={t => setFieldNote(t.toUpperCase())}
                            />

                            <AgroButton title="SALVAR REGISTRO" onPress={handleSaveNote} icon="save" style={{ marginTop: 25 }} />
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </Card>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 15, borderRadius: 16, padding: 4, height: 52, borderWidth: 1.5 },
    tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    tabLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    listContent: { padding: 20, paddingBottom: 100 },
    timelineRow: { flexDirection: 'row', gap: 12 },
    timelineSidebar: { alignItems: 'center', width: 24, paddingLeft: 8 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 24, zIndex: 2 },
    timelineLine: { position: 'absolute', top: 34, bottom: -12, width: 2, zIndex: 1 },
    card: { marginBottom: 15, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, gap: 6 },
    pillText: { fontSize: 9, fontWeight: '900' },
    categoryPill: { fontSize: 10, fontWeight: '800' },
    dateText: { fontSize: 11, fontWeight: '800' },
    localTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    noteText: { fontSize: 13, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, borderTopWidth: 1.5, paddingTop: 10 },
    footerText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { marginTop: 15, fontSize: 14, fontWeight: 'bold' },
    searchContainer: { padding: 20 },
    searchCard: { padding: 20 },
    cardLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 15 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, gap: 10 },
    quickLabel: { fontSize: 12, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    selectorBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
    sevBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 },
    selectorText: { fontSize: 11, fontWeight: '800' },
});
