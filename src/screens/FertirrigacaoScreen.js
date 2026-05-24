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

export default function FertirrigacaoScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhoes, setTalhoes] = useState([]);
    const [history, setHistory] = useState([]);
    const [modalTalhao, setModalTalhao] = useState(false);
    
    const [form, setForm] = useState({
        talhao_uuid: '',
        talhao_nome: '',
        formula: '',
        volume_agua_l: '',
        dosagem_insumo_kg: '',
        observacao: ''
    });

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            // Load Talhões
            const resT = await executeQuery('SELECT uuid, nome FROM talhoes WHERE is_deleted = 0');
            const rowsT = [];
            for (let i = 0; i < resT.rows.length; i++) rowsT.push(resT.rows.item(i));
            setTalhoes(rowsT);

            // Load History
            const resH = await executeQuery(
                `SELECT f.*, t.nome as talhao_nome 
                 FROM fertirrigacao f 
                 LEFT JOIN talhoes t ON f.talhao_uuid = t.uuid 
                 WHERE f.is_deleted = 0 
                 ORDER BY f.data DESC LIMIT 10`
            );
            const rowsH = [];
            for (let i = 0; i < resH.rows.length; i++) rowsH.push(resH.rows.item(i));
            setHistory(rowsH);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.talhao_uuid || !form.formula) return Alert.alert('Aviso', 'Selecione o talhão e defina a fórmula.');
        try {
            const now = new Date().toISOString();
            await executeQuery(
                'INSERT INTO fertirrigacao (uuid, talhao_uuid, formula, volume_agua_l, dosagem_insumo_kg, data, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), form.talhao_uuid, form.formula.toUpperCase(), parseFloat(form.volume_agua_l) || 0, parseFloat(form.dosagem_insumo_kg) || 0, now.split('T')[0], now]
            );
            Alert.alert('Sucesso', 'Fertirrigação registrada!');
            setForm({ talhao_uuid: '', talhao_nome: '', formula: '', volume_agua_l: '', dosagem_insumo_kg: '', observacao: '' });
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar registro.'); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>FERTIRRIGAÇÃO</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Nutrição de precisão via rede de água</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>NOVO REGISTRO</Text>
                    
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setModalTalhao(true)}>
                        <Text style={[styles.selectText, !form.talhao_nome && { color: '#9CA3AF' }]}>
                            {form.talhao_nome || "SELECIONAR TALHÃO / ÁREA..."}
                        </Text>
                        <Ionicons name="location-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <AgroInput 
                        label="FÓRMULA / MISTURA (EX: NPK 20-00-20)" 
                        value={form.formula} 
                        onChangeText={t => setForm({...form, formula: t})} 
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="VOLUME ÁGUA (L)" 
                                value={form.volume_agua_l} 
                                keyboardType="numeric" 
                                onChangeText={t => setForm({...form, volume_agua_l: t})} 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="DOSAGEM (KG)" 
                                value={form.dosagem_insumo_kg} 
                                keyboardType="numeric" 
                                onChangeText={t => setForm({...form, dosagem_insumo_kg: t})} 
                            />
                        </View>
                    </View>

                    <AgroButton title="REGISTRAR NUTRIÇÃO" onPress={handleSave} />
                </Card>

                <Text style={styles.historyTitle}>ÚLTIMOS TURNOS</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.histCard}>
                        <View style={styles.histRow}>
                            <View style={styles.histIcon}>
                                <Ionicons name="flask-outline" size={20} color="#0EA5E9" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.histTalhao}>{item.talhao_nome}</Text>
                                <Text style={styles.histFormula}>{item.formula}</Text>
                                <Text style={styles.histMeta}>{item.volume_agua_l}L • {item.dosagem_insumo_kg}KG</Text>
                            </View>
                            <Text style={styles.histDate}>{item.data.split('-').reverse().join('/')}</Text>
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
    histIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    histTalhao: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    histFormula: { fontSize: 11, color: '#0EA5E9', fontWeight: '900', marginTop: 2 },
    histMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    histDate: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, maxHeight: '80%' },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    talhaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    talhaoText: { fontSize: 14, fontWeight: '800', color: '#374151' }
});
