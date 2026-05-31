import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function IrrigacaoScreen({ navigation }) {
    const { theme } = useTheme();
    const [history, setHistory] = useState([]);
    const [talhoes, setTalhoes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [talhaoModal, setTalhaoModal] = useState(false);
    
    const [form, setForm] = useState({
        talhao_uuid: '',
        talhao_nome: '',
        turno: 'DIURNO',
        duracao_min: '',
        volumetria_m3: '',
        observacao: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const resH = await executeQuery('SELECT i.*, t.nome as talhao_nome FROM irrigacao i LEFT JOIN talhoes t ON i.talhao_uuid = t.uuid WHERE i.is_deleted = 0 ORDER BY i.data DESC LIMIT 20');
            const rowsH = [];
            for (let i = 0; i < resH.rows.length; i++) rowsH.push(resH.rows.item(i));
            setHistory(rowsH);

            const resT = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
            const rowsT = [];
            for (let i = 0; i < resT.rows.length; i++) rowsT.push(resT.rows.item(i));
            setTalhoes(rowsT);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.talhao_uuid || !form.duracao_min) return Alert.alert('Aviso', 'Talhão e Duração são obrigatórios');
        try {
            const now = new Date().toISOString();
            await executeQuery(
                'INSERT INTO irrigacao (uuid, talhao_uuid, turno, duracao_min, volumetria_m3, data, observacao, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), form.talhao_uuid, form.turno, parseInt(form.duracao_min), parseFloat(form.volumetria_m3) || 0, now.split('T')[0], form.observacao.toUpperCase(), now]
            );
            setModalVisible(false);
            setForm({ talhao_uuid: '', talhao_nome: '', turno: 'DIURNO', duracao_min: '', volumetria_m3: '', observacao: '' });
            loadData();
            Alert.alert('Sucesso', 'Turno de irrigação registrado!');
        } catch (e) { Alert.alert('Erro', 'Falha ao registrar irrigação'); }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="water" size={24} color="#0EA5E9" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.talhao_nome || 'Talhão Excluído'}</Text>
                    <Text style={styles.itemSub}>{item.turno} • {item.duracao_min} min • {item.data.split('-').reverse().join('/')}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.volumetria_m3} m³</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#0369A1', '#0EA5E9']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTROLE DE IRRIGAÇÃO</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum registro de irrigação.</Text>}
                ListHeaderComponent={<Text style={styles.sectionTitle}>HISTÓRICO RECENTE</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>NOVO TURNO DE IRRIGAÇÃO</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            
                            <Text style={styles.label}>TALHÃO / ÁREA</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setTalhaoModal(true)}>
                                <Text style={[styles.selectText, !form.talhao_nome && { color: '#9CA3AF' }]}>
                                    {form.talhao_nome || "SELECIONAR TALHÃO..."}
                                </Text>
                                <Ionicons name="map-outline" size={20} color="#6B7280" />
                            </TouchableOpacity>

                            <View style={styles.row}>
                                <TouchableOpacity 
                                    style={[styles.turnoBtn, form.turno === 'DIURNO' && styles.turnoBtnActive]} 
                                    onPress={() => setForm({...form, turno: 'DIURNO'})}
                                >
                                    <Ionicons name="sunny-outline" size={20} color={form.turno === 'DIURNO' ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.turnoText, form.turno === 'DIURNO' && { color: '#FFF' }]}>DIURNO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.turnoBtn, form.turno === 'NOTURNO' && styles.turnoBtnActive, { backgroundColor: form.turno === 'NOTURNO' ? '#1E2937' : '#F3F4F6' }]} 
                                    onPress={() => setForm({...form, turno: 'NOTURNO'})}
                                >
                                    <Ionicons name="moon-outline" size={20} color={form.turno === 'NOTURNO' ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.turnoText, form.turno === 'NOTURNO' && { color: '#FFF' }]}>NOTURNO</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <AgroInput label="DURAÇÃO (MIN)" value={form.duracao_min} keyboardType="numeric" onChangeText={t => setForm({...form, duracao_min: t})} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AgroInput label="VOLUMETRIA (M³)" value={form.volumetria_m3} keyboardType="numeric" onChangeText={t => setForm({...form, volumetria_m3: t})} />
                                </View>
                            </View>

                            <AgroInput label="OBSERVAÇÕES" value={form.observacao} multiline numberOfLines={2} onChangeText={t => setForm({...form, observacao: t})} />
                            
                            <View style={styles.modalButtons}>
                                <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10 }} />
                                <AgroButton title="REGISTRAR" onPress={handleSave} style={{ flex: 1 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={talhaoModal} animationType="fade" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { maxHeight: '60%' }]}>
                        <Text style={styles.modalTitle}>SELECIONAR TALHÃO</Text>
                        <FlatList
                            data={talhoes}
                            keyExtractor={i => i.uuid}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.talhaoRow} 
                                    onPress={() => { setForm({...form, talhao_uuid: item.uuid, talhao_nome: item.nome}); setTalhaoModal(false); }}
                                >
                                    <Text style={styles.talhaoName}>{item.nome}</Text>
                                    <Text style={styles.talhaoArea}>{item.area_ha} ha</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setTalhaoModal(false)} style={{ marginTop: 10 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    list: { padding: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 15 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    itemSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    statusBadge: { backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' },
    statusText: { fontSize: 10, fontWeight: '900', color: '#0369A1' },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', marginTop: 20, marginBottom: 10 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    selectText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    row: { flexDirection: 'row', marginBottom: 10 },
    turnoBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
    turnoBtnActive: { backgroundColor: '#0EA5E9' },
    turnoText: { fontSize: 12, fontWeight: '800', color: '#6B7280', marginLeft: 8 },
    talhaoRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
    talhaoName: { fontSize: 14, fontWeight: '700', color: '#374151' },
    talhaoArea: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' }
});
