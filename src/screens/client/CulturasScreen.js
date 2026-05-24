import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_CULTURAS = [
    {
        id: '1',
        nome: 'Morango',
        area: 1.2,
        plantio: '10/01/2026',
        variedade: 'Albion',
        status: 'Produção',
        ultimaColheita: 500,
        producaoTotal: 3200,
        icone: 'leaf'
    },
    {
        id: '2',
        nome: 'Milho',
        area: 8.5,
        plantio: '05/03/2026',
        variedade: 'Híbrido',
        status: 'Desenvolvimento',
        ultimaColheita: 0,
        producaoTotal: 5000,
        icone: 'corn'
    },
    {
        id: '3',
        nome: 'Café',
        area: 5.0,
        plantio: '12/08/2025',
        variedade: 'Arábica',
        status: 'Plantado',
        ultimaColheita: 0,
        producaoTotal: 1800,
        icone: 'coffee-outline'
    },
    {
        id: '4',
        nome: 'Alface',
        area: 1.5,
        plantio: '20/09/2024',
        variedade: 'Crespa',
        status: 'Finalizada',
        ultimaColheita: 100,
        producaoTotal: 900,
        icone: 'sprout'
    }
];

const FILTERS = ['Todas', 'Produção', 'Desenvolvimento', 'Plantado', 'Finalizadas'];

export default function CulturasScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todas');

    const filteredCulturas = MOCK_CULTURAS.filter(c => {
        const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
        const matchFilter = activeFilter === 'Todas' || (activeFilter === 'Finalizadas' ? c.status === 'Finalizada' : c.status === activeFilter);
        return matchSearch && matchFilter;
    });

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Produção': return { color: '#10B981', dot: '#10B981' };
            case 'Desenvolvimento': return { color: '#F59E0B', dot: '#F59E0B' };
            case 'Plantado': return { color: '#3B82F6', dot: '#3B82F6' };
            case 'Finalizada': return { color: '#EF4444', dot: '#EF4444' };
            default: return { color: '#94A3B8', dot: '#94A3B8' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <MaterialCommunityIcons name="leaf" size={28} color="#10B981" />
                    <Text style={styles.headerTitle}>Culturas</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ Nova Cultura</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subHeader}>Gerencie suas culturas</Text>

                {/* Resumo */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Culturas</Text>
                        <View style={styles.summaryValueRow}>
                            <MaterialCommunityIcons name="seed-outline" size={20} color="#F59E0B" />
                            <Text style={styles.summaryValue}>5</Text>
                        </View>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Área Total</Text>
                        <View style={styles.summaryValueRow}>
                            <Text style={styles.summaryValue}>25.4<Text style={styles.unitText}> ha</Text></Text>
                        </View>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Em Produção</Text>
                        <View style={styles.summaryValueRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <Text style={styles.summaryValue}>3</Text>
                        </View>
                    </View>
                </View>

                {/* Busca */}
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#64748B" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cultura"
                        placeholderTextColor="#64748B"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filtros Horizontais */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersWrapper} contentContainerStyle={styles.filtersContent}>
                    {FILTERS.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Lista de Culturas */}
                {filteredCulturas.map(c => {
                    const statusStyle = getStatusStyle(c.status);
                    return (
                        <View key={c.id} style={styles.culturaCard}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name={c.icone} size={24} color="#10B981" />
                                <Text style={styles.culturaNome}>{c.nome}</Text>
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.infoRow}>
                                <View style={styles.infoCol}>
                                    <View style={styles.dotLabel}><View style={styles.dotGrey}/> <Text style={styles.infoLabel}>Área: <Text style={styles.infoBold}>{c.area} ha</Text></Text></View>
                                    <View style={styles.dotLabel}><View style={styles.dotGrey}/> <Text style={styles.infoLabel}>Variedade: <Text style={styles.infoBold}>{c.variedade}</Text></Text></View>
                                    <View style={styles.dotLabel}>
                                        <View style={[styles.dotBig, { backgroundColor: statusStyle.dot }]}/> 
                                        <Text style={[styles.infoLabel, { color: '#F8FAFC', fontWeight: '800' }]}>{c.status}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoCol}>
                                    <View style={styles.dotLabel}><View style={styles.dotGrey}/> <Text style={styles.infoLabel}>Plantio: <Text style={styles.infoBold}>{c.plantio}</Text></Text></View>
                                    {c.status !== 'Produção' && c.status !== 'Finalizada' && (
                                        <View style={styles.dotLabel}><View style={[styles.dotBig, { backgroundColor: statusStyle.dot }]}/> <Text style={[styles.infoLabel, { color: '#F8FAFC', fontWeight: '800' }]}>{c.status}</Text></View>
                                    )}
                                </View>
                            </View>

                            {(c.ultimaColheita > 0 || c.producaoTotal > 0) && (
                                <View style={styles.productionBlock}>
                                    {c.ultimaColheita > 0 && <View style={styles.dotLabel}><View style={styles.dotGrey}/> <Text style={styles.infoLabel}>Última Colheita: <Text style={styles.infoBold}>{c.ultimaColheita} kg</Text></Text></View>}
                                    {c.producaoTotal > 0 && <View style={styles.dotLabel}><View style={styles.dotGrey}/> <Text style={styles.infoLabel}>Produção Total: <Text style={styles.infoBold}>{c.producaoTotal} kg</Text></Text></View>}
                                </View>
                            )}
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="eye-outline" size={16} color="#64748B" />
                                    <Text style={styles.actionText}>Ver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#64748B" />
                                    <Text style={styles.actionText}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    <Text style={[styles.actionText, {color: '#EF4444'}]}>Excluir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                {filteredCulturas.length === 0 && (
                    <Text style={{textAlign: 'center', color: '#64748B', marginTop: 30}}>Nenhuma cultura encontrada.</Text>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginLeft: 8 },
    addBtn: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#10B981' },
    addBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13 },
    
    content: { padding: 20, paddingBottom: 40 },
    subHeader: { color: '#94A3B8', fontSize: 14, marginBottom: 20, marginTop: -10 },
    
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    summaryCard: { backgroundColor: '#111827', width: '31%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', alignItems: 'center' },
    summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
    summaryValueRow: { flexDirection: 'row', alignItems: 'center' },
    summaryValue: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginLeft: 6 },
    unitText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginBottom: 15 },
    searchInput: { flex: 1, color: '#F8FAFC', marginLeft: 10, fontSize: 15 },

    filtersWrapper: { marginBottom: 20 },
    filtersContent: { paddingRight: 20 },
    filterBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1F2937', marginRight: 10 },
    filterBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#FFF', fontWeight: '800' },

    culturaCard: { backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    culturaNome: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginLeft: 10 },
    
    divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 12 },
    
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoCol: { flex: 1 },
    dotLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dotGrey: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#475569', marginRight: 8 },
    dotBig: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
    infoLabel: { color: '#94A3B8', fontSize: 13 },
    infoBold: { color: '#F8FAFC', fontWeight: '700' },
    
    productionBlock: { marginTop: 4 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    actionText: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginLeft: 6 }
});
