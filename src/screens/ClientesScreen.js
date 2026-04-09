import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, TextInput, SafeAreaView, StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

import { getClientes, deleteCliente } from '../database/database';
import ConfirmModal from '../ui/ConfirmModal';
import SafeBlurView from '../ui/SafeBlurView';

export default function ClientesScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const isFocused = useIsFocused();

    useEffect(() => { 
        if (isFocused) loadData(); 
    }, [isFocused]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            // Deduplicate logic existing from original code
            const uniqueData = [...new Map(data.map(item => [item.cpf_cnpj ? item.cpf_cnpj.trim() : item.nome.trim().toUpperCase(), item])).values()];
            setItems(uniqueData);
            setFilteredItems(uniqueData);
        } catch {
            // Error log
        } finally { 
            setLoading(false); 
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredItems(items);
            return;
        }
        const str = text.toLowerCase();
        const filtered = items.filter(i => 
            i.nome?.toLowerCase().includes(str) || 
            i.cpf_cnpj?.includes(str) || 
            i.cidade?.toLowerCase().includes(str)
        );
        setFilteredItems(filtered);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteCliente(itemToDelete);
            setConfirmVisible(false);
            setItemToDelete(null);
            loadData();
        }
    };

    // Card Renderer
    const renderItem = ({ item }) => {
        const isFornecedor = item.observacao?.includes('FORNECEDOR');
        const badgeColor = isFornecedor ? '#F59E0B' : '#3B82F6';
        const typeLabel = isFornecedor ? 'FORNECEDOR' : 'CLIENTE';

        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ClienteForm', { cliente: item })}
                style={styles.cardContainer}
            >
                <View style={styles.cardContent}>
                    {/* Linha 1 */}
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[styles.avatar, { borderColor: badgeColor }]}>
                                <Text style={[styles.avatarTxt, { color: badgeColor }]}>{item.nome.charAt(0)}</Text>
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
                                <Text style={styles.cardCpf}>{item.cpf_cnpj || 'Sem CPF/CNPJ Cadastrado'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={18} color="#F87171" />
                        </TouchableOpacity>
                    </View>

                    {/* Linha 2 */}
                    <View style={styles.cardFooter}>
                        <View style={styles.infoTag}>
                            <Ionicons name="call" size={12} color="#94A3B8" />
                            <Text style={styles.infoTagText}>{item.telefone || 'Sem contato'}</Text>
                        </View>

                        {item.cidade ? (
                            <View style={styles.infoTag}>
                                <Ionicons name="location" size={12} color="#94A3B8" />
                                <Text style={styles.infoTagText}>{item.cidade}</Text>
                            </View>
                        ) : null}

                        <View style={{ flex: 1 }} />

                        <View style={[styles.typeBadge, { backgroundColor: badgeColor + '15', borderColor: badgeColor + '30' }]}>
                            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{typeLabel}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <LinearGradient colors={['#040914', '#081222']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1 }}>
                {/* CRM HUB DASHBOARD */}
                <View style={styles.hubWrapper}>
                    <View style={styles.hubTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.hubMainTitle}>GESTÃO DE CONTATOS</Text>
                    </View>

                    <SafeBlurView intensity={20} style={styles.hubStatsCard}>
                        <View style={styles.hubStatsHeader}>
                            <View>
                                <Text style={styles.hubTitleText}>HUB <Text style={{ color: '#3B82F6' }}>CRM</Text></Text>
                                <Text style={styles.hubSubtitleText}>{items.length} REGISTROS TOTAIS</Text>
                            </View>
                            <View style={styles.activeIndicator}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.activeLabel}>ONLINE</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{items.filter(i => !i.observacao?.includes('FORNECEDOR')).length}</Text>
                                <Text style={styles.statLabel}>CLIENTES</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{items.filter(i => i.observacao?.includes('FORNECEDOR')).length}</Text>
                                <Text style={styles.statLabel}>FORNECEDORES</Text>
                            </View>
                        </View>
                    </SafeBlurView>

                    <View style={styles.hubActionsContainer}>
                        <TouchableOpacity 
                            style={styles.addMainBtn}
                            onPress={() => navigation.navigate('ClienteForm')}
                        >
                            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.addGradient}>
                                <Ionicons name="person-add" size={18} color="#FFF" />
                                <Text style={styles.addBtnText}>NOVO REGISTRO</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.searchToggleBtn}>
                            <Ionicons name="filter" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Barra de Busca Glassmorphism */}
                <View style={styles.searchWrapper}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#64748B" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar nome, CPF, cidade..."
                            placeholderTextColor="#64748B"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Lista */}
                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} />
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={item => item.uuid || Math.random().toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <View style={styles.emptyIconBox}>
                                    <Ionicons name="people" size={40} color="#3B82F6" />
                                </View>
                                <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
                                <Text style={styles.emptySub}>Cadastre novos clientes, parceiros ou fornecedores para gerenciar.</Text>
                                
                                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('ClienteForm')}>
                                    <Text style={styles.emptyBtnText}>CRIAR NOVO CADASTRO</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            <ConfirmModal
                visible={confirmVisible}
                title="Excluir Registro"
                message="Tem certeza que deseja apagar este contato? Históricos atrelados a ele podem perder a referência direta."
                confirmText="APAGAR"
                isDestructive={true}
                onCancel={() => { setConfirmVisible(false); setItemToDelete(null); }}
                onConfirm={confirmDelete}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // CRM HUB STYLES
    hubWrapper: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20 },
    hubTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    hubMainTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    hubStatsCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    hubStatsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    hubTitleText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    hubSubtitleText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', marginTop: 2 },
    activeIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    activeLabel: { color: '#10B981', fontSize: 8, fontWeight: '900' },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 16 },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { color: '#3B82F6', fontSize: 22, fontWeight: '900' },
    statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', marginTop: 4 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },

    hubActionsContainer: { flexDirection: 'row', gap: 10, marginTop: 15 },
    addMainBtn: { flex: 4, height: 50, borderRadius: 15, overflow: 'hidden', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    addGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    searchToggleBtn: { flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },

    searchWrapper: { paddingHorizontal: 20, marginTop: 20, marginBottom: 15, zIndex: 10 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, height: 50, paddingHorizontal: 15 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14, marginLeft: 10, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },

    listContent: { paddingHorizontal: 20, paddingBottom: 120 },
    
    cardContainer: { marginBottom: 15 },
    cardContent: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)' },
    avatarTxt: { fontSize: 18, fontWeight: '900' },
    cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
    cardCpf: { color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: '600' },
    deleteBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(248, 113, 113, 0.1)', justifyContent: 'center', alignItems: 'center' },

    cardFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 10 },
    infoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoTagText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptySub: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 30 },
    emptyBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    emptyBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});
