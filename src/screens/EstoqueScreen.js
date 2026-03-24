import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import { useInventory } from '../modules/inventory/hooks/useInventory';

export default function EstoqueScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const { items: originalItems, loading, error, fetchStock, adjustStock } = useInventory();
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('ENTRADA');
    const [qty, setQty] = useState('');

    useFocusEffect(useCallback(() => { 
        fetchStock(); 
    }, [fetchStock]));

    const filteredItems = useMemo(() => {
        if (!originalItems) return [];
        let res = [...originalItems];
        if (searchText) {
            res = res.filter(i => i.produto.toUpperCase().includes(searchText.toUpperCase()));
        }
        return res;
    }, [originalItems, searchText]);

    const getStatusInfo = useCallback((qtd) => {
        if (qtd <= 0) return { color: colors.danger, label: 'ESGOTADO', bg: (colors.danger || '#EF4444') + '15' };
        if (qtd <= 10) return { color: colors.warning, label: 'BAIXO', bg: (colors.warning || '#F59E0B') + '15' };
        return { color: colors.primary, label: 'NORMAL', bg: (colors.primary || '#1E8E5A') + '15' };
    }, [colors]);

    const openModal = useCallback((item, type) => {
        setSelectedItem(item); setActionType(type); setQty(''); setModalVisible(true);
    }, []);

    const confirmAction = useCallback(async () => {
        if (!qty || isNaN(parseFloat(qty)) || parseFloat(qty) <= 0) return Alert.alert('Erro', 'Valor inválido.');
        const delta = actionType === 'ENTRADA' ? parseFloat(qty) : -parseFloat(qty);
        try {
            await adjustStock(selectedItem.produto, delta);
            setModalVisible(false); 
            showToast('✅ Estoque atualizado!');
        } catch (err) { 
            Alert.alert('Erro', 'Falha ao atualizar estoque.'); 
        }
    }, [qty, actionType, selectedItem, adjustStock]);

    const renderItem = useCallback(({ item }) => {
        const st = getStatusInfo(item.quantidade);
        return (
            <GlowCard style={styles.itemCard}>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.produto}</Text>
                    <View style={styles.itemStatsRow}>
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}><Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text></View>
                        <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>Disponível: <Text style={{ color: colors.primary, fontWeight: '900' }}>{item.quantidade} {item.unidade}</Text></Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openModal(item, 'ENTRADA')} style={[styles.miniBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F7F6', borderColor: colors.border, borderWidth: 1 }]}><Ionicons name="add" size={20} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => openModal(item, 'SAIDA')} style={[styles.miniBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F7F6', borderColor: colors.border, borderWidth: 1 }]}><Ionicons name="remove" size={20} color={colors.danger} /></TouchableOpacity>
                </View>
            </GlowCard>
        );
    }, [colors, isDark, getStatusInfo, openModal]);

    return (
        <AppContainer>
            <ScreenHeader title="ESTOQUE" onBack={() => navigation.goBack()} />
            {loading && !originalItems.length ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item, index) => item.produto + index}
                    renderItem={renderItem}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    ListHeaderComponent={() => (
                        <View style={styles.header}>
                            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                                <Ionicons name="search" size={18} color={colors.textMuted} />
                                <GlowInput 
                                    placeholder="Pesquisar estoque..." 
                                    style={{ flex: 1, height: 45, marginBottom: 0, borderWidth: 0 }}
                                    value={searchText} 
                                    onChangeText={setSearchText} 
                                />
                            </View>
                            {error && <Text style={{ color: colors.danger, marginTop: 10, textAlign: 'center' }}>{error}</Text>}
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={fetchStock}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 50 }}>Nenhum item no estoque.</Text>}
                />
            )}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <GlowCard style={styles.miniModal}>
                        <View style={{ padding: 10 }}>
                            <Text style={{ textAlign: 'center', fontWeight: '900', fontSize: 16, color: colors.textPrimary, marginBottom: 20, letterSpacing: 1 }}>
                                {actionType === 'ENTRADA' ? 'ENTRADA DE ESTOQUE' : 'BAIXA DE ESTOQUE'}
                            </Text>
                            <GlowInput 
                                placeholder="0.00"
                                value={qty} 
                                onChangeText={setQty} 
                                keyboardType="decimal-pad" 
                                autoFocus
                                style={{ fontSize: 24, textAlign: 'center', height: 60 }}
                            />
                            <View style={{ gap: 12, marginTop: 10 }}>
                                <PrimaryButton title="CONFIRMAR" onPress={confirmAction} />
                                <TouchableOpacity 
                                    onPress={() => setModalVisible(false)}
                                    style={{ alignSelf: 'center', padding: 10 }}
                                >
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </GlowCard>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    header: { padding: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 16, borderWidth: 1.5, height: 55 },
    listContent: { paddingBottom: 100 },
    itemCard: { marginHorizontal: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '900' },
    itemStatsRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 9, fontWeight: '900' },
    qtyLabel: { fontSize: 12 },
    actions: { flexDirection: 'row', gap: 8 },
    miniBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 30 },
    miniModal: { padding: 10, borderRadius: 24 }
});
