import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_RECEITAS = [
    {
        id: '1',
        nome: 'Calda Nutrição Morango',
        tipo: 'Foliar',
        itens: [
            { nome: 'Bocashi', qtd: '5 L/ha', custo: 'R$ 20,00/L', emEstoque: 70 },
            { nome: 'Cálcio + Boro', qtd: '2 L/ha', custo: 'R$ 45,00/L', emEstoque: 10 }
        ]
    },
    {
        id: '2',
        nome: 'Adubação Base Milho',
        tipo: 'Solo',
        itens: [
            { nome: 'NPK 10-10-10', qtd: '200 kg/ha', custo: 'R$ 4,50/kg', emEstoque: 1500 },
            { nome: 'Ureia', qtd: '50 kg/ha', custo: 'R$ 3,20/kg', emEstoque: 200 }
        ]
    }
];

const INITIAL_APLICACOES = [
    { id: '101', receita: 'Calda Nutrição Morango', data: '22/05/2026', area: 'Talhão 01', ha: 2.5, status: 'Concluído' },
    { id: '102', receita: 'Adubação Base Milho', data: '18/05/2026', area: 'Talhão Sul', ha: 10.0, status: 'Concluído' }
];

export default function MenuAdubacaoScreen({ navigation }) {
    const [abaAtiva, setAbaAtiva] = useState('Receitas'); // 'Receitas' ou 'Aplicações'
    const [receitas] = useState(INITIAL_RECEITAS);
    const [aplicacoes, setAplicacoes] = useState(INITIAL_APLICACOES);
    
    // Modal Aplicar Receita
    const [modalVisible, setModalVisible] = useState(false);
    const [receitaSelecionada, setReceitaSelecionada] = useState(null);
    const [inputHa, setInputHa] = useState('1');

    const handleAbrirAplicacao = (receita) => {
        setReceitaSelecionada(receita);
        setInputHa('1');
        setModalVisible(true);
    };

    const handleConfirmarAplicacao = () => {
        const ha = parseFloat(inputHa.replace(',', '.'));
        if (isNaN(ha) || ha <= 0) {
            Alert.alert('Erro', 'Insira uma área válida em hectares.');
            return;
        }

        // Simulação de check de estoque
        let rupturas = [];
        receitaSelecionada.itens.forEach(item => {
            const doseStr = item.qtd.split(' ')[0]; 
            const dose = parseFloat(doseStr);
            const necessidade = dose * ha;
            
            if (necessidade > item.emEstoque) {
                rupturas.push(`⚠️ ${item.nome}: Necessita ${necessidade.toFixed(1)}, mas o Estoque é ${item.emEstoque}.`);
            }
        });

        if (rupturas.length > 0) {
            Alert.alert('Ruptura de Estoque!', rupturas.join('\n'));
            return;
        }

        const novaApp = {
            id: Math.random().toString(),
            receita: receitaSelecionada.nome,
            data: 'Hoje',
            area: 'Novo Talhão',
            ha: ha,
            status: 'Concluído'
        };

        setAplicacoes([novaApp, ...aplicacoes]);
        setModalVisible(false);
        setAbaAtiva('Aplicações');
        Alert.alert('Sucesso', 'Aplicação registrada e estoque debitado!');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Ionicons name="leaf" size={26} color="#10B981" />
                    <Text style={styles.headerTitle}>Adubação</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>

            {/* ABAS */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tabBtn, abaAtiva === 'Receitas' && styles.tabBtnActive]} 
                    onPress={() => setAbaAtiva('Receitas')}
                >
                    <Ionicons name="flask-outline" size={18} color={abaAtiva === 'Receitas' ? '#10B981' : '#64748B'} />
                    <Text style={[styles.tabText, abaAtiva === 'Receitas' && styles.tabTextActive]}>Receitas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabBtn, abaAtiva === 'Aplicações' && styles.tabBtnActive]} 
                    onPress={() => setAbaAtiva('Aplicações')}
                >
                    <Ionicons name="map-outline" size={18} color={abaAtiva === 'Aplicações' ? '#10B981' : '#64748B'} />
                    <Text style={[styles.tabText, abaAtiva === 'Aplicações' && styles.tabTextActive]}>Aplicações</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {abaAtiva === 'Receitas' ? (
                    <>
                        <View style={styles.headerSectionRow}>
                            <Text style={styles.sectionTitle}>Caderno de Receitas</Text>
                        </View>
                        {receitas.map(rec => (
                            <View key={rec.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.typeBadge, rec.tipo === 'Foliar' ? { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6'} : {backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B'}]}>
                                        <Text style={[styles.typeText, rec.tipo === 'Foliar' ? { color: '#3B82F6'} : {color: '#F59E0B'}]}>{rec.tipo}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.iconBtn}>
                                        <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                
                                <Text style={styles.cardTitle}>{rec.nome}</Text>
                                
                                <View style={styles.itemsList}>
                                    {rec.itens.map((item, idx) => (
                                        <View key={idx} style={styles.itemRow}>
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <View style={styles.bullet} />
                                                <Text style={styles.itemName}>{item.nome}</Text>
                                            </View>
                                            <Text style={styles.itemDose}>{item.qtd}</Text>
                                        </View>
                                    ))}
                                </View>
                                
                                <View style={styles.divider} />
                                
                                <TouchableOpacity style={styles.applyBtn} onPress={() => handleAbrirAplicacao(rec)}>
                                    <Ionicons name="color-fill" size={18} color="#000" />
                                    <Text style={styles.applyBtnText}>Aplicar Receita</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                ) : (
                    <>
                        <View style={styles.headerSectionRow}>
                            <Text style={styles.sectionTitle}>Histórico de Campo</Text>
                        </View>
                        {aplicacoes.map(app => (
                            <View key={app.id} style={styles.appCard}>
                                <View style={styles.appCardIcon}>
                                    <Ionicons name="checkmark-done-circle" size={28} color="#10B981" />
                                </View>
                                <View style={styles.appCardInfo}>
                                    <Text style={styles.appRecipeName}>{app.receita}</Text>
                                    <View style={styles.appDetailsRow}>
                                        <Text style={styles.appDate}>{app.data}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.appArea}>{app.area}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.appHa}>{app.ha} ha</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* MODAL DE APLICAÇÃO INTELIGENTE */}
            {receitaSelecionada && (
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Executar Aplicação</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={styles.modalSubtitle}>Você está aplicando: <Text style={{color: '#10B981'}}>{receitaSelecionada.nome}</Text></Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tamanho da Área (Hectares)</Text>
                                <TextInput 
                                    style={styles.input} 
                                    keyboardType="numeric" 
                                    value={inputHa}
                                    onChangeText={setInputHa}
                                />
                            </View>

                            {/* Lógica de Estoque na Tela */}
                            <Text style={styles.previsaoLabel}>Previsão de Consumo & Estoque:</Text>
                            <View style={styles.estoqueBox}>
                                {receitaSelecionada.itens.map((it, i) => {
                                    const doseNum = parseFloat(it.qtd.split(' ')[0]);
                                    const area = parseFloat(inputHa.replace(',', '.')) || 0;
                                    const consumo = doseNum * area;
                                    const temEstoque = consumo <= it.emEstoque;
                                    
                                    return (
                                        <View key={i} style={styles.estoqueRow}>
                                            <View>
                                                <Text style={styles.estItemName}>{it.nome}</Text>
                                                <Text style={styles.estItemDose}>{consumo.toFixed(1)} {it.qtd.split(' ')[1]} necessários</Text>
                                            </View>
                                            <View style={styles.estStatusBadge}>
                                                <Ionicons name={temEstoque ? "checkmark-circle" : "warning"} size={14} color={temEstoque ? "#10B981" : "#EF4444"} />
                                                <Text style={[styles.estStatusText, {color: temEstoque ? '#10B981' : '#EF4444'}]}>
                                                    Estoque: {it.emEstoque}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmarAplicacao}>
                                <Text style={styles.confirmBtnText}>CONFIRMAR E DEBITAR ESTOQUE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

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
    
    tabsContainer: { flexDirection: 'row', backgroundColor: '#111827', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6 },
    tabBtnActive: { borderBottomColor: '#10B981' },
    tabText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
    tabTextActive: { color: '#10B981', fontWeight: '900' },

    content: { padding: 20, paddingBottom: 40 },
    
    headerSectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },

    card: { backgroundColor: '#111827', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    typeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    iconBtn: { padding: 4 },
    cardTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginBottom: 15 },
    
    itemsList: { backgroundColor: '#0B121E', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#1F2937' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#475569', marginRight: 10 },
    itemName: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
    itemDose: { color: '#10B981', fontSize: 13, fontWeight: '800' },

    divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 15 },
    
    applyBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
    applyBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },

    appCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
    appCardIcon: { marginRight: 15 },
    appCardInfo: { flex: 1 },
    appRecipeName: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    appDetailsRow: { flexDirection: 'row', alignItems: 'center' },
    appDate: { color: '#64748B', fontSize: 12, fontWeight: '600' },
    appArea: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    appHa: { color: '#3B82F6', fontSize: 12, fontWeight: '800' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 8 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: Platform.OS === 'ios' ? 50 : 30, borderWidth: 1, borderColor: '#1F2937' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    modalSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 25 },
    
    inputContainer: { marginBottom: 20 },
    inputLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#0B121E', borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', color: '#F8FAFC', fontSize: 18, padding: 15, fontWeight: '700' },

    previsaoLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginBottom: 10 },
    estoqueBox: { backgroundColor: '#0B121E', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#1F2937', marginBottom: 25 },
    estoqueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    estItemName: { color: '#E2E8F0', fontSize: 13, fontWeight: '800', marginBottom: 2 },
    estItemDose: { color: '#64748B', fontSize: 11, fontWeight: '600' },
    estStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    estStatusText: { fontSize: 11, fontWeight: '800' },

    confirmBtn: { backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    confirmBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }
});
