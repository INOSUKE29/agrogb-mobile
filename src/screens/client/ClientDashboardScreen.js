import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ClientDashboardScreen({ navigation }) {
    const [userName, setUserName] = useState("...");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Mock data based on Image 2 for MVP
    const propertySummary = {
        talhoes: 5,
        area: 320.5,
        culturas: 3,
        atividades: 12
    };

    const recentActivities = [
        { id: 1, type: 'Plantio', name: 'Plantio de Milho', date: 'Talhão 01 - 15/05/2024', status: 'Em andamento', icon: 'leaf-outline', color: '#10B981' },
        { id: 2, type: 'Adubacao', name: 'Adubação', date: 'Talhão 02 - 14/05/2024', status: 'Concluída', icon: 'flask-outline', color: '#64748B' },
        { id: 3, type: 'Pulverizacao', name: 'Pulverização', date: 'Talhão 03 - 13/05/2024', status: 'Em andamento', icon: 'water-outline', color: '#10B981' }
    ];

    const loadData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            
            const cachedUser = await AsyncStorage.getItem('@client_user_name');
            if (cachedUser) setUserName(cachedUser);

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) return;
            const userId = sessionData.session.user.id;

            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
            if (profile) {
                const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Produtor';
                setUserName(firstName);
                await AsyncStorage.setItem('@client_user_name', firstName);
            }
        } catch (error) {
            console.log('[ClientDashboard] Erro de rede:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    const getStatusStyle = (status) => {
        if (status === 'Em andamento') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
        if (status === 'Concluída') return { bg: '#1F2937', text: '#94A3B8' };
        return { bg: '#1F2937', text: '#64748B' };
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Olá, {userName}!</Text>
                    <Text style={styles.subGreeting}>Bem-vindo ao AgroGB</Text>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#10B981" />
                    <View style={styles.badge} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            >
                {/* Resumo da Propriedade */}
                <Text style={styles.sectionTitle}>Resumo da propriedade</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{propertySummary.talhoes}</Text>
                        <Text style={styles.summaryLabel}>Talhões</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{propertySummary.area}<Text style={styles.summaryUnit}> ha</Text></Text>
                        <Text style={styles.summaryLabel}>Área total</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{propertySummary.culturas}</Text>
                        <Text style={styles.summaryLabel}>Culturas</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryValue}>{propertySummary.atividades}</Text>
                        <Text style={styles.summaryLabel}>Atividades em andamento</Text>
                    </View>
                </View>

                {/* Atividades Recentes */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Atividades recentes</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {recentActivities.map((activity) => {
                    const statusCfg = getStatusStyle(activity.status);
                    return (
                        <TouchableOpacity key={activity.id} style={styles.activityCard} activeOpacity={0.7}>
                            <View style={styles.activityIconBox}>
                                <Ionicons name={activity.icon} size={22} color={activity.color} />
                            </View>
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityName}>{activity.name}</Text>
                                <Text style={styles.activityDate}>{activity.date}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                                <Text style={[styles.statusText, { color: statusCfg.text }]}>{activity.status}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
    subGreeting: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#1F2937' },

    content: { padding: 20, paddingBottom: 40 },
    
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', marginBottom: 15 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
    seeAllText: { color: '#10B981', fontSize: 13, fontWeight: '700' },

    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
    summaryBox: { width: '48%', backgroundColor: '#111827', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    summaryValue: { fontSize: 26, fontWeight: '900', color: '#F8FAFC', marginBottom: 5 },
    summaryUnit: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textAlign: 'center' },

    activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
    activityIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    activityInfo: { flex: 1 },
    activityName: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
    activityDate: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '800' }
});
