import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function AplicacoesScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhoes, setTalhoes] = useState([]);
    const [history, setHistory] = useState([]);
    const [modalTalhao, setModalTalhao] = useState(false);
    
    const [form, setForm] = useState({
        talhao_uuid: '',
        talhao_nome: '',
        produto_nome: '',
        praga_alvo: '',
        dose_ha: '',
        volume_calda_l: '',
        carencia_dias: '7'
    });

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const resT = await executeQuery('SELECT uuid, nome FROM talhoes WHERE is_deleted = 0');
            const rowsT = [];
            for (let i = 0; i < resT.rows.length; i++) rowsT.push(resT.rows.item(i));
            setTalhoes(rowsT);

            const resH = await executeQuery(
                `SELECT a.*, t.nome as talhao_nome 
                 FROM aplicacoes a 
                 LEFT JOIN talhoes t ON a.talhao_uuid = t.uuid 
                 WHERE a.is_deleted = 0 
                 ORDER BY a.data DESC LIMIT 10`
            );
            const rowsH = [];
            for (let i = 0; i < resH.rows.length; i++) rowsH.push(resH.rows.item(i));
            setHistory(rowsH);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.talhao_uuid || !form.produto_nome) return Alert.alert('Aviso', 'Preencha o talhão e o produto.');
        try {
            const now = new Date();
            const dataStr = now.toISOString().split('T')[0];
            
            // Calcular data de liberação
            const carencia = parseInt(form.carencia_dias) || 0;
            const dataLib = new Date(now);
            dataLib.setDate(now.getDate() + carencia);
            const dataLibStr = dataLib.toISOString().split('T')[0];

            await executeQuery(
                'INSERT INTO aplicacoes (uuid, talhao_uuid, produto_nome, praga_alvo, dose_ha, volume_calda_l, data, carencia_dias, data_liberacao, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), form.talhao_uuid, form.produto_nome.toUpperCase(), form.praga_alvo.toUpperCase(), parseFloat(form.dose_ha) || 0, parseFloat(form.volume_calda_l) || 0, dataStr, carencia, dataLibStr, now.toISOString()]
            );
            
            Alert.alert('Sucesso', `Aplicação registrada. Liberado para colheita em: ${dataLibStr.split('-').reverse().join('/')}`);
            setForm({ talhao_uuid: '', talhao_nome: '', produto_nome: '', praga_alvo: '', dose_ha: '', volume_calda_l: '', carencia_dias: '7' });
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar aplicação.'); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>APLICAÇÃO DE DEFENSIVOS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Controle fitossanitário e carência de colheita</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>NOVA APLICAÇÃO</Text>
                    
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setModalTalhao(true)}>
                        <Text style={[styles.selectText, !form.talhao_nome && { color: '#9CA3AF' }]}>
                            {form.talhao_nome || "SELECIONAR TALHÃO / ÁREA..."}
                        </Text>
                        <Ionicons name="location-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <AgroInput label="PRODUTO / DEFENSIVO" value={form.produto_nome} onChangeText={t => setForm({...form, produto_nome: t})} />
                    <AgroInput label="PRAGA ALVO / MOTIVO" value={form.praga_alvo} onChangeText={t => setForm({...form, praga_alvo: t})} />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput label="DOSE / HA" value={form.dose_ha} keyboardType="numeric" onChangeText={t => setForm({...form, dose_ha: t})} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput label="CARENCIA (DIAS)" value={form.carencia_dias} keyboardType="numeric" onChangeText={t => setForm({...form, carencia_dias: t})} />
                        </View>
                    </View>

                    <AgroButton title="REGISTRAR APLICAÇÃO" onPress={handleSave} />
                </Card>

                <Text style={styles.historyTitle}>HISTÓRICO DE MANEJO</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.histCard}>
                        <View style={styles.histRow}>
                            <View style={styles.histIcon}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.histTalhao}>{item.talhao_nome}</Text>
                                <Text style={styles.histProd}>{item.produto_nome}</Text>
                                <Text style={styles.histCarencia}>Carência: {item.carencia_dias} dias • Liberação: {item.data_liberacao.split('-').reverse().join('/')}</Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>ATIVO</Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            <Modal visible={modalTalhao} animationType="fade" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>SELECIONAR ÁREA</Text>
                        <FlatList
                            data={talhoes}
                            keyExtractor={i => i.uuid}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.talhaoItem} 
                                    onPress={() => { setForm({...form, talhao_uuid: item.uuid, talhao_nome: item.nome}); setModalTalhao(false); }}
                                >
                                    <Text style={styles.talhaoText}>{item.nome}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                                </TouchableOpacity>
                            )}
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setModalTalhao(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    formCard: { padding: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 15 },
    selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15, padding: 15, marginBottom: 15 },
    selectText: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
    row: { flexDirection: 'row' },
    historyTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 25, marginBottom: 15 },
    histCard: { marginBottom: 10, padding: 15 },
    histRow: { flexDirection: 'row', alignItems: 'center' },
    histIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    histTalhao: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    histProd: { fontSize: 11, color: '#D97706', fontWeight: '900', marginTop: 2 },
    histCarencia: { fontSize: 10, color: '#6B7280', marginTop: 2 },
    statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900', color: '#D97706' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, maxHeight: '80%' },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    talhaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    talhaoText: { fontSize: 14, fontWeight: '800', color: '#374151' }
});
