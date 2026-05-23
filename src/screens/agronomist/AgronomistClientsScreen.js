import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const renderClient = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CreateRecommendation', { clientId: item.id, clientName: item.name })}>
            <View style={styles.cardIcon}>
                <Ionicons name="person" size={24} color="#1565C0" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.farmName}>
                    <Ionicons name="location-outline" size={12} color="#64748B" /> {item.farm}
                </Text>
            </View>
            <View style={styles.actionBtn}>
                <MaterialCommunityIcons name="spray-bottle" size={20} color="#1B5E20" />
                <Text style={styles.actionText}>Receitar</Text>
            </View>
        </TouchableOpacity>
    );

    const renderPending = ({ item }) => (
        <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="time" size={24} color="#E65100" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.farmName}>Solicitou vínculo em {item.date}</Text>
            </View>
            <View style={styles.row}>
                <TouchableOpacity style={[styles.btnSmall, { backgroundColor: '#E8F5E9', marginRight: 10 }]} onPress={() => handleAction(item.link_id, 'accept')}>
                    <Text style={[styles.btnSmallText, { color: '#2E7D32' }]}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSmall, { backgroundColor: '#FFEBEE' }]} onPress={() => handleAction(item.link_id, 'reject')}>
                    <Text style={[styles.btnSmallText, { color: '#C62828' }]}>Recusar</Text>
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
                <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Buscar produtor..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'ativos' && styles.tabActive]} 
                    onPress={() => setActiveTab('ativos')}
                >
                    <Text style={[styles.tabText, activeTab === 'ativos' && styles.tabTextActive]}>Carteira Ativa ({clients.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'pendentes' && styles.tabActive]} 
                    onPress={() => setActiveTab('pendentes')}
                >
                    <Text style={[styles.tabText, activeTab === 'pendentes' && styles.tabTextActive]}>Solicitações ({pending.length})</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#1565C0" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'ativos' ? filteredClients : pending}
                    keyExtractor={(item) => item.id}
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFF' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 10, borderRadius: 12, paddingHorizontal: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 45, fontSize: 15, color: '#334155' },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#1565C0' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
    tabTextActive: { color: '#1565C0', fontWeight: '800' },
    listContent: { padding: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5 },
    cardIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    clientName: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    farmName: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    actionBtn: { alignItems: 'center', backgroundColor: '#F1F8E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    actionText: { fontSize: 11, fontWeight: '800', color: '#1B5E20', marginTop: 4 },
    row: { flexDirection: 'row' },
    btnSmall: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    btnSmallText: { fontSize: 12, fontWeight: '800' }
});
