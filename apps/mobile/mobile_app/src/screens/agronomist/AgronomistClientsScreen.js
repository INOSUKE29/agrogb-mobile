import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

export default function AgronomistClientsScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ativos'); // 'ativos' ou 'pendentes'
    const [clients, setClients] = useState([]);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) return;
            const uid = sessionData.session.user.id;
            setUserId(uid);

            // Busca Vínculos (Agromomista -> Clientes)
            // Precisamos fazer um join manual porque o Supabase JS tem limitações com relacionamentos complexos,
            // mas como configuramos foreign keys, podemos usar a sintaxe de relacionamento.
            // Client_id aponta para profiles
            const { data: links, error } = await supabase.from('agronomist_client_links')
                .select(`
                    id, 
                    status, 
                    created_at,
                    client_id,
                    profiles!agronomist_client_links_client_id_fkey(full_name, phone)
                `)
                .eq('agronomist_id', uid);

            if (error) throw error;

            if (links) {
                const activeList = [];
                const pendingList = [];

                for (const link of links) {
                    const clientData = {
                        id: link.client_id,
                        link_id: link.id,
                        name: link.profiles?.full_name || 'Produtor Sem Nome',
                        phone: link.profiles?.phone || '',
                        date: new Date(link.created_at).toLocaleDateString('pt-BR'),
                        status: link.status
                    };

                    if (link.status === 'ACTIVE') {
                        // Busca uma fazenda do cliente para mostrar
                        const { data: farm } = await supabase.from('farms').select('name').eq('owner_id', link.client_id).limit(1).single();
                        clientData.farm = farm ? farm.name : 'Nenhuma fazenda cadastrada';
                        activeList.push(clientData);
                    } else if (link.status === 'PENDING') {
                        pendingList.push(clientData);
                    }
                }

                setClients(activeList);
                setPending(pendingList);
            }
        } catch (error) {
            console.log('[AgronomistClients] Erro:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleAction = async (linkId, action) => {
        try {
            setLoading(true);
            const newStatus = action === 'accept' ? 'ACTIVE' : 'REVOKED';
            const { error } = await supabase.from('agronomist_client_links')
                .update({ status: newStatus, approved_at: new Date().toISOString() })
                .eq('id', linkId);
            
            if (error) throw error;
            
            Alert.alert('Sucesso', action === 'accept' ? 'Produtor adicionado à sua carteira!' : 'Solicitação recusada.');
            loadData();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar o vínculo.');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        const names = name.trim().split(' ');
        if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const filteredClients = clients.filter(c => 
        (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (c.farm && c.farm.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderClient = ({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('AgronomistClientProfile', { client: item })}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                    <Text style={styles.initialsText}>{getInitials(item.farm || item.name)}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.farmName}>{item.farm || 'Fazenda Sem Nome'}</Text>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <Text style={styles.farmDetails}>
                        Soja, Milho • {Math.floor(Math.random() * 2000 + 500)} ha
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </View>
        </TouchableOpacity>
    );


    const renderPending = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="time" size={20} color="#F59E0B" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.farmName}>{item.name}</Text>
                    <Text style={styles.clientName}>Solicitou vínculo</Text>
                    <Text style={styles.farmDetails}>{item.date}</Text>
                </View>
            </View>
            <View style={styles.row}>
                <TouchableOpacity style={[styles.btnSmall, { backgroundColor: 'rgba(16, 185, 129, 0.15)', marginRight: 10 }]} onPress={() => handleAction(item.link_id, 'accept')}>
                    <Text style={[styles.btnSmallText, { color: '#10B981' }]}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSmall, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} onPress={() => handleAction(item.link_id, 'reject')}>
                    <Text style={[styles.btnSmallText, { color: '#EF4444' }]}>Recusar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1565C0" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Clientes</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Buscar cliente..." 
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'ativos' && styles.tabActive]} 
                    onPress={() => setActiveTab('ativos')}
                >
                    <Text style={[styles.tabText, activeTab === 'ativos' && styles.tabTextActive]}>Ativos <Text style={styles.badge}>{clients.length}</Text></Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'pendentes' && styles.tabActive]} 
                    onPress={() => setActiveTab('pendentes')}
                >
                    <Text style={[styles.tabText, activeTab === 'pendentes' && styles.tabTextActive]}>Pendentes <Text style={styles.badge}>{pending.length}</Text></Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#1565C0" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'ativos' ? filteredClients : pending}
                    keyExtractor={(item) =
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    > item.id}
                    renderItem={activeTab === 'ativos' ? renderClient : renderPending}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={{textAlign: 'center', color: '#94A3B8', marginTop: 30}}>Nenhum registro encontrado.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', marginHorizontal: 20, marginTop: 15, borderRadius: 20, paddingHorizontal: 15, borderWidth: 1, borderColor: '#1F2937' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 45, fontSize: 15, color: '#F8FAFC' },
    
    tabs: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, marginBottom: 10, gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937' },
    tabActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' },
    tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    tabTextActive: { color: '#10B981' },
    badge: { color: '#64748B', fontSize: 11 },
    
    listContent: { padding: 20 },
    card: { backgroundColor: '#111827', borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    initialsText: { color: '#10B981', fontSize: 16, fontWeight: '900' },
    cardInfo: { flex: 1 },
    farmName: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
    clientName: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 2 },
    farmDetails: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    
    row: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#1F2937', paddingTop: 15 },
    btnSmall: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    btnSmallText: { fontSize: 12, fontWeight: '800' }
});
