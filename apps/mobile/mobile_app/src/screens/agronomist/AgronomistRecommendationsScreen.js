import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';

export default function AgronomistRecommendationsScreen({ route, navigation }) {
    const { clientId, clientName } = route.params || {};
    const [activeTab, setActiveTab] = useState('Enviadas'); 
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, [clientId]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('recommendations')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Map Supabase status to our frontend tabs
            const mapped = (data || []).map(r => ({
                id: r.id.substring(0,6),
                full_id: r.id,
                status: r.status === 'PENDING' ? 'Pendente' : r.status === 'APPROVED' ? 'Aprovada' : r.status === 'DRAFT' ? 'Rascunho' : 'Rejeitada',
                farm: clientName,
                culture: r.title,
                date: new Date(r.created_at).toLocaleDateString('pt-BR'),
                type: r.status === 'DRAFT' ? 'Rascunhos' : r.status === 'APPROVED' ? 'Aprovadas' : 'Enviadas',
                raw: r
            }));
            setRecommendations(mapped);
        } catch (error) {
            console.log('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Pendente': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
            case 'Aprovada': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
            case 'Rejeitada': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
            default: return { color: '#94A3B8', bg: '#1F2937' };
        }
    };

    const filtered = recommendations.filter(r => r.type === activeTab || (activeTab === 'Enviadas' && r.status !== 'Aprovada'));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recomendações</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabs}>
                {['Enviadas', 'Rascunhos', 'Aprovadas'].map(tab => (
                    <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#10B981" style={{marginTop: 50}} />
                ) : (
                    <>
                        {filtered.length === 0 && (
                            <Text style={{color: '#64748B', textAlign: 'center', marginTop: 20}}>Nenhuma recomendação nesta aba.</Text>
                        )}
                        {filtered.map(item => {
                            const statusCfg = getStatusStyle(item.status);
                            return (
                                <TouchableOpacity 
                                    key={item.full_id} 
                                    style={styles.card} 
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('RecommendationDetail', { recommendation: item.raw, clientName })}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{item.culture}</Text>
                                        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                                            <Text style={[styles.badgeText, { color: statusCfg.color }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.farmText}>{item.farm}</Text>
                                    <Text style={styles.dateText}>Enviada em {item.date}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CreateRecommendation', { clientId, clientName })}>
                    <Ionicons name="add" size={20} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.newBtnText}>Nova recomendação</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },

    tabs: { flexDirection: 'row', margin: 20, backgroundColor: '#111827', borderRadius: 12, padding: 5, borderWidth: 1, borderColor: '#1F2937' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: '#1F2937' },
    tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    tabTextActive: { color: '#F8FAFC' },

    content: { paddingHorizontal: 20, paddingBottom: 50 },
    card: { backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '800' },
    farmText: { color: '#94A3B8', fontSize: 13, marginBottom: 2 },
    cultureText: { color: '#94A3B8', fontSize: 13, marginBottom: 15 },
    dateText: { color: '#64748B', fontSize: 11, fontWeight: '500' },

    footer: { padding: 20, backgroundColor: '#0B121E', borderTopWidth: 1, borderTopColor: '#1F2937' },
    newBtn: { backgroundColor: '#10B981', flexDirection: 'row', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' }
});
