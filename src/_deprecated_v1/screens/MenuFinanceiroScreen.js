import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_MOCK_CONTAS = [
    {
        id: '1',
        descricao: 'Semente de Milho Híbrido',
        tipo: 'despesa',
        valor: 14500.00,
        vencimento: 'Hoje',
        status: 'A Pagar',
        formaPagamento: 'Boleto'
    },
    {
        id: '2',
        descricao: 'Venda Morango Ceasa',
        tipo: 'receita',
        valor: 8200.00,
        vencimento: '15/06/2026',
        status: 'A Receber',
        formaPagamento: 'Pix'
    },
    {
        id: '3',
        descricao: 'Manutenção Trator',
        tipo: 'despesa',
        valor: 3500.00,
        vencimento: 'Ontem',
        status: 'Atrasado',
        formaPagamento: 'Cartão'
    },
    {
        id: '4',
        descricao: 'Adubo NPK 10-10-10',
        tipo: 'despesa',
        valor: 9100.00,
        vencimento: '10/05/2026',
        status: 'Pago',
        formaPagamento: 'Transferência'
    }
];

const FILTERS = ['Todas', 'A Pagar', 'A Receber', 'Pagas', 'Atrasadas'];

export default function MenuFinanceiroScreen({ navigation }) {
    const [contas, setContas] = useState(INITIAL_MOCK_CONTAS);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todas');
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ descricao: '', valor: '', tipo: 'despesa', vencimento: '' });

    const filteredContas = contas.filter(c => {
        const matchSearch = c.descricao.toLowerCase().includes(search.toLowerCase());
        let matchFilter = true;
        if (activeFilter === 'A Pagar') matchFilter = c.status === 'A Pagar' || c.status === 'Atrasado';
        else if (activeFilter === 'A Receber') matchFilter = c.status === 'A Receber';
        else if (activeFilter === 'Pagas') matchFilter = c.status === 'Pago';
        else if (activeFilter === 'Atrasadas') matchFilter = c.status === 'Atrasado';
        
        return matchSearch && matchFilter;
    });

    const getStatusStyle = (status, tipo) => {
        if (status === 'Pago') return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'checkmark-circle' };
        if (status === 'Atrasado') return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: 'alert-circle' };
        if (status === 'A Receber') return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'arrow-down-circle' };
        if (status === 'A Pagar' && tipo === 'despesa') return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: 'time' };
        return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', icon: 'ellipse' };
    };

    const handlePay = (id) => {
        setContas(contas.map(c => c.id === id ? { ...c, status: 'Pago' } : c));
        Alert.alert('Sucesso', 'Baixa realizada com sucesso!');
    };

    const handleSave = () => {
        if (!formData.descricao || !formData.valor) {
            Alert.alert('Erro', 'Preencha a descrição e o valor.');
            return;
        }
        const novaConta = {
            id: Math.random().toString(),
            descricao: formData.descricao,
            tipo: formData.tipo,
            valor: parseFloat(formData.valor.replace(',', '.')) || 0,
            vencimento: formData.vencimento || 'Hoje',
            status: formData.tipo === 'despesa' ? 'A Pagar' : 'A Receber',
            formaPagamento: 'A Combinar'
        };
        setContas([novaConta, ...contas]);
        setModalVisible(false);
        setFormData({ descricao: '', valor: '', tipo: 'despesa', vencimento: '' });
        Alert.alert('Sucesso', 'Lançamento registrado!');
    };

    const formatarMoeda = (valor) => {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    };

    const totalAPagar = contas.filter(c => c.tipo === 'despesa' && c.status !== 'Pago').reduce((a, b) => a + b.valor, 0);
    const totalAReceber = contas.filter(c => c.tipo === 'receita' && c.status !== 'Pago').reduce((a, b) => a + b.valor, 0);
    const saldoPrevisto = totalAReceber - totalAPagar;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Ionicons name="wallet" size={28} color="#10B981" />
                    <Text style={styles.headerTitle}>Financeiro</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Indicadores Topo */}
                <View style={styles.metricsContainer}>
                    <View style={[styles.metricCard, { backgroundColor: '#111827', borderColor: '#1F2937' }]}>
                        <Text style={styles.metricLabel}>Saldo Previsto</Text>
                        <Text style={[styles.metricValue, { color: saldoPrevisto >= 0 ? '#10B981' : '#EF4444' }]}>
                            {formatarMoeda(saldoPrevisto)}
                        </Text>
                    </View>
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricCard, { flex: 1, marginRight: 10, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                                <Ionicons name="arrow-up-circle" size={14} color="#EF4444" style={{marginRight: 4}}/>
                                <Text style={styles.metricLabelSm}>A Pagar</Text>
                            </View>
                            <Text style={[styles.metricValueSm, { color: '#EF4444' }]}>{formatarMoeda(totalAPagar)}</Text>
                        </View>
                        <View style={[styles.metricCard, { flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                                <Ionicons name="arrow-down-circle" size={14} color="#10B981" style={{marginRight: 4}}/>
                                <Text style={styles.metricLabelSm}>A Receber</Text>
                            </View>
                            <Text style={[styles.metricValueSm, { color: '#10B981' }]}>{formatarMoeda(totalAReceber)}</Text>
                        </View>
                    </View>
                </View>

                {/* Filtros */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersWrapper} contentContainerStyle={styles.filtersContent}>
                    {FILTERS.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Lançamentos</Text>

                {/* Lista */}
                {filteredContas.map(c => {
                    const statusStyle = getStatusStyle(c.status, c.tipo);
                    const isPago = c.status === 'Pago';
                    return (
                        <View key={c.id} style={styles.card}>
                            <View style={styles.cardLeft}>
                                <View style={[styles.iconBox, { backgroundColor: c.tipo === 'despesa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Ionicons name={c.tipo === 'despesa' ? 'cart-outline' : 'cash-outline'} size={24} color={c.tipo === 'despesa' ? '#EF4444' : '#10B981'} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardDesc} numberOfLines={1}>{c.descricao}</Text>
                                    <View style={styles.cardSubInfo}>
                                        <Text style={styles.cardDate}>{c.vencimento}</Text>
                                        <View style={styles.dotSeparator} />
                                        <Text style={styles.cardDate}>{c.formaPagamento}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} style={{marginRight: 4}} />
                                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{c.status}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.cardRight}>
                                <Text style={[styles.cardValue, { color: isPago ? '#64748B' : (c.tipo === 'despesa' ? '#F8FAFC' : '#10B981'), textDecorationLine: isPago ? 'line-through' : 'none' }]}>
                                    {c.tipo === 'despesa' ? '-' : '+'}{formatarMoeda(c.valor)}
                                </Text>
                                
                                {!isPago && c.tipo === 'despesa' && (
                                    <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(c.id)}>
                                        <Text style={styles.payBtnText}>Pagar</Text>
                                    </TouchableOpacity>
                                )}
                                {!isPago && c.tipo === 'receita' && (
                                    <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#10B981' }]} onPress={() => handlePay(c.id)}>
                                        <Text style={[styles.payBtnText, { color: '#000' }]}>Receber</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Modal Novo Lançamento */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Novo Lançamento</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity 
                                style={[styles.typeBtn, formData.tipo === 'despesa' && styles.typeBtnDespesa]}
                                onPress={() => setFormData({...formData, tipo: 'despesa'})}
                            >
                                <Ionicons name="arrow-up" size={16} color={formData.tipo === 'despesa' ? '#FFF' : '#EF4444'} />
                                <Text style={[styles.typeBtnText, formData.tipo === 'despesa' && { color: '#FFF' }]}>Despesa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.typeBtn, formData.tipo === 'receita' && styles.typeBtnReceita]}
                                onPress={() => setFormData({...formData, tipo: 'receita'})}
                            >
                                <Ionicons name="arrow-down" size={16} color={formData.tipo === 'receita' ? '#FFF' : '#10B981'} />
                                <Text style={[styles.typeBtnText, formData.tipo === 'receita' && { color: '#FFF' }]}>Receita</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex: Compra de Fertilizante" 
                            placeholderTextColor="#64748B"
                            value={formData.descricao}
                            onChangeText={t => setFormData({...formData, descricao: t})}
                        />

                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>VALOR (R$)</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="0,00" 
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={formData.valor}
                                    onChangeText={t => setFormData({...formData, valor: t})}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>VENCIMENTO</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="DD/MM/AAAA" 
                                    placeholderTextColor="#64748B"
                                    value={formData.vencimento}
                                    onChangeText={t => setFormData({...formData, vencimento: t})}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>SALVAR REGISTRO</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginLeft: 8 },
    addBtn: { width: 40, height: 40, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    
    content: { padding: 20, paddingBottom: 40 },
    
    metricsContainer: { marginBottom: 25 },
    metricCard: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    metricLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginBottom: 4 },
    metricValue: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    metricLabelSm: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
    metricValueSm: { fontSize: 16, fontWeight: '900' },

    filtersWrapper: { marginBottom: 20 },
    filtersContent: { paddingRight: 20 },
    filterBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1F2937', marginRight: 10 },
    filterBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#FFF', fontWeight: '800' },

    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 15 },

    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardDesc: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    cardSubInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cardDate: { color: '#64748B', fontSize: 12, fontWeight: '600' },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 6 },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
    statusText: { fontSize: 10, fontWeight: '800' },

    cardRight: { alignItems: 'flex-end', marginLeft: 10 },
    cardValue: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
    payBtn: { backgroundColor: '#1F2937', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8 },
    payBtnText: { color: '#F8FAFC', fontSize: 12, fontWeight: '800' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: Platform.OS === 'ios' ? 50 : 30, borderWidth: 1, borderColor: '#1F2937' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    
    typeSelector: { flexDirection: 'row', backgroundColor: '#0B121E', borderRadius: 12, p: 4, marginBottom: 20, borderWidth: 1, borderColor: '#1F2937' },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
    typeBtnDespesa: { backgroundColor: '#EF4444' },
    typeBtnReceita: { backgroundColor: '#10B981' },
    typeBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '800', marginLeft: 6 },

    inputLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1.5, marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#0B121E', borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', color: '#F8FAFC', fontSize: 15, padding: 15 },
    
    saveBtn: { marginTop: 30, backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 }
});
