import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertMaquina, getMaquinas, updateMaquinaRevisao, deleteMaquina, insertManutencaoFrota, getHistoricoManutencoes } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function FrotaScreen({ navigation }) {
    const { theme } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);

    // Form States
    const [nome, setNome] = useState('');
    const [placa, setPlaca] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [horimetro, setHorimetro] = useState('');
    const [revisao, setRevisao] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [servicoDesc, setServicoDesc] = useState('');
    const [servicoValor, setServicoValor] = useState('');
    const [novoHorimetro, setNovoHorimetro] = useState('');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const up = (t, setter) => setter(t.toUpperCase());

    const loadData = async () => {
        setLoading(true);
        try { 
            const data = await getMaquinas(); 
            setItems(data); 
        } catch (e) { 
            console.error(e);
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Nome é obrigatório.');
        try {
            await insertMaquina({
                uuid: uuidv4(),
                nome,
                tipo,
                placa,
                horimetro_atual: parseFloat(horimetro || 0),
                intervalo_revisao: parseFloat(revisao || 0)
            });
            setModalVisible(false); cleanForms(); loadData();
            Alert.alert('Sucesso', 'Veículo cadastrado!');
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar veículo.'); }
    };

    const handleUpdateKM = async () => {
        if (!novoHorimetro.trim()) return;
        try {
            const currentItem = items.find(i => i.uuid === selectedId);
            await updateMaquinaRevisao(selectedId, parseFloat(novoHorimetro), currentItem ? currentItem.intervalo_revisao : 10000);
            setUpdateModalVisible(false); setNovoHorimetro(''); loadData();
            Alert.alert('Sucesso', 'KM/Horímetro atualizado!');
        } catch (e) { Alert.alert('Erro', 'Falha ao atualizar.'); }
    };

    const handleSaveService = async () => {
        if (!servicoDesc.trim()) return;
        try {
            await insertManutencaoFrota({
                uuid: uuidv4(),
                maquina_uuid: selectedId,
                data: new Date().toLocaleDateString('pt-BR'),
                descricao: servicoDesc,
                valor: parseFloat(servicoValor.replace(',', '.') || 0)
            });
            setServiceModalVisible(false); setServicoDesc(''); setServicoValor(''); 
            Alert.alert('Sucesso', 'Manutenção registrada!');
        } catch (e) { Alert.alert('Erro', 'Falha ao registrar serviço.'); }
    };

    const deleteItem = (uuid) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não' }, 
            { text: 'Sim', style: 'destructive', onPress: async () => { await deleteMaquina(uuid); loadData(); } }
        ]);
    };

    const cleanForms = () => {
        setNome(''); setPlaca(''); setTipo('TRATOR'); setHorimetro(''); setRevisao('');
    };

    const getStatusColor = (h, r) => {
        const diff = r - h;
        if (diff < 0) return { bg: '#FEF2F2', text: '#EF4444', label: 'ATRASADO', bar: '#EF4444' };
        if (diff < (r * 0.15)) return { bg: '#FFFBEB', text: '#F59E0B', label: 'ATENÇÃO', bar: '#F59E0B' };
        return { bg: '#F0FDF4', text: '#10B981', label: 'EM DIA', bar: '#10B981' };
    };

    const alertCount = items.filter(i => (i.intervalo_revisao - i.horimetro_atual) < (i.intervalo_revisao * 0.15)).length;

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GESTÃO DE FROTA</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Alertas" 
                        value={alertCount.toString()} 
                        icon="warning" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                    <MetricCard 
                        title="Total Veículos" 
                        value={items.length.toString()} 
                        icon="bus" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            {loading ? <ActivityIndicator size="large" color={theme?.colors?.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.uuid}
                    renderItem={({ item }) => {
                        const isCar = ['CARRO', 'CAMINHAO', 'UTILITARIO'].includes(item.tipo);
                        const unit = isCar ? 'KM' : 'H';
                        const st = getStatusColor(item.horimetro_atual, item.intervalo_revisao);
                        const pct = Math.min(1, Math.max(0, item.horimetro_atual / (item.intervalo_revisao || 1)));
                        const remaining = item.intervalo_revisao - item.horimetro_atual;

                        return (
                            <Card style={styles.card} noPadding>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconBox}>
                                            <Ionicons name={isCar ? "car" : "construct"} size={24} color={theme?.colors?.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.cardTitle}>{item.nome}</Text>
                                            <Text style={styles.cardSub}>{item.tipo} {item.placa ? `• ${item.placa}` : ''}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                            <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statsRow}>
                                        <View>
                                            <Text style={styles.statVal}>{item.horimetro_atual.toLocaleString()} <Text style={styles.statUnit}>{unit}</Text></Text>
                                            <Text style={styles.statLabel}>Atual</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.statVal}>{item.intervalo_revisao.toLocaleString()} <Text style={styles.statUnit}>{unit}</Text></Text>
                                            <Text style={styles.statLabel}>Próx. Revisão</Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: st.bar }]} />
                                        </View>
                                        <Text style={[styles.remainText, { color: st.text }]}>
                                            {remaining >= 0 ? `Faltam ${remaining} ${unit}` : `Vencido há ${Math.abs(remaining)} ${unit}`}
                                        </Text>
                                    </View>

                                    <View style={styles.actions}>
                                        <AgroButton 
                                            title={`+ ${unit}`} 
                                            variant="secondary" 
                                            onPress={() => { setSelectedId(item.uuid); setUpdateModalVisible(true); }}
                                            style={{ flex: 1, height: 40 }}
                                        />
                                        <AgroButton 
                                            title="SERVIÇO" 
                                            onPress={() => { setSelectedId(item.uuid); setServiceModalVisible(true); }}
                                            style={{ flex: 1, height: 40 }}
                                        />
                                        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item.uuid)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Card>
                        );
                    }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum veículo cadastrado.</Text>}
                />
            }

            {/* MODAL NOVOS */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>NOVO VEÍCULO</Text>
                        
                        <AgroInput label="Nome" value={nome} onChangeText={t => up(t, setNome)} placeholder="EX: TRATOR CASE" />
                        
                        <Text style={styles.label}>TIPO</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {['TRATOR', 'CARRO', 'CAMINHAO', 'OUTRO'].map(t => (
                                <TouchableOpacity key={t} onPress={() => setTipo(t)} style={[styles.chip, tipo === t && { backgroundColor: theme?.colors?.primary }]}>
                                    <Text style={[styles.chipText, tipo === t && { color: '#FFF' }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <AgroInput label="Placa" value={placa} onChangeText={t => up(t, setPlaca)} placeholder="OPCIONAL" />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput label="Atual (KM/H)" keyboardType="numeric" value={horimetro} onChangeText={setHorimetro} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput label="Próx. Revisão" keyboardType="numeric" value={revisao} onChangeText={setRevisao} placeholder="10000" />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                            <AgroButton title="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* MODAL UPDATE KM */}
            <Modal visible={updateModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>ATUALIZAR KM/HORÍMETRO</Text>
                        <AgroInput 
                            placeholder="Novo valor total..." 
                            keyboardType="numeric" 
                            value={novoHorimetro} 
                            onChangeText={setNovoHorimetro}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <AgroButton title="CANCELAR" variant="secondary" onPress={() => setUpdateModalVisible(false)} style={{ flex: 1 }} />
                            <AgroButton title="ATUALIZAR" onPress={handleUpdateKM} style={{ flex: 1 }} />
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* MODAL SERVICO */}
            <Modal visible={serviceModalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>REGISTRAR MANUTENÇÃO</Text>
                        <AgroInput label="Descrição" value={servicoDesc} onChangeText={t => up(t, setServicoDesc)} placeholder="EX: TROCA DE ÓLEO" />
                        <AgroInput label="Valor (R$)" keyboardType="numeric" value={servicoValor} onChangeText={setServicoValor} placeholder="0,00" />
                        
                        <View style={styles.modalActions}>
                            <AgroButton title="CANCELAR" variant="secondary" onPress={() => setServiceModalVisible(false)} style={{ flex: 1 }} />
                            <AgroButton title="CONFIRMAR" onPress={handleSaveService} style={{ flex: 1 }} />
                        </View>
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    card: { marginBottom: 15 },
    cardContent: { padding: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    cardSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    statVal: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    statUnit: { fontSize: 11, color: '#9CA3AF' },
    statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
    progressContainer: { marginBottom: 20 },
    progressBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 4 },
    remainText: { fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
    actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    deleteBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    empty: { textAlign: 'center', marginTop: 100, color: '#9CA3AF' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 25, textAlign: 'center', color: '#1F2937' },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    row: { flexDirection: 'row' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    chipScroll: { marginBottom: 20 },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', marginRight: 10 },
    chipText: { fontSize: 11, fontWeight: 'bold', color: '#6B7280' }
});
