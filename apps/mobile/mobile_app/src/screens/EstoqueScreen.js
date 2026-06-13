import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { getEstoque, atualizarEstoque, insertFinanceiroTransacao } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

// Design System
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

const FILTROS = ['TODOS', 'BAIXO', 'ACABOU'];

export default function EstoqueScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [originalItems, setOriginalItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [searchText, setSearchText] = useState('');

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('ENTRADA'); // 'ENTRADA' | 'SAIDA'
    const [qty, setQty] = useState('');
    const [valorTotal, setValorTotal] = useState(''); // Opcional para integração financeira
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getEstoque();
            const sorted = data.sort((a, b) => a.produto.localeCompare(b.produto));
            setOriginalItems(sorted);
            applyFilter(sorted, filterStatus, searchText);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));
    useEffect(() => { applyFilter(originalItems, filterStatus, searchText); }, [filterStatus, searchText, originalItems]);

    const applyFilter = (data, mode, text) => {
        let res = data;
        if (mode === 'BAIXO') res = res.filter(i => i.quantidade > 0 && i.quantidade <= 10);
        if (mode === 'ACABOU') res = res.filter(i => i.quantidade <= 0);
        if (text) res = res.filter(i => i.produto.toUpperCase().includes(text.toUpperCase()));
        setFilteredItems(res);
    };

    const getDynamicStatus = (qtd) => {
        if (qtd <= 0) return { label: 'ESGOTADO', color: '#EF4444', icon: 'close-circle' };
        if (qtd <= 10) return { label: 'BAIXO', color: '#F59E0B', icon: 'warning' };
        return { label: 'NORMAL', color: '#10B981', icon: 'checkmark-circle' };
    };

    const openModal = (item, type) => {
        setSelectedItem(item);
        setActionType(type);
        setQty('');
        setValorTotal('');
        setModalVisible(true);
    };

    const confirmAction = async () => {
        if (!qty || isNaN(qty) || parseFloat(qty) <= 0) {
            Alert.alert('Erro', 'Digite um valor válido maior que zero.');
            return;
        }
        const delta = actionType === 'ENTRADA' ? parseFloat(qty) : -parseFloat(qty);
        try {
            await atualizarEstoque(selectedItem.produto, delta);
            
            // Integração Opcional e Desacoplada com o Financeiro
            if (actionType === 'ENTRADA' && valorTotal && parseFloat(valorTotal.replace(',', '.')) > 0) {
                try {
                    await insertFinanceiroTransacao({
                        uuid: uuidv4(),
                        tipo: 'PAGAR',
                        descricao: `COMPRA DE ESTOQUE: ${selectedItem.produto.toUpperCase()}`,
                        valor: parseFloat(valorTotal.replace(',', '.')),
                        vencimento: new Date().toISOString().split('T')[0],
                        entidade_nome: 'FORNECEDOR',
                        categoria: 'INSUMOS',
                        status: 'PENDENTE'
                    });
                } catch (finError) {
                    console.log("Falha ao integrar com financeiro de forma silenciosa", finError);
                }
            }

            setModalVisible(false);
            Alert.alert('Sucesso', `Lançamento de ${actionType.toLowerCase()} realizado!`);
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível atualizar o estoque agora.');
        }
    };

    const lowStockCount = originalItems.filter(i => i.quantidade <= 10 && i.quantidade > 0).length;
    const zeroStockCount = originalItems.filter(i => i.quantidade <= 0).length;
    const totalStockValue = originalItems.reduce((acc, item) => acc + ((item.quantidade || 0) * (item.preco_venda || 0)), 0);
    const formattedStockValue = Number(totalStockValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* CABEÇALHO GLASSMORPHISM */}
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>MEU ESTOQUE</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* KPIs Principais */}
                    <View style={styles.kpiMain}>
                        <Text style={styles.kpiMainLabel}>VALOR EM ESTOQUE</Text>
                        <Text style={[styles.kpiMainValue, { color: '#3B82F6' }]}>{formattedStockValue}</Text>
                    </View>

                    <View style={styles.kpiContainer}>
                        <View style={styles.kpiCard}>
                            <Ionicons name="cube" size={16} color="#10B981" style={{marginBottom: 4}} />
                            <Text style={styles.kpiLabel}>ITENS TOTAIS</Text>
                            <Text style={[styles.kpiValue, { color: '#FFF' }]}>{originalItems.length}</Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Ionicons name="warning" size={16} color="#F59E0B" style={{marginBottom: 4}} />
                            <Text style={styles.kpiLabel}>ACABANDO</Text>
                            <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{lowStockCount}</Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Ionicons name="close-circle" size={16} color="#EF4444" style={{marginBottom: 4}} />
                            <Text style={styles.kpiLabel}>ESGOTADOS</Text>
                            <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{zeroStockCount}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* BUSCA E FILTROS */}
            <View style={styles.filtersContainer}>
                <View style={styles.searchWrap}>
                    <AgroInput 
                        placeholder="Buscar produto..."
                        value={searchText}
                        onChangeText={setSearchText}
                        icon="search"
                        style={{ backgroundColor: '#1F2937', borderWidth: 0 }}
                    />
                </View>
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
                    data={filteredItems}
                    keyExtractor={item => item.produto}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}

                    renderItem={({ item }) => {
                        const dyn = getDynamicStatus(item.quantidade);
                        return (
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onLongPress={() => setSelectedItemActions(item)}
                                style={styles.cardContainer}
                            >
                                <LinearGradient colors={['#1F2937', '#111827']} style={styles.cardGradient}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.produto}</Text>
                                        <View style={[styles.statusTag, { backgroundColor: dyn.color + '20', borderColor: dyn.color }]}>
                                            <Ionicons name={dyn.icon} size={10} color={dyn.color} style={{marginRight: 4}} />
                                            <Text style={[styles.statusText, { color: dyn.color }]}>{dyn.label}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardBody}>
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>QUANTIDADE</Text>
                                            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                                                <Text style={[styles.infoValueLg, { color: dyn.color }]}>{item.quantidade}</Text>
                                                <Text style={styles.infoUnit}>{item.unidade || 'un'}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity 
                                                style={[styles.quickBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                                                onPress={() => openModal(item, 'SAIDA')}
                                            >
                                                <Ionicons name="remove" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.quickBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                                                onPress={() => openModal(item, 'ENTRADA')}
                                            >
                                                <Ionicons name="add" size={20} color="#10B981" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="package-variant-closed" size={60} color="#374151" />
                            <Text style={styles.emptyTxt}>Estoque vazio ou não encontrado.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Cadastro')}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGradient}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* MODAL DE AJUSTE RÁPIDO */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>{actionType === 'ENTRADA' ? 'ENTRADA DE ESTOQUE' : 'BAIXA DE ESTOQUE'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.selectedItemBox}>
                            <Text style={styles.selectedItemText}>{selectedItem?.produto}</Text>
                            <Text style={styles.selectedItemSub}>Qtd Atual: {selectedItem?.quantidade} {selectedItem?.unidade || 'un'}</Text>
                        </View>

                        <View style={{ marginBottom: actionType === 'ENTRADA' ? 10 : 20 }}>
                            <AgroInput 
                                label={actionType === 'ENTRADA' ? 'QUANTIDADE RECEBIDA *' : 'QUANTIDADE RETIRADA *'} 
                                value={qty} 
                                onChangeText={setQty} 
                                keyboardType="numeric"
                                placeholder="Ex: 10"
                                icon="cube-outline"
                            />
                        </View>

                        {actionType === 'ENTRADA' && (
                            <View style={{ marginBottom: 20 }}>
                                <AgroInput 
                                    label="VALOR DA COMPRA (R$) - Opcional" 
                                    value={valorTotal} 
                                    onChangeText={setValorTotal} 
                                    keyboardType="numeric"
                                    placeholder="Ex: 250.00"
                                    icon="cash-outline"
                                />
                                <Text style={{fontSize: 9, color: '#9CA3AF', marginTop: 5, marginLeft: 5}}>
                                    * Se preenchido, gera uma conta a pagar no módulo Financeiro automaticamente.
                                </Text>
                            </View>
                        )}

                        <AgroButton 
                            title={actionType === 'ENTRADA' ? 'CONFIRMAR ENTRADA' : 'CONFIRMAR BAIXA'} 
                            onPress={confirmAction} 
                            color={actionType === 'ENTRADA' ? '#10B981' : '#EF4444'}
                        />
                    </View>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.produto || ''}
                subtitle={`${selectedItemActions?.quantidade || 0} ${selectedItemActions?.unidade || 'un'} em estoque`}
                onEdit={() => { setSelectedItemActions(null); openModal(selectedItemActions, 'ENTRADA'); }}
                onDelete={() => { setSelectedItemActions(null); openModal(selectedItemActions, 'SAIDA'); }}
                editLabel="Lançar Entrada"
                deleteLabel="Lançar Saída"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    
    kpiMain: { alignItems: 'center', marginBottom: 20 },
    kpiMainLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 },
    kpiMainValue: { fontSize: 32, fontWeight: '900' },
    
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    kpiCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    kpiValue: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
    kpiLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 1 },
    
    filtersContainer: { marginTop: -20 },
    searchWrap: { paddingHorizontal: 20, marginBottom: 15 },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', marginRight: 10, borderWidth: 1, borderColor: '#374151' },
    pillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    pillText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    
    list: { padding: 20, paddingBottom: 100 },
    cardContainer: { marginBottom: 15, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    cardGradient: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', flex: 1, marginRight: 10 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, color: '#6B7280', fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    infoValueLg: { fontSize: 24, fontWeight: '900' },
    infoUnit: { fontSize: 12, color: '#9CA3AF', marginLeft: 4, fontWeight: 'bold' },
    
    actionsRow: { flexDirection: 'row', gap: 10 },
    quickBtn: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    
    fab: { position: 'absolute', bottom: 30, right: 25, elevation: 8 },
    fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    
    selectedItemBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
    selectedItemText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    selectedItemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyTxt: { color: '#9CA3AF', marginTop: 15, fontWeight: '700', fontSize: 14 }
});
