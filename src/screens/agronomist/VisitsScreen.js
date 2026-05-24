import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data para UI inicial (depois integraremos ao Supabase)
const MOCK_VISITS = [
    { id: '1', date: '25/05/2026', time: '09:00', client: 'João Batista', farm: 'Fazenda Boa Esperança', status: 'PENDENTE' },
    { id: '2', date: '26/05/2026', time: '14:30', client: 'Carlos Silva', farm: 'Sítio Santa Rita', status: 'PENDENTE' },
    { id: '3', date: '20/05/2026', time: '10:00', client: 'Marcos Paulo', farm: 'Fazenda Alvorada', status: 'CONCLUIDA' },
];

export default function VisitsScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('futuras');

    const filteredVisits = activeTab === 'futuras' 
        ? MOCK_VISITS.filter(v => v.status === 'PENDENTE')
        : MOCK_VISITS.filter(v => v.status === 'CONCLUIDA');

    const renderVisit = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Text style={styles.dateText}>{item.date.split('/')[0]}</Text>
                <Text style={styles.monthText}>{item.date.split('/')[1]}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.timeText}><Ionicons name="time-outline" size={14} /> {item.time}</Text>
                <Text style={styles.clientName}>{item.client}</Text>
                <Text style={styles.farmName}><Ionicons name="location-outline" size={12} /> {item.farm}</Text>
            </View>
            <View style={styles.cardRight}>
                {item.status === 'PENDENTE' ? (
                    <TouchableOpacity style={styles.checkBtn}>
                        <Ionicons name="checkmark-circle-outline" size={28} color="#1B5E20" />
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="checkmark-circle" size={28} color="#94A3B8" />
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Agenda de Visitas</Text>
                    <View style={{width: 40}} />
                </View>
                
                <View style={styles.tabs}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'futuras' && styles.tabActive]} onPress={() => setActiveTab('futuras')}>
                        <Text style={[styles.tabText, activeTab === 'futuras' && styles.tabTextActive]}>Próximas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'passadas' && styles.tabActive]} onPress={() => setActiveTab('passadas')}>
                        <Text style={[styles.tabText, activeTab === 'passadas' && styles.tabTextActive]}>Concluídas</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={filteredVisits}
                keyExtractor={item => item.id}
                renderItem={renderVisit}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma visita encontrada.</Text>}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AgronomistClients')}>
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingTop: Platform.OS === 'android' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    tabs: { flexDirection: 'row', marginTop: 25 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#FFF' },
    tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: '#FFF', fontWeight: '800' },
    
    listContent: { padding: 20, paddingTop: 30 },
    card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    cardLeft: { width: 60, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9', paddingRight: 15, marginRight: 15 },
    dateText: { fontSize: 24, fontWeight: '900', color: '#1565C0' },
    monthText: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
    cardBody: { flex: 1, justifyContent: 'center' },
    timeText: { fontSize: 13, color: '#F57F17', fontWeight: '700', marginBottom: 4 },
    clientName: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    farmName: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    cardRight: { justifyContent: 'center', alignItems: 'center', paddingLeft: 10 },
    checkBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontSize: 16 },
    
    fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF8F00', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#FF8F00', shadowOpacity: 0.4, shadowRadius: 10 }
});
