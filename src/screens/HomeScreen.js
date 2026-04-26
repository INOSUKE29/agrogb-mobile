import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const MENU_ITEMS = [
    { id: 'caderno', label: 'Caderno', icon: 'book-open-variant', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'colheita', label: 'Colheita', icon: 'leaf', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'monitorar', label: 'Monitorar', icon: 'camera', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'adubacao', label: 'Adubação', icon: 'flask-outline', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'plantio', label: 'Plantio', icon: 'sprout', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'descarte', label: 'Descarte', icon: 'trash-can-outline', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-edit-outline', color: '#1B5E20', section: 'PRODUÇÃO' },
    { id: 'vendas', label: 'Vendas', icon: 'cash-multiple', color: '#1B5E20', section: 'COMERCIAL' },
    { id: 'compras', label: 'Compras', icon: 'cart-outline', color: '#1B5E20', section: 'COMERCIAL' },
    { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-text-clock-outline', color: '#1B5E20', section: 'COMERCIAL' },
    { id: 'funcionarios', label: 'Funcionários', icon: 'account-group', color: '#1B5E20', section: 'CONTROLE' },
    { id: 'maquinas', label: 'Máquinas', icon: 'tractor', color: '#1B5E20', section: 'CONTROLE' },
    { id: 'relatorios', label: 'Relatórios', icon: 'chart-pie', color: '#1B5E20', section: 'CONTROLE' },
];

export default function HomeScreen({ navigation }) {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if (d) setStats(d); } catch (e) {} };
        fetch();
    }, []));

    const renderHeader = () => (
        <View>
            <RNStatusBar barStyle="light-content" translucent />
            <LinearGradient colors={['#0F3D2E', '#1B5E20', 'transparent']} style={styles.hero}>
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.roundBtn}><Ionicons name="person" size={24} color="#FFF" /></TouchableOpacity>
                    <View style={styles.centerBranding}>
                        <View style={styles.logoRow}>
                            <Image source={require('../../assets/logo.png')} style={styles.megaLogo} />
                            <Text style={styles.title}>Agro<Text style={{color: '#66BB6A'}}>GB</Text></Text>
                        </View>
                        <Text style={styles.subtitle}>Inteligência no campo</Text>
                    </View>
                    <TouchableOpacity style={styles.roundBtn}><Ionicons name="notifications" size={24} color="#FFF" /></TouchableOpacity>
                </View>
            </LinearGradient>

            {/* DASHBOARD CARD */}
            <View style={styles.dashCard}>
                <View style={styles.dashItem}>
                    <Ionicons name="sunny" size={30} color="#FDC010" />
                    <Text style={styles.dashLab}>Clima</Text>
                    <Text style={styles.dashVal}>25°C</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.dashItem}>
                    <MaterialCommunityIcons name="leaf" size={30} color="#4CAF50" />
                    <Text style={[styles.dashLab, {color: '#4CAF50'}]}>Colheita</Text>
                    <Text style={styles.dashVal}>{stats.colheitaHoje || 0} kg</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.dashItem}>
                    <View style={styles.greenCircle}><MaterialCommunityIcons name="currency-usd" size={18} color="#FFF" /></View>
                    <Text style={[styles.dashLab, {color: '#2E7D32'}]}>Vendas</Text>
                    <Text style={styles.dashVal}>R$ {stats.vendasHoje || '0,00'}</Text>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.gridCell} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.id === 'vendas' ? 'Financeiro' : item.id === 'cadastros' ? 'Cadastro' : item.id)}
        >
            <View style={styles.innerCard}>
                <View style={styles.balloon}>
                    <MaterialCommunityIcons name={item.icon} size={30} color="#1B5E20" />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={MENU_ITEMS}
                keyExtractor={item => item.id}
                numColumns={4}
                ListHeaderComponent={renderHeader}
                renderItem={renderItem}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="home" size={26} color="#1B5E20" />
                    <Text style={[styles.tabLab, {color: '#1B5E20'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="leaf-outline" size={26} color="#909" />
                    <Text style={styles.tabLab}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="settings-outline" size={26} color="#909" />
                    <Text style={styles.tabLab}>Configurações</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    hero: { height: 260, paddingTop: 60, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    centerBranding: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    megaLogo: { width: 80, height: 80, borderRadius: 20 },
    title: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold' },

    dashCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 22, flexDirection: 'row', marginHorizontal: 16, marginTop: -60, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    dashItem: { flex: 1, alignItems: 'center' },
    dashLab: { fontSize: 10, fontWeight: 'bold', color: '#1B5E20', marginTop: 8 },
    dashVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    divider: { width: 1, height: 40, backgroundColor: '#F0F0F0', alignSelf: 'center' },
    greenCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center' },

    listContent: { paddingBottom: 110 },
    row: { justifyContent: 'flex-start', paddingHorizontal: 10 },
    gridCell: { 
        width: '25%', // FORÇA 4 COLUNAS EM QUALQUER DISPOSITIVO (WEB/MOBILE)
        padding: 6,
    },
    innerCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    balloon: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'rgba(27, 94, 32, 0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    itemLabel: { fontSize: 10, fontWeight: 'bold', color: '#455A64', textAlign: 'center' },

    bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 30, borderTopWidth: 1, borderColor: '#F5F5F5' },
    tabBtn: { alignItems: 'center' },
    tabLab: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', marginTop: 5 }
});
