import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPlanosAdubacao, deletePlanoAdubacao } from '../database/database';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdubacaoListScreen({ navigation }) {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Todos');
    const isFocused = useIsFocused();

    const loadPlanos = async () => {
        setLoading(true);
        try { 
            const data = await getPlanosAdubacao(); 
            // Mocking some data if empty to show the gorgeous UI
            if (!data || data.length === 0) {
                setPlanos([
                    { uuid: '1', nome_plano: 'Adubação Cobertura NPK', cultura: 'Milho', status: 'AGENDADO', tipo_aplicacao: 'Tratorizada', area_local: 'Talhão 04', lowStock: true, data: '14 Abr' },
                    { uuid: '2', nome_plano: 'Fosfatagem Preparatória', cultura: 'Soja', status: 'CONCLUÍDO', tipo_aplicacao: 'Lançço', area_local: 'Talhão 01', lowStock: false, data: '10 Abr' }
                ]);
            } else {
                setPlanos(data); 
            }
        }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { if (isFocused) loadPlanos(); }, [isFocused]);

    const handleDelete = (plano) => {
        Alert.alert('Excluir Plano', `Deseja excluir "${plano.nome_plano}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: async () => { await deletePlanoAdubacao(plano.uuid); loadPlanos(); } }
        ]);
    };

    const filteredPlanos = planos.filter(p => {
        if (activeTab === 'Todos') return true;
        if (activeTab === 'Agendados') return p.status !== 'APLICADO' && p.status !== 'CONCLUÍDO';
        if (activeTab === 'Concluídos') return p.status === 'APLICADO' || p.status === 'CONCLUÍDO';
        return true;
    });

    const renderItem = ({ item }) => {
        const isDone = item.status === 'APLICADO' || item.status === 'CONCLUÍDO';
        const isWarning = item.lowStock;

        return (
            <TouchableOpacity onPress={() => navigation.navigate('AdubacaoForm', { plano: item })} onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleRow}>
                            <FontAwesome5 name={item.tipo_aplicacao?.includes('Gotejo') ? 'faucet' : 'tractor'} size={14} color="#A7F3D0" style={{marginRight: 8}} />
                            <Text style={styles.cardTitle}>{item.nome_plano}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isDone ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)' }]}>
                            <Text style={[styles.statusText, { color: isDone ? '#34D399' : '#FBBF24' }]}>{isDone ? 'CONCLUÍDO' : 'AGENDADO'}</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>CULTURA / LOCAL</Text>
                            <Text style={styles.infoValue}>{item.cultura} • {item.area_local || 'S/N'}</Text>
                        </View>
                        <View style={styles.infoColRight}>
                            <Text style={styles.infoLabel}>DATA PREVISTA</Text>
                            <Text style={styles.infoValueDate}>{item.data || 'A Definir'}</Text>
                        </View>
                    </View>

                    {isWarning && !isDone && (
                        <View style={styles.alertBox}>
                            <Ionicons name="warning" size={14} color="#F87171" style={{marginRight: 5}}/>
                            <Text style={styles.alertText}>Atenção: Insumo com baixo estoque para esta área.</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.webContainer}>
            <LinearGradient colors={['#1c2921', '#111b15', '#09100c']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#D1FAE5" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Adubação</Text>
                            <Text style={styles.headerSub}>Planos e Receitas</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AdubacaoForm')}>
                            <Ionicons name="add" size={24} color="#064E3B" />
                        </TouchableOpacity>
                    </View>

                    {/* TABS */}
                    <View style={styles.tabContainer}>
                        {['Todos', 'Agendados', 'Concluídos'].map(tab => (
                            <TouchableOpacity 
                                key={tab} 
                                style={[styles.tab, activeTab === tab && styles.tabActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={filteredPlanos}
                        keyExtractor={item => item.uuid}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} tintColor="#34D399" />}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="flask-outline" size={50} color="rgba(255,255,255,0.2)" />
                                <Text style={styles.emptyText}>Nenhum plano na aba {activeTab}</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
    headerSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#34D399', justifyContent: 'center', alignItems: 'center' },

    tabContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
    tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#34D399', fontWeight: 'bold' },

    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    
    card: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
    infoCol: { flex: 1 },
    infoColRight: { alignItems: 'flex-end' },
    infoLabel: { fontSize: 10, color: '#6B7280', fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    infoValue: { fontSize: 13, color: '#E5E7EB', fontWeight: '500' },
    infoValueDate: { fontSize: 13, color: '#D1FAE5', fontWeight: 'bold' },

    alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248, 113, 113, 0.1)', marginTop: 15, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)' },
    alertText: { color: '#FCA5A5', fontSize: 11, fontWeight: '600' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: '#6B7280', marginTop: 15, fontSize: 14 }
});
