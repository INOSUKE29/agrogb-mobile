import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AgronomistClientProfileScreen({ route, navigation }) {
    const { client } = route.params || {};

    const TOOLS = [
        { id: 'Resumo', label: 'Resumo', icon: 'clipboard-outline', route: null },
        { id: 'Propriedades', label: 'Propriedades', icon: 'map-outline', route: null },
        { id: 'Talhoes', label: 'Talhões', icon: 'grid-outline', route: null },
        { id: 'Culturas', label: 'Culturas', icon: 'leaf-outline', route: null },
        { id: 'Solo', label: 'Solo', icon: 'layers-outline', route: null },
        { id: 'Foliar', label: 'Foliar', icon: 'color-palette-outline', route: null },
        { id: 'Aplicacoes', label: 'Aplicações', icon: 'water-outline', route: null },
        { id: 'Estoque', label: 'Estoque', icon: 'cube-outline', route: 'AgronomistEstoque' },
        { id: 'Recomendacoes', label: 'Recomendações', icon: 'flask-outline', route: 'AgronomistRecommendations' },
        { id: 'Visitas', label: 'Visitas', icon: 'calendar-outline', route: 'Visitas' },
        { id: 'Relatorios', label: 'Relatórios', icon: 'bar-chart-outline', route: null }
    ];

    const getInitials = (name) => {
        if (!name) return '??';
        const names = name.trim().split(' ');
        if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const handlePress = (tool) => {
        if (tool.route) {
            navigation.navigate(tool.route, { clientId: client?.id, clientName: client?.name });
        } else {
            alert(`Ferramenta ${tool.label} em construção.`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil do Cliente</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* CARD DE PERFIL */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>{getInitials(client?.farm || client?.name)}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.farmName}>{client?.farm || 'Fazenda Sem Nome'}</Text>
                        <Text style={styles.clientName}>{client?.name || 'Cliente'}</Text>
                        <Text style={styles.clientSince}>Cliente desde {client?.date || '2024'}</Text>
                    </View>
                </View>

                {/* GRID DE FERRAMENTAS */}
                <View style={styles.grid}>
                    {TOOLS.map((tool) => (
                        <TouchableOpacity
                            key={tool.id}
                            style={styles.gridItem}
                            activeOpacity={0.7}
                            onPress={() => handlePress(tool)}
                        >
                            <View style={styles.iconWrapper}>
                                <Ionicons name={tool.icon} size={28} color="#10B981" />
                            </View>
                            <Text style={styles.itemLabel}>{tool.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },

    content: { padding: 20, paddingBottom: 50 },

    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#1F2937' },
    avatarBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2, borderColor: '#10B981' },
    avatarText: { color: '#10B981', fontSize: 20, fontWeight: '900' },
    profileInfo: { flex: 1 },
    farmName: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    clientName: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    clientSince: { color: '#64748B', fontSize: 11, fontWeight: '500' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '31%', backgroundColor: '#111827', borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    iconWrapper: { marginBottom: 10 },
    itemLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700' }
});
