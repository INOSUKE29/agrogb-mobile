import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const INITIAL_MOCK_FROTA = [
    {
        id: '1',
        nome: 'Trator John Deere 6110J',
        tipo: 'maquina',
        placa_chassi: 'CH-45892',
        medidor: 'Horímetro: 2.450h',
        ultimaManutencao: '12/04/2026',
        status: 'Ativo'
    },
    {
        id: '2',
        nome: 'Caminhão Mercedes 1620',
        tipo: 'veiculo',
        placa_chassi: 'ABC-1234',
        medidor: 'KM: 152.300',
        ultimaManutencao: '05/01/2026',
        status: 'Manutenção'
    },
    {
        id: '3',
        nome: 'Pulverizador Jacto',
        tipo: 'maquina',
        placa_chassi: 'CH-11200',
        medidor: 'Horímetro: 850h',
        ultimaManutencao: '22/05/2026',
        status: 'Ativo'
    },
    {
        id: '4',
        nome: 'Caminhonete Hilux',
        tipo: 'veiculo',
        placa_chassi: 'XYZ-9876',
        medidor: 'KM: 85.000',
        ultimaManutencao: '10/10/2025',
        status: 'Ativo'
    }
];

export default function FrotaScreen({ navigation }) {
    const [frota, setFrota] = useState(INITIAL_MOCK_FROTA);
    const [searchQuery, setSearchQuery] = useState('');

    const maquinasAtivas = frota.filter(f => f.tipo === 'maquina' && f.status === 'Ativo').length;
    const veiculosAtivos = frota.filter(f => f.tipo === 'veiculo' && f.status === 'Ativo').length;
    const emManutencao = frota.filter(f => f.status === 'Manutenção').length;

    const filteredFrota = frota.filter(item => item.nome.toLowerCase().includes(searchQuery.toLowerCase()));

    const getStatusStyle = (status) => {
        if (status === 'Ativo') return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: 'checkmark-circle' };
        if (status === 'Manutenção') return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: 'construct' };
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: 'close-circle' };
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <MaterialCommunityIcons name="tractor" size={30} color="#10B981" />
                    <Text style={styles.headerTitle}>Frota e Máquinas</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* PAINEL SUPERIOR COLORIDO */}
                <View style={styles.dashboardGrid}>
                    <View style={[styles.dashCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                        <View style={[styles.dashIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <MaterialCommunityIcons name="tractor" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.dashValue}>{maquinasAtivas}</Text>
                        <Text style={styles.dashLabel}>Máquinas</Text>
                    </View>
                    <View style={[styles.dashCard, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                        <View style={[styles.dashIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="car-sport" size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.dashValue}>{veiculosAtivos}</Text>
                        <Text style={styles.dashLabel}>Veículos</Text>
                    </View>
                    <View style={[styles.dashCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                        <View style={[styles.dashIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Ionicons name="build" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.dashValue}>{emManutencao}</Text>
                        <Text style={styles.dashLabel}>Manutenção</Text>
                    </View>
                    <View style={[styles.dashCard, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                        <View style={[styles.dashIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <Ionicons name="cash" size={22} color="#EF4444" />
                        </View>
                        <Text style={styles.dashValue}>R$ 8.450</Text>
                        <Text style={styles.dashLabel}>Custo/Mês</Text>
                    </View>
                </View>

                {/* BUSCA */}
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#64748B" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar trator, placa..."
                        placeholderTextColor="#64748B"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* LISTA */}
                <Text style={styles.sectionTitle}>Inventário de Frota</Text>
                
                {filteredFrota.map(item => {
                    const statusStyle = getStatusStyle(item.status);
                    const iconName = item.tipo === 'maquina' ? 'tractor' : 'truck-outline';
                    
                    return (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarBox}>
                                    {item.tipo === 'maquina' ? (
                                        <MaterialCommunityIcons name="tractor" size={26} color="#10B981" />
                                    ) : (
                                        <MaterialCommunityIcons name="truck-outline" size={26} color="#3B82F6" />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.nome}</Text>
                                    <View style={styles.tagRow}>
                                        <View style={styles.infoTag}>
                                            <Ionicons name="barcode-outline" size={12} color="#94A3B8" />
                                            <Text style={styles.infoTagText}>{item.placa_chassi}</Text>
                                        </View>
                                        <View style={styles.infoTag}>
                                            <Ionicons name="speedometer-outline" size={12} color="#94A3B8" />
                                            <Text style={styles.infoTagText}>{item.medidor}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.cardBody}>
                                <View style={styles.infoCol}>
                                    <Text style={styles.labelSm}>Última Manutenção</Text>
                                    <Text style={styles.valueSm}>{item.ultimaManutencao}</Text>
                                </View>
                                <View style={styles.infoColRight}>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.color }]}>
                                        <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
                                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="eye-outline" size={16} color="#94A3B8" />
                                    <Text style={styles.actionText}>Ver Detalhes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="build-outline" size={16} color="#94A3B8" />
                                    <Text style={styles.actionText}>Revisão</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                                    <Text style={styles.actionText}>Editar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginLeft: 8 },
    addBtn: { width: 40, height: 40, backgroundColor: '#10B981', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    
    content: { padding: 20, paddingBottom: 40 },

    dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    dashCard: { width: '48%', backgroundColor: '#111827', borderRadius: 20, padding: 16, marginBottom: 15, borderWidth: 1, alignItems: 'flex-start' },
    dashIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    dashValue: { color: '#F8FAFC', fontSize: 22, fontWeight: '900', marginBottom: 4 },
    dashLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1F2937', marginBottom: 25 },
    searchInput: { flex: 1, color: '#F8FAFC', marginLeft: 10, fontSize: 15 },

    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 15 },

    card: { backgroundColor: '#111827', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatarBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#1F2937' },
    cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', marginBottom: 6 },
    tagRow: { flexDirection: 'row', gap: 10 },
    infoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B121E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#1F2937' },
    infoTagText: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginLeft: 4 },

    divider: { height: 1, backgroundColor: '#1F2937', marginBottom: 15 },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    infoCol: { flex: 1 },
    labelSm: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    valueSm: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
    infoColRight: { alignItems: 'flex-end' },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6 },
    statusText: { fontSize: 11, fontWeight: '800' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B121E', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1F2937', gap: 6 },
    actionText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' }
});
