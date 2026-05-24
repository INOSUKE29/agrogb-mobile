/**
 * EstoqueScreen.js â€” AgroGB Diamond Pro
 * Ultra Premium Glassmorphism & Neon Glow Design
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    Modal, Alert, TextInput, SafeAreaView, StatusBar,
    Platform, ActivityIndicator, RefreshControl, Dimensions, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useInventory } from '../modules/inventory/hooks/useInventory';
import { showToast } from '../ui/Toast';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// â”€â”€ CONSTANTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIAS = [
    { key: 'TODOS',     label: 'Todos',     icon: 'apps',       color: '#9CA3AF' },
    { key: 'INSUMO',    label: 'Insumos',   icon: 'flask',      color: '#A855F7' },
    { key: 'SEMENTE',   label: 'Sementes',  icon: 'leaf',       color: '#10B981' },
    { key: 'PRODUTO',   label: 'Produtos',  icon: 'basket',     color: '#F59E0B' },
    { key: 'FERRAMENTA',label: 'Ferram.',   icon: 'construct',  color: '#F43F5E' },
    { key: 'EMBALAGEM', label: 'Embalagem', icon: 'cube',       color: '#3B82F6' },
];

const getStatus = (qty, minQty = 10) => {
    if (qty <= 0)       return { key: 'ESGOTADO', label: 'ESGOTADO', color: '#F43F5E', bg: 'rgba(244,63,94,0.15)', icon: 'close-circle' };
    if (qty <= minQty)  return { key: 'BAIXO',    label: 'BAIXO',    color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: 'warning' };
    return               { key: 'NORMAL',   label: 'NORMAL',   color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: 'checkmark-circle' };
};

export default function EstoqueScreen({ navigation }) {
    const { items: allItems, loading, fetchStock, adjustStock } = useInventory();
    const { userSession } = useAuth();
    const isAgronomo = userSession?.role === 'AGRONOMO';

    const [searchText, setSearchText] = useState('');
    const [activeCategoria, setActiveCategoria] = useState('TODOS');
    const [activeFilter, setActiveFilter] = useState('TODOS'); 

    const [modalItem, setModalItem] = useState(null);
    const [modalType, setModalType] = useState('ENTRADA'); 
    const [qty, setQty] = useState('');
    const [saving, setSaving] = useState(false);

    useFocusEffect(useCallback(() => { fetchStock(); }, [fetchStock]));

    const onRefresh = useCallback(() => fetchStock(), [fetchStock]);

    const filteredItems = useMemo(() => {
        let res = allItems || [];
        if (searchText.trim()) {
            res = res.filter(i => i.produto?.toUpperCase().includes(searchText.toUpperCase()));
        }
        if (activeCategoria !== 'TODOS') {
            res = res.filter(i => i.categoria?.toUpperCase() === activeCategoria);
        }
        if (activeFilter === 'BAIXO') {
            res = res.filter(i => i.quantidade > 0 && i.quantidade <= (i.estoque_minimo || 10));
        } else if (activeFilter === 'ESGOTADO') {
            res = res.filter(i => i.quantidade <= 0);
        }
        return res;
    }, [allItems, searchText, activeCategoria, activeFilter]);

    const stats = useMemo(() => {
        const items = allItems || [];
        return {
            total: items.length,
            normal: items.filter(i => i.quantidade > (i.estoque_minimo || 10)).length,
            baixo: items.filter(i => i.quantidade > 0 && i.quantidade <= (i.estoque_minimo || 10)).length,
            esgotado: items.filter(i => i.quantidade <= 0).length,
        };
    }, [allItems]);

    const openModal = useCallback((item, type) => {
        setModalItem(item); setModalType(type); setQty('');
    }, []);

    const handleAdjust = async () => {
        const val = parseFloat(qty);
        if (!val || val <= 0) return Alert.alert('Ops', 'Informe uma quantidade vÃ¡lida!');
        setSaving(true);
        try {
            const delta = modalType === 'ENTRADA' ? val : -val;
            await adjustStock(modalItem.produto, delta);
            setModalItem(null);
            showToast(modalType === 'ENTRADA'
                ? `âœ¨ +${val} ${modalItem.unidade || 'un'} no estoque`
                : `ðŸ“¤ -${val} ${modalItem.unidade || 'un'} baixado`
            );
        } catch {
            Alert.alert('Erro', 'Falha ao processar o estoque.');
        } finally { setSaving(false); }
    };

    const renderItem = useCallback(({ item }) => {
        const st = getStatus(item.quantidade, item.estoque_minimo || 10);
        const cat = CATEGORIAS.find(c => c.key === item.categoria?.toUpperCase()) || CATEGORIAS[1];
        const pctFull = Math.min(100, Math.max(0, (item.quantidade / Math.max(item.estoque_maximo || 100, 1)) * 100));

        return (
            <View style={styles.glassCard}>
                <View style={styles.cardGlowTopLeft} />
                
                <View style={[styles.itemIconBox, { backgroundColor: cat.color + '15', borderColor: cat.color + '40' }]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.produto}</Text>
                        <View style={[styles.statusChip, { backgroundColor: st.bg, borderColor: st.color + '40' }]}>
                            <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                            <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <LinearGradient 
                            colors={[st.color + '90', st.color]} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={[styles.progressFill, { width: `${pctFull}%` }]} 
                        />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={[styles.itemQty, { color: st.color }]}>{item.quantidade}</Text>
                            <Text style={styles.itemUnit}> {item.unidade || 'un'}</Text>
                        </View>
                        {item.estoque_minimo && <Text style={styles.itemMin}>ESTOQUE MÃN: {item.estoque_minimo}</Text>}
                    </View>
                </View>

                {isAgronomo ? null : (
                    <View style={styles.itemActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]}
                            onPress={() => openModal(item, 'ENTRADA')}
                        >
                            <Ionicons name="add" size={20} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(244,63,94,0.1)' }]}
                            onPress={() => openModal(item, 'SAIDA')}
                        >
                            <Ionicons name="remove" size={20} color="#F43F5E" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }, [openModal]);

    return (
        <View style={styles.container}>
            
            
            
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center' }}>
                {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingLeft: 4 }}>
                        <Text style={styles.headerTitle}>Armazém <Text style={{ color: '#F59E0B' }}>&</Text> Estoque</Text>
                        <Text style={styles.headerSub}>Visão Geral e Movimentações</Text>
                    </View>
                    {isAgronomo ? null : (
                        <TouchableOpacity style={styles.addBtnHeader} onPress={() => navigation?.navigate?.('CadastroForm')}>
                            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.addGradientIcon}>
                                <Ionicons name="add" size={24} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredItems}
                    keyExtractor={(item, index) => `${item.produto}-${index}`}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#F59E0B" />}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={() => (
                        <View style={{ paddingBottom: 10 }}>
                            {/* â”€â”€ STATS DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                            <View style={styles.statsRow}>
                                {[
                                    { label: 'Total',    value: stats.total,    color: '#38BDF8', icon: 'cube-outline' },
                                    { label: 'Normal',   value: stats.normal,   color: '#10B981', icon: 'shield-checkmark-outline' },
                                    { label: 'Baixo',    value: stats.baixo,    color: '#F59E0B', icon: 'warning-outline' },
                                    { label: 'Esgotado', value: stats.esgotado, color: '#F43F5E', icon: 'close-circle-outline' },
                                ].map((s, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.statCard, 
                                            activeFilter === (s.label === 'Total' ? 'TODOS' : s.label.toUpperCase()) 
                                                ? { backgroundColor: s.color + '15', borderColor: s.color + '50' }
                                                : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
                                        ]}
                                        onPress={() => setActiveFilter(s.label === 'Total' ? 'TODOS' : s.label.toUpperCase())}
                                    >
                                        <Ionicons name={s.icon} size={20} color={s.color} style={{ marginBottom: 6 }} />
                                        <Text style={[styles.statValue, { color: '#FFF' }]}>{s.value}</Text>
                                        <Text style={styles.statLabel}>{s.label}</Text>
                                        
                                        {activeFilter === (s.label === 'Total' ? 'TODOS' : s.label.toUpperCase()) && (
                                            <View style={[styles.statGlowBottom, { backgroundColor: s.color }]} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* â”€â”€ SEARCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                            <View style={styles.searchContainer}>
                                <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={styles.searchBox}>
                                    <Ionicons name="search" size={18} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Pesquisar produto..."
                                        placeholderTextColor="#6B7280"
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                    {searchText.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchText('')}>
                                            <Ionicons name="close-circle" size={18} color="#F43F5E" />
                                        </TouchableOpacity>
                                    )}
                                </LinearGradient>
                            </View>

                            {/* â”€â”€ CATEGORY FILTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                            <View style={styles.chipScrollContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                    {CATEGORIAS.map(cat => (
                                        <TouchableOpacity
                                            key={cat.key}
                                            style={[
                                                styles.catChip,
                                                activeCategoria === cat.key ? { backgroundColor: cat.color, borderColor: cat.color } : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
                                            ]}
                                            onPress={() => setActiveCategoria(cat.key)}
                                        >
                                            <Ionicons name={cat.icon} size={14} color={activeCategoria === cat.key ? '#FFF' : cat.color} />
                                            <Text style={[styles.catChipText, { color: activeCategoria === cat.key ? '#FFF' : '#E2E8F0' }]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* â”€â”€ LIST HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                            <View style={styles.listHeaderRow}>
                                <Text style={styles.listHeaderText}>INVENTÃRIO</Text>
                                {activeFilter !== 'TODOS' && (
                                    <TouchableOpacity onPress={() => setActiveFilter('TODOS')} style={styles.clearFilter}>
                                        <Text style={styles.clearFilterText}>Limpar filtro</Text>
                                        <Ionicons name="close" size={12} color="#F43F5E" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyBox}>
                                <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.01)']} style={styles.emptyRing}>
                                    <MaterialCommunityIcons name="warehouse" size={38} color="#F59E0B" />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>Armazém vazio</Text>
                                <Text style={styles.emptyDesc}>
                                    {searchText ? 'Nenhum item encontrado para esta busca.' : 'Cadastre insumos para o controle diário.'}
                                </Text>
                                {(!searchText && !isAgronomo) && (
                                    <TouchableOpacity onPress={() => navigation?.navigate?.('CadastroForm')}>
                                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.emptyBtnGradient}>
                                            <Ionicons name="add" size={18} color="#FFF" />
                                            <Text style={styles.emptyBtnText}>Cadastrar Item</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )
                    }
                />
            </SafeAreaView>

            {/* â”€â”€ MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal visible={!!modalItem} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalItem(null)} />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        
                        <View style={styles.modalHeaderRow}>
                            <View style={[styles.modalTypeIcon, { backgroundColor: (modalType === 'ENTRADA' ? '#10B981' : '#F43F5E') + '15' }]}>
                                <Ionicons name={modalType === 'ENTRADA' ? 'arrow-down' : 'arrow-up'} size={26} color={modalType === 'ENTRADA' ? '#10B981' : '#F43F5E'} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.modalTitle}>{modalType === 'ENTRADA' ? 'ENTRADA DE ESTOQUE' : 'SAÃDA DE ESTOQUE'}</Text>
                                <Text style={styles.modalProductName} numberOfLines={1}>{modalItem?.produto}</Text>
                            </View>
                        </View>

                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeToggleBtn, modalType === 'ENTRADA' ? { backgroundColor: '#10B98120', borderColor: '#10B981' } : {}]}
                                onPress={() => setModalType('ENTRADA')}
                            >
                                <Text style={[styles.typeToggleBtnText, { color: modalType === 'ENTRADA' ? '#10B981' : '#6B7280' }]}>ENTRADA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeToggleBtn, modalType === 'SAIDA' ? { backgroundColor: '#F43F5E20', borderColor: '#F43F5E' } : {}]}
                                onPress={() => setModalType('SAIDA')}
                            >
                                <Text style={[styles.typeToggleBtnText, { color: modalType === 'SAIDA' ? '#F43F5E' : '#6B7280' }]}>SAÃDA</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.qtyLabel}>QUANTIDADE ({modalItem?.unidade || 'un'})</Text>
                        <View style={styles.qtyBox}>
                            <TextInput
                                style={[styles.qtyInput, { color: modalType === 'ENTRADA' ? '#10B981' : '#F43F5E' }]}
                                value={qty}
                                onChangeText={setQty}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor="#334155"
                                autoFocus
                            />
                        </View>

                        <View style={styles.quickAmounts}>
                            {['1', '5', '10', '25'].map(v => (
                                <TouchableOpacity key={v} style={styles.quickAmountBtn} onPress={() => setQty(String(parseFloat(qty || 0) + parseFloat(v)))}>
                                    <Text style={styles.quickAmountText}>+{v}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.confirmBtn} onPress={handleAdjust}>
                            <LinearGradient colors={modalType === 'ENTRADA' ? ['#059669', '#047857'] : ['#E11D48', '#BE123C']} style={styles.confirmGradient}>
                                {saving ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                        <Text style={styles.confirmText}>CONFIRMAR {modalType}</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' }, 
    ambientOrb1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#F59E0B', opacity: 0.08 },
    ambientOrb2: { position: 'absolute', bottom: 100, left: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: '#3B82F6', opacity: 0.05 },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 25, paddingBottom: 20 },
    backBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    addBtnHeader: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    addGradientIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    listContent: { paddingHorizontal: 22, paddingBottom: 100 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: { flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
    statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
    statGlowBottom: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3, shadowOpacity: 1, shadowRadius: 10 },

    searchContainer: { marginBottom: 18 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 12 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },

    chipScrollContainer: { marginBottom: 24, marginHorizontal: -22 },
    chipRow: { paddingHorizontal: 22, gap: 10, alignItems: 'center' },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    catChipText: { fontSize: 13, fontWeight: '700' },

    listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    listHeaderText: { color: '#64748B', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    clearFilter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    clearFilterText: { color: '#F43F5E', fontSize: 11, fontWeight: '800' },

    glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16 },
    cardGlowTopLeft: { position: 'absolute', top: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 40 },
    itemIconBox: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    itemName: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', flex: 1, letterSpacing: -0.3 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    
    progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    
    itemQty: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    itemUnit: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
    itemMin: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    
    itemActions: { gap: 10 },
    actionBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    emptyBox: { alignItems: 'center', paddingVertical: 60 },
    emptyRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderStyle: 'dashed' },
    emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 8 },
    emptyDesc: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    emptyBtnGradient: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    emptyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#0B1120', borderRadius: 30, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    modalHandle: { display: 'none' },
    
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    modalTypeIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    modalProductName: { color: '#F8FAFC', fontSize: 20, fontWeight: '900', marginTop: 2 },
    
    typeToggle: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeToggleBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
    typeToggleBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    qtyLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
    qtyBox: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginBottom: 20 },
    qtyInput: { height: 80, textAlign: 'center', fontSize: 36, fontWeight: '900' },

    quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    quickAmountBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    quickAmountText: { color: '#CBD5E1', fontSize: 14, fontWeight: '800' },

    confirmBtn: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
    confirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 18, gap: 12 },
    confirmText: { color: '#FAFAFA', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});

