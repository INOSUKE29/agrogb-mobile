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

export default function FinanceiroLancamentosScreen({ navigation }) {
    const { theme } = useTheme();
    const [tab, setTab] = useState('PAGAR'); // 'PAGAR' ou 'RECEBER'
    const [transacoes, setTransacoes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ 
        descricao: '', 
        valor: '', 
        vencimento: new Date().toISOString().split('T')[0],
        entidade_nome: '',
        categoria: 'GERAL'
    });

    useEffect(() => {
        loadData();
    }, [tab]);

    const loadData = async () => {
        try {
            const res = await executeQuery(
                'SELECT * FROM financeiro_transacoes WHERE tipo = ? AND is_deleted = 0 ORDER BY vencimento ASC',
                [tab]
            );
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setTransacoes(rows);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.descricao || !form.valor) return Alert.alert('Aviso', 'Descrição e Valor são obrigatórios');
        try {
            const now = new Date().toISOString();
            await executeQuery(
                'INSERT INTO financeiro_transacoes (uuid, tipo, descricao, valor, vencimento, entidade_nome, categoria, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), tab, form.descricao.toUpperCase(), parseFloat(form.valor), form.vencimento, form.entidade_nome.toUpperCase(), form.categoria.toUpperCase(), now]
            );
            setModalVisible(false);
            setForm({ descricao: '', valor: '', vencimento: new Date().toISOString().split('T')[0], entidade_nome: '', categoria: 'GERAL' });
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar lançamento'); }
    };

    const handleDarBaixa = (item) => {
        Alert.alert('Liquidar Título', `Confirmar o pagamento/recebimento de R$ ${item.valor.toFixed(2)}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'CONFIRMAR', 
                onPress: async () => {
                    const now = new Date().toISOString();
                    await executeQuery(
                        'UPDATE financeiro_transacoes SET status = ?, data_pagamento = ?, last_updated = ? WHERE uuid = ?',
                        ['PAGO', now.split('T')[0], now, item.uuid]
                    );
                    loadData();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: tab === 'PAGAR' ? '#FEF2F2' : '#F0FDF4' }]}>
                    <Ionicons 
                        name={tab === 'PAGAR' ? "arrow-down-circle" : "arrow-up-circle"} 
                        size={24} 
                        color={tab === 'PAGAR' ? "#EF4444" : "#10B981"} 
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.descricao}</Text>
                    <Text style={styles.itemSub}>{item.entidade_nome || 'Sem identificação'} • Venc: {item.vencimento.split('-').reverse().join('/')}</Text>
                </View>
                <View style={styles.valueContainer}>
                    <Text style={[styles.itemValue, { color: item.status === 'PAGO' ? '#9CA3AF' : (tab === 'PAGAR' ? '#EF4444' : '#10B981') }]}>
                        R$ {item.valor.toFixed(2)}
                    </Text>
                    {item.status === 'PENDENTE' && (
                        <TouchableOpacity onPress={() => handleDarBaixa(item)} style={styles.baixaBtn}>
                            <Text style={styles.baixaText}>BAIXAR</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'PAGO' && (
                        <View style={styles.pagoBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                            <Text style={styles.pagoText}>PAGO</Text>
                        </View>
                    )}
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#1E2937', '#374151']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTAS A {tab}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.tabRow}>
                    <TouchableOpacity style={[styles.tab, tab === 'PAGAR' && styles.tabActive]} onPress={() => setTab('PAGAR')}>
                        <Text style={[styles.tabText, tab === 'PAGAR' && styles.tabTextActive]}>A PAGAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, tab === 'RECEBER' && styles.tabActive]} onPress={() => setTab('RECEBER')}>
                        <Text style={[styles.tabText, tab === 'RECEBER' && styles.tabTextActive]}>A RECEBER</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={transacoes}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum lançamento encontrado.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>NOVO LANÇAMENTO {tab}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AgroInput label="DESCRIÇÃO / TÍTULO" value={form.descricao} onChangeText={t => setForm({...form, descricao: t})} />
                            <AgroInput label={tab === 'PAGAR' ? "FORNECEDOR" : "CLIENTE"} value={form.entidade_nome} onChangeText={t => setForm({...form, entidade_nome: t})} />
                            
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <AgroInput label="VALOR R$" value={form.valor} keyboardType="numeric" onChangeText={t => setForm({...form, valor: t})} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AgroInput label="VENCIMENTO" value={form.vencimento} placeholder="AAAA-MM-DD" onChangeText={t => setForm({...form, vencimento: t})} />
                                </View>
                            </View>
                            
                            <AgroInput label="CENTRO DE CUSTO / CATEGORIA" value={form.categoria} onChangeText={t => setForm({...form, categoria: t})} />
                            
                            <View style={styles.modalButtons}>
                                <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10 }} />
                                <AgroButton title="CONFIRMAR" onPress={handleSave} style={{ flex: 1 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 5 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)' },
    tabTextActive: { color: '#1E2937' },
    list: { padding: 20 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
    itemSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    valueContainer: { alignItems: 'flex-end' },
    itemValue: { fontSize: 15, fontWeight: '900' },
    baixaBtn: { backgroundColor: '#1E2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 5 },
    baixaText: { fontSize: 10, color: '#FFF', fontWeight: '900' },
    pagoBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    pagoText: { fontSize: 10, color: '#10B981', fontWeight: '900', marginLeft: 4 },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', marginTop: 20, marginBottom: 10 },
    row: { flexDirection: 'row' }
});
