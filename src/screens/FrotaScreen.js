import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertMaquina, getMaquinas, updateMaquinaRevisao, deleteMaquina, insertManutencaoFrota, getHistoricoManutencoes } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import GlowFAB from '../ui/GlowFAB';
import { DARK, MODAL_OVERLAY, GLOW_CARD_SHADOW } from '../styles/darkTheme';

export default function FrotaScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);

    const [nome, setNome] = useState('');
    const [placa, setPlaca] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [horimetro, setHorimetro] = useState('');
    const [revisao, setRevisao] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [servicoDesc, setServicoDesc] = useState('');
    const [servicoValor, setServicoValor] = useState('');
    const [novoHorimetro, setNovoHorimetro] = useState('');

    useEffect(() => { loadData(); }, []);

    const up = (t, setter) => setter(t.toUpperCase());

    const loadData = async () => {
        setLoading(true);
        try { const data = await getMaquinas(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Nome é obrigatório.');
        try {
            await insertMaquina({ uuid: uuidv4(), nome, tipo, placa, horimetro_atual: parseFloat(horimetro || 0), intervalo_revisao: parseFloat(revisao || 0) });
            setModalVisible(false); cleanForms(); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar veículo.'); }
    };

    const handleUpdateKM = async () => {
        if (!novoHorimetro.trim()) return;
        try {
            const currentItem = items.find(i => i.uuid === selectedId);
            await updateMaquinaRevisao(selectedId, parseFloat(novoHorimetro), currentItem ? currentItem.intervalo_revisao : 10000);
            setUpdateModalVisible(false); setNovoHorimetro(''); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao atualizar.'); }
    };

    const handleSaveService = async () => {
        if (!servicoDesc.trim()) return;
        try {
            await insertManutencaoFrota({ uuid: uuidv4(), maquina_uuid: selectedId, data: new Date().toLocaleDateString('pt-BR'), descricao: servicoDesc, valor: parseFloat(servicoValor.replace(',', '.') || 0) });
            setServiceModalVisible(false); setServicoDesc(''); setServicoValor('');
            Alert.alert('Sucesso', 'Manutenção registrada!');
        } catch (e) { Alert.alert('Erro', 'Falha ao registrar serviço.'); }
    };

    const deleteItem = (uuid) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não' }, { text: 'Sim', onPress: async () => { await deleteMaquina(uuid); loadData(); } }
        ]);
    };

    const cleanForms = () => { setNome(''); setPlaca(''); setTipo('TRATOR'); setHorimetro(''); setRevisao(''); };

    const getStatusColor = (h, r) => {
        const diff = r - h;
        if (diff < 0) return { text: DARK.danger, label: 'ATRASADO', bar: DARK.danger, border: 'rgba(255,59,59,0.3)' };
        if (diff < (r * 0.1)) return { text: DARK.warning, label: 'ATENÇÃO', bar: DARK.warning, border: 'rgba(245,158,11,0.3)' };
        return { text: DARK.glow, label: 'EM DIA', bar: DARK.glow, border: DARK.glowBorder };
    };

    const TIPOS = ['TRATOR', 'CARRO', 'CAMINHAO', 'OUTRO'];

    const modalContent = (title, children) => (
        <View style={styles.overlay}>
            <View style={styles.modal}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => { setModalVisible(false); setServiceModalVisible(false); setUpdateModalVisible(false); }}>
                        <Ionicons name="close" size={24} color={DARK.textMuted} />
                    </TouchableOpacity>
                </View>
                {children}
            </View>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Gestão de Frota" onBack={navigation?.goBack ? () => navigation.goBack() : null} />

            {loading ? <ActivityIndicator size="large" color={DARK.glow} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.uuid}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    renderItem={({ item }) => {
                        const isCar = ['CARRO', 'CAMINHAO', 'UTILITARIO'].includes(item.tipo);
                        const unit = isCar ? 'KM' : 'H';
                        const st = getStatusColor(item.horimetro_atual, item.intervalo_revisao);
                        const pct = Math.min(1, Math.max(0, item.horimetro_atual / (item.intervalo_revisao || 1)));
                        const remaining = item.intervalo_revisao - item.horimetro_atual;

                        return (
                            <GlowCard style={[styles.card, { borderColor: st.border }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconBox}>
                                        <Text style={{ fontSize: 22 }}>{isCar ? '🚘' : '🚜'}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.cardTitle}>{item.nome}</Text>
                                        <Text style={styles.cardSub}>{item.tipo}{item.placa ? ` • ${item.placa}` : ''}</Text>
                                    </View>
                                    <View style={[styles.badge, { borderColor: st.border }]}>
                                        <Text style={[styles.badgeText, { color: st.text }]}>{st.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.stats}>
                                    <Text style={[styles.statVal, { color: st.text }]}>{item.horimetro_atual} <Text style={styles.statUnit}>{unit}</Text></Text>
                                    <Text style={styles.statLabel}>Próx. Revisão: {item.intervalo_revisao} {unit}</Text>
                                </View>

                                <View style={styles.barBg}>
                                    <View style={[styles.barFill, { flex: pct, backgroundColor: st.bar }]} />
                                </View>
                                <Text style={[styles.remainText, { color: st.text }]}>
                                    {remaining >= 0 ? `Faltam ${remaining} ${unit}` : `Passou ${Math.abs(remaining)} ${unit}`}
                                </Text>

                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.actBtn} onPress={() => { setSelectedId(item.uuid); setUpdateModalVisible(true); }}>
                                        <Ionicons name="speedometer-outline" size={14} color={DARK.glow} />
                                        <Text style={[styles.actText, { color: DARK.glow }]}>ATUALIZAR {unit}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actBtn, { borderColor: 'rgba(0,255,156,0.4)' }]} onPress={() => { setSelectedId(item.uuid); setServiceModalVisible(true); }}>
                                        <Ionicons name="construct-outline" size={14} color={DARK.glow} />
                                        <Text style={[styles.actText, { color: DARK.glow }]}>SERVIÇO</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actBtn, { borderColor: 'rgba(255,59,59,0.3)', flex: 0.4 }]} onPress={() => deleteItem(item.uuid)}>
                                        <Ionicons name="trash-outline" size={16} color={DARK.danger} />
                                    </TouchableOpacity>
                                </View>
                            </GlowCard>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 40 }}>🚜</Text>
                            <Text style={styles.emptyText}>Nenhum veículo cadastrado.</Text>
                            <Text style={styles.emptySub}>Toque no + para adicionar.</Text>
                        </View>
                    }
                />
            }

            <GlowFAB onPress={() => setModalVisible(true)} />

            {/* MODAL NOVO VEÍCULO */}
            <Modal visible={modalVisible} transparent animationType="slide">
                {modalContent('NOVO VEÍCULO', <>
                    <Text style={styles.label}>NOME DO VEÍCULO</Text>
                    <GlowInput value={nome} onChangeText={t => up(t, setNome)} placeholder="Ex: TRATOR JOHN DEERE" />
                    <Text style={styles.label}>TIPO</Text>
                    <View style={styles.chipRow}>
                        {TIPOS.map(t => (
                            <TouchableOpacity key={t} onPress={() => setTipo(t)} style={[styles.chip, tipo === t && styles.chipActive]}>
                                <Text style={[styles.chipText, tipo === t && { color: '#061E1A' }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.label}>PLACA (OPCIONAL)</Text>
                    <GlowInput value={placa} onChangeText={t => up(t, setPlaca)} placeholder="ABC-1234" />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ATUAL (KM/H)</Text>
                            <GlowInput value={horimetro} onChangeText={setHorimetro} placeholder="0" keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>PRÓX. REVISÃO</Text>
                            <GlowInput value={revisao} onChangeText={setRevisao} placeholder="10000" keyboardType="numeric" />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                        </TouchableOpacity>
                        <PrimaryButton label="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                    </View>
                </>)}
            </Modal>

            {/* MODAL UPDATE KM */}
            <Modal visible={updateModalVisible} transparent animationType="fade">
                {modalContent('ATUALIZAR HORÍMETRO/KM', <>
                    <GlowInput value={novoHorimetro} onChangeText={setNovoHorimetro} placeholder="Novo valor total..." keyboardType="numeric" autoFocus />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setUpdateModalVisible(false)}>
                            <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                        </TouchableOpacity>
                        <PrimaryButton label="ATUALIZAR" onPress={handleUpdateKM} style={{ flex: 1 }} />
                    </View>
                </>)}
            </Modal>

            {/* MODAL SERVIÇO */}
            <Modal visible={serviceModalVisible} transparent animationType="slide">
                {modalContent('REGISTRAR MANUTENÇÃO', <>
                    <Text style={styles.label}>DESCRIÇÃO DO SERVIÇO</Text>
                    <GlowInput value={servicoDesc} onChangeText={t => up(t, setServicoDesc)} placeholder="Ex: TROCA DE ÓLEO" />
                    <Text style={styles.label}>CUSTO TOTAL (R$)</Text>
                    <GlowInput value={servicoValor} onChangeText={setServicoValor} placeholder="0,00" keyboardType="numeric" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setServiceModalVisible(false)}>
                            <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                        </TouchableOpacity>
                        <PrimaryButton label="SALVAR" onPress={handleSaveService} style={{ flex: 1 }} />
                    </View>
                </>)}
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    iconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(0,255,156,0.1)', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: DARK.textPrimary },
    cardSub: { fontSize: 11, color: DARK.textSecondary, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    badgeText: { fontSize: 9, fontWeight: '900' },

    stats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
    statVal: { fontSize: 18, fontWeight: '900' },
    statUnit: { fontSize: 11, color: DARK.textMuted },
    statLabel: { fontSize: 10, color: DARK.textMuted },
    barBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
    barFill: { height: 5, borderRadius: 3 },
    remainText: { fontSize: 10, textAlign: 'right', marginBottom: 14, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 8 },
    actBtn: { flex: 1, flexDirection: 'row', gap: 6, padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,255,156,0.06)', borderWidth: 1, borderColor: DARK.glowBorder },
    actText: { fontSize: 10, fontWeight: '900' },

    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: 'bold', color: DARK.textSecondary },
    emptySub: { marginTop: 5, fontSize: 13, color: DARK.textMuted },

    overlay: { flex: 1, backgroundColor: MODAL_OVERLAY, justifyContent: 'flex-end' },
    modal: { backgroundColor: DARK.modal, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,255,156,0.06)', borderWidth: 1, borderColor: DARK.glowBorder },
    chipActive: { backgroundColor: DARK.glow },
    chipText: { fontSize: 11, fontWeight: 'bold', color: DARK.textSecondary },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
});
