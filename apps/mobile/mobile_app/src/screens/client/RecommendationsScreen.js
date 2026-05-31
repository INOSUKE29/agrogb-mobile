import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function RecommendationsScreen() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);

            // 1. Tentar Cache Local
            const cachedData = await AsyncStorage.getItem('@client_recommendations');
            if (cachedData) setRecommendations(JSON.parse(cachedData));

            // 2. Buscar da Nuvem
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) return;
            const userId = sessionData.session.user.id;

            const { data: recs, error } = await supabase.from('recommendations')
                .select(`id, title, scheduled_date, status, fields(name)`)
                .eq('client_id', userId)
                .order('scheduled_date', { ascending: false });

            if (recs && !error) {
                const formattedRecs = recs.map(r => ({
                    id: r.id,
                    title: r.title,
                    date: new Date(r.scheduled_date).toLocaleDateString('pt-BR'),
                    field: r.fields?.name || 'Geral',
                    status: r.status // 'PENDING' ou 'CONCLUIDO'
                }));
                setRecommendations(formattedRecs);
                await AsyncStorage.setItem('@client_recommendations', JSON.stringify(formattedRecs));
            }

        } catch (error) {
            console.log('[RecommendationsScreen] Erro:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const renderItem = ({ item }) => {
        const isPending = item.status === 'PENDING';
        
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.badge, isPending ? styles.badgePending : styles.badgeDone]}>
                        {isPending ? 'PENDENTE' : 'CONCLUÍDO'}
                    </Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.footerRow}>
                    <MaterialCommunityIcons name="sprout" size={16} color="#64748B" />
                    <Text style={styles.field}>{item.field}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Receitas</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter" size={20} color="#1B5E20" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing && recommendations.length === 0 ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#1B5E20" />
                </View>
            ) : (
                <FlatList
                    data={recommendations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#1B5E20']} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma recomendação técnica recebida ainda.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#ECEFF1' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
    filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    badgePending: { backgroundColor: '#FFF3E0', color: '#E65100' },
    badgeDone: { backgroundColor: '#E8F5E9', color: '#1B5E20' },
    date: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
    title: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    footerRow: { flexDirection: 'row', alignItems: 'center' },
    field: { fontSize: 14, color: '#64748B', marginLeft: 6, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 50, fontSize: 15 }
});
