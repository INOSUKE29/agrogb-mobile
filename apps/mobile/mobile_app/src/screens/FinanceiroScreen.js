import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { 
    getFinanceiroTransacoes, 
    insertFinanceiroTransacao, 
    updateFinanceiroTransacaoStatus, 
    deleteFinanceiroTransacao,
    getFinanceiroDashboardStats 
} from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

const FILTROS = ['TODAS', 'A PAGAR', 'A RECEBER', 'PAGAS'];

export default function FinanceiroScreen({ navigation }) {
    const { theme } = useTheme();
    const [transacoes, setTransacoes] = useState([]);
    const [stats, setStats] = useState({ saldoReal: 0, aPagar: 0, aReceber: 0 });
    
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('TODAS');
    
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    // Form
    const [tipo, setTipo] = useState('PAGAR'); // PAGAR | RECEBER
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [vencimento, setVencimento] = useState('');
    const [entidadeNome, setEntidadeNome] = useState('');
    const [categoria, setCategoria] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { 
            const dataTransacoes = await getFinanceiroTransacoes(); 
            const dataStats = await getFinanceiroDashboardStats();
            setTransacoes(dataTransacoes);
            setStats(dataStats);
        } catch (e) { 
            console.error(e);
        } finally { 
            setLoading(false); 
        }
    };

    const resetForm = () => {
        setTipo('PAGAR');
        setDescricao('');
        setValor('');
        setVencimento(new Date().toISOString().split('T')[0]);
        setEntidadeNome('');
        setCategoria('');
    };

    const handleSaveTransacao = async () => {
        if (!descricao.trim() || !valor.trim() || !vencimento.trim()) {
            return Alert.alert('Atenção', 'Descrição, Valor e Vencimento são obrigatórios.');
        }

        try {
            const payload = {
                uuid: uuidv4(),
                tipo,
                descricao: descricao.toUpperCase(),
                valor: parseFloat(valor.replace(',', '.')) || 0,
                vencimento,
                entidade_nome: entidadeNome.toUpperCase(),
                categoria: categoria.toUpperCase(),
                status: 'PENDENTE'
            };

            await insertFinanceiroTransacao(payload);
            Alert.alert('Sucesso', 'Transação registrada com sucesso!');
            setModalVisible(false); 
            loadData();
        } catch (e) { 
            Alert.alert('Erro', 'Não foi possível salvar a transação.'); 
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir Transação', `Deseja remover "${item.descricao}"?`, [
            { text: 'Cancelar', style: 'cancel' }, 
            { 
                text: 'Sim, Excluir', 
                style: 'destructive', 
                onPress: async () => { 
                    await deleteFinanceiroTransacao(item.uuid); 
                    setSelectedItemActions(null);
                    loadData(); 
                } 
            }
        ]);
    };

    const handlePagarConta = async (uuid) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            await updateFinanceiroTransacaoStatus(uuid, 'PAGO', today);
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível atualizar a transação.');
        }
    };

    // Helper: Formata Dinheiro
    const formatCurrency = (val) => {
        return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Helper: Determina Status Dinâmico e Cores
    const getDynamicStatus = (item) => {
        if (item.status === 'PAGO') return { label: 'PAGO', color: '#3B82F6', icon: 'checkmark-circle' }; // Azul
        if (item.status === 'CANCELADO') return { label: 'CANCELADO', color: '#6B7280', icon: 'close-circle' };

        const today = new Date().toISOString().split('T')[0];
        if (item.vencimento < today) {
            return { label: 'ATRASADO', color: '#EF4444', icon: 'alert-circle' }; // Vermelho
        } else if (item.vencimento === today) {
            return { label: 'VENCE HOJE', color: '#F59E0B', icon: 'warning' }; // Amarelo
        } else {
            if (item.tipo === 'PAGAR') return { label: 'A PAGAR', color: '#F87171', icon: 'time' };
            if (item.tipo === 'RECEBER') return { label: 'A RECEBER', color: '#10B981', icon: 'time' };
        }
        return { label: 'PENDENTE', color: '#9CA3AF', icon: 'help' };
    };

    const filteredTransacoes = transacoes.filter(t => {
        if (filterStatus === 'TODAS') return true;
        if (filterStatus === 'PAGAS') return t.status === 'PAGO';
        if (filterStatus === 'A PAGAR') return t.tipo === 'PAGAR' && t.status !== 'PAGO';
        if (filterStatus === 'A RECEBER') return t.tipo === 'RECEBER' && t.status !== 'PAGO';
        return true;
    });

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            
            {/* CABEÇALHO COM INDICADORES (GLASSMORPHISM) */}
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>FINANCEIRO</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* KPIs */}
                <View style={styles.kpiMain}>
                    <Text style={styles.kpiMainLabel}>SALDO EM CAIXA</Text>
                    <Text style={[styles.kpiMainValue, { color: stats.saldoReal >= 0 ? '#10B981' : '#EF4444' }]}>
                        {formatCurrency(stats.saldoReal)}
                    </Text>
                </View>

                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <Ionicons name="arrow-up-circle" size={16} color="#EF4444" style={{marginBottom: 4}} />
                        <Text style={styles.kpiLabel}>A PAGAR</Text>
                        <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{formatCurrency(stats.aPagar)}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Ionicons name="arrow-down-circle" size={16} color="#10B981" style={{marginBottom: 4}} />
                        <Text style={styles.kpiLabel}>A RECEBER</Text>
                        <Text style={[styles.kpiValue, { color: '#10B981' }]}>{formatCurrency(stats.aReceber)}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* FILTROS PILLS */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {FILTROS.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.pill, filterStatus === f && styles.pillActive]}
                            onPress={() => setFilterStatus(f)}
                        >
                            <Text style={[styles.pillText, filterStatus === f && { color: '#FFF' }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
            ) : (
                <FlatList
                    data={filteredTransacoes}
                    keyExtractor={item => item.uuid}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    renderItem={({ item }) => {
                        const dyn = getDynamicStatus(item);
                        return (
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onLongPress={() => setSelectedItemActions(item)}
                                style={styles.cardContainer}
                            >
                                <LinearGradient colors={['#1F2937', '#111827']} style={styles.cardGradient}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardTitleRow}>
                                            <View style={[styles.iconBox, { backgroundColor: item.tipo === 'RECEBER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                                <Ionicons name={item.tipo === 'RECEBER' ? "arrow-down" : "arrow-up"} size={16} color={item.tipo === 'RECEBER' ? "#10B981" : "#EF4444"} />
                                            </View>
                                            <Text style={styles.cardTitle} numberOfLines={1}>{item.descricao}</Text>
                                        </View>
                                        <View style={[styles.statusTag, { backgroundColor: dyn.color + '20', borderColor: dyn.color }]}>
                                            <Ionicons name={dyn.icon} size={10} color={dyn.color} style={{marginRight: 4}} />
                                            <Text style={[styles.statusText, { color: dyn.color }]}>{dyn.label}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardBody}>
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>{item.tipo === 'RECEBER' ? 'CLIENTE' : 'FORNECEDOR'}</Text>
                                            <Text style={styles.infoValue} numberOfLines={1}>{item.entidade_nome || '--'}</Text>
                                        </View>
                                        <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
                                            <Text style={styles.infoLabel}>VALOR</Text>
                                            <Text style={[styles.infoValueLg, { color: item.tipo === 'RECEBER' ? '#10B981' : '#FFF' }]}>
                                                {formatCurrency(item.valor)}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardFooter}>
                                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                                        <Text style={styles.footerText}>Vencimento: {item.vencimento}</Text>
                                        <View style={{flex: 1}} />
                                        {item.status !== 'PAGO' && (
                                            <TouchableOpacity 
                                                style={styles.payBtn}
                                                onPress={() => handlePagarConta(item.uuid)}
                                            >
                                                <Ionicons name="checkmark-done" size={14} color="#FFF" style={{marginRight: 4}} />
                                                <Text style={styles.payBtnTxt}>{item.tipo === 'PAGAR' ? 'PAGAR' : 'RECEBER'}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="cash-remove" size={60} color="#374151" />
                            <Text style={styles.emptyTxt}>Nenhuma transação encontrada.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.fabGradient}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* MODAL DE CADASTRO */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVO LANÇAMENTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.typeRow}>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, tipo === 'PAGAR' && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
                                    onPress={() => setTipo('PAGAR')}
                                >
                                    <Ionicons name="arrow-up" size={16} color={tipo === 'PAGAR' ? '#FFF' : '#9CA3AF'} />
                                    <Text style={[styles.typeTxt, tipo === 'PAGAR' && { color: '#FFF' }]}>DESPESA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, tipo === 'RECEBER' && { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                                    onPress={() => setTipo('RECEBER')}
                                >
                                    <Ionicons name="arrow-down" size={16} color={tipo === 'RECEBER' ? '#FFF' : '#9CA3AF'} />
                                    <Text style={[styles.typeTxt, tipo === 'RECEBER' && { color: '#FFF' }]}>RECEITA</Text>
                                </TouchableOpacity>
                            </View>

                            <AgroInput 
                                label="DESCRIÇÃO *" 
                                value={descricao} 
                                onChangeText={setDescricao} 
                                placeholder="EX: ADUBO NPK, VENDA SOJA"
                                icon="document-text-outline"
                            />
                            
                            <View style={styles.row}>
                                <View style={{flex: 1, marginRight: 10}}>
                                    <AgroInput 
                                        label="VALOR (R$) *" 
                                        value={valor} 
                                        onChangeText={setValor} 
                                        keyboardType="numeric"
                                        placeholder="EX: 1500.50"
                                        icon="cash-outline"
                                    />
                                </View>
                                <View style={{flex: 1}}>
                                    <AgroInput 
                                        label="VENCIMENTO *" 
                                        value={vencimento} 
                                        onChangeText={setVencimento} 
                                        placeholder="AAAA-MM-DD"
                                        icon="calendar-outline"
                                    />
                                </View>
                            </View>

                            <AgroInput 
                                label={tipo === 'PAGAR' ? "FORNECEDOR" : "CLIENTE"} 
                                value={entidadeNome} 
                                onChangeText={setEntidadeNome} 
                                placeholder="NOME DA EMPRESA OU PESSOA"
                                icon="person-outline"
                            />

                            <View style={{marginTop: 20}}>
                                <AgroButton title="SALVAR TRANSAÇÃO" onPress={handleSaveTransacao} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.descricao || ''}
                subtitle={`Valor: ${formatCurrency(selectedItemActions?.valor || 0)}`}
                onDelete={() => handleDelete(selectedItemActions)}
                deleteLabel="Excluir Transação"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    
    kpiMain: { alignItems: 'center', marginBottom: 20 },
    kpiMainLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 },
    kpiMainValue: { fontSize: 32, fontWeight: '900' },
    
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    kpiCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    kpiValue: { fontSize: 16, fontWeight: 'bold' },
    kpiLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 1 },
    
    filtersContainer: { height: 60, justifyContent: 'center', marginTop: 10 },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', marginRight: 10, borderWidth: 1, borderColor: '#374151' },
    pillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    pillText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    
    list: { padding: 20, paddingBottom: 100 },
    cardContainer: { marginBottom: 15, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    cardGradient: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    iconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', marginLeft: 10, flex: 1 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 15, marginBottom: 15 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, color: '#6B7280', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 13, color: '#E5E7EB', fontWeight: '600' },
    infoValueLg: { fontSize: 16, fontWeight: '900' },
    
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 12, color: '#9CA3AF', marginLeft: 6 },
    payBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
    payBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    
    fab: { position: 'absolute', bottom: 30, right: 25, elevation: 8 },
    fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, backgroundColor: '#374151', borderWidth: 1, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
    typeTxt: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
    row: { flexDirection: 'row' },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
    emptyTxt: { color: '#9CA3AF', marginTop: 15, fontWeight: '700', fontSize: 14 }
});
