import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, View } from 'react-native';
import AgroButton from '../ui/components/AgroButton';
import { getEstoque, atualizarEstoque } from '../services/EstoqueService';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';

export default function EstoqueScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [originalItems, setOriginalItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filter] = useState('TODOS');
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('ENTRADA');
    const [qty, setQty] = useState('');

    const loadData = async () => {
        try {
            const data = await getEstoque();
            const sorted = data.sort((a, b) => (a.produto < b.produto ? -1 : 1));
            setOriginalItems(sorted);
            applyFilter(sorted, filter, searchText);
        } catch { }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [filter, searchText]));
    useEffect(() => { applyFilter(originalItems, filter, searchText); }, [filter, searchText]);

    const applyFilter = (data, mode, text) => {
        let res = data;
        if (mode === 'LOW') res = res.filter(i => i.quantidade > 0 && i.quantidade <= 10);
        if (mode === 'ZERO') res = res.filter(i => i.quantidade <= 0);
        if (text) res = res.filter(i => i.produto.toUpperCase().includes(text.toUpperCase()));
        setFilteredItems(res);
    };

    const getStatusInfo = (qtd) => {
        if (qtd <= 0) return { color: colors.danger, label: 'ESGOTADO', bg: (colors.danger) + '15' };
        if (qtd <= 10) return { color: colors.warning, label: 'BAIXO', bg: (colors.warning) + '15' };
        return { color: colors.primary, label: 'NORMAL', bg: (colors.primary) + '15' };
    };

    const openModal = (item, type) => {
        setSelectedItem(item); setActionType(type); setQty(''); setModalVisible(true);
    };

    const confirmAction = async () => {
        if (!qty || isNaN(qty) || parseFloat(qty) <= 0) return Alert.alert('Erro', 'Valor inválido.');
        const delta = actionType === 'ENTRADA' ? parseFloat(qty) : -parseFloat(qty);
        try {
            await atualizarEstoque(selectedItem.produto, delta);
            setModalVisible(false); showToast('Estoque atualizado!'); loadData();
        } catch { Alert.alert('Erro', 'Falha ao atualizar.'); }
    };

    const renderItem = ({ item }) => {
        const st = getStatusInfo(item.quantidade);
        return (
            <Card style={styles.itemCard}>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.produto}</Text>
                    <View style={styles.itemStatsRow}>
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}><Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text></View>
                        <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>Disponível: <Text style={{ color: colors.primary, fontWeight: '900' }}>{item.quantidade} {item.unidade}</Text></Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openModal(item, 'ENTRADA')} style={[styles.miniBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F7F6' }]}><Ionicons name="add" size={20} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => openModal(item, 'SAIDA')} style={[styles.miniBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F7F6' }]}><Ionicons name="remove" size={20} color={colors.danger} /></TouchableOpacity>
                </View>
            </Card>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader title="ESTOQUE" onBack={() => navigation.goBack()} />
            <FlatList
                data={filteredItems}
                keyExtractor={(item, index) => item.produto + index}
                renderItem={renderItem}
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <TextInput 
                            style={[
                                styles.inputSearch, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F7F6',
                                    borderColor: colors.border,
                                    color: colors.textPrimary 
                                }
                            ]} 
                            placeholder="Pesquisar estoque..." 
                            placeholderTextColor={colors.placeholder}
                            value={searchText} 
                            onChangeText={setSearchText} 
                        />
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <Card style={[styles.miniModal, { backgroundColor: colors.surface }]}>
                        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: colors.textPrimary, marginBottom: 20 }}>
                            {actionType === 'ENTRADA' ? 'ENTRADA DE ESTOQUE' : 'BAIXA DE ESTOQUE'}
                        </Text>
                        <TextInput 
                            style={[styles.modalInput, { borderBottomColor: colors.primary, color: colors.textPrimary }]} 
                            value={qty} 
                            onChangeText={setQty} 
                            keyboardType="decimal-pad" 
                            autoFocus
                        />
                        <View style={{ gap: 10 }}>
                            <AgroButton title="CONFIRMAR" onPress={confirmAction} />
                            <AgroButton title="VOLTAR" variant="secondary" onPress={() => setModalVisible(false)} />
                        </View>
                    </Card>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    header: { padding: 20 },
    inputSearch: { padding: 14, borderRadius: 16, borderWidth: 1 },
    listContent: { paddingBottom: 100 },
    itemCard: { marginHorizontal: 20, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    itemStatsRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
    statusBadge: { padding: 4, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    qtyLabel: { fontSize: 12 },
    actions: { flexDirection: 'row', gap: 5 },
    miniBtn: { padding: 10, borderRadius: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 30 },
    miniModal: { padding: 20, borderRadius: 20 },
    modalInput: { fontSize: 30, textAlign: 'center', borderBottomWidth: 1.5, marginBottom: 20 }
});
