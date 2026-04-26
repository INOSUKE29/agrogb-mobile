import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const { width } = Dimensions.get('window');

// DADOS DO MENU CONFORME A IMAGEM
const SECTIONS = [
    {
        title: 'PRODUÇÃO',
        items: [
            { id: 'caderno', label: 'Caderno', icon: 'book', color: '#1B5E20' },
            { id: 'colheita', label: 'Colheita', icon: 'leaf', color: '#1B5E20' },
            { id: 'monitorar', label: 'Monitorar', icon: 'camera', color: '#1B5E20' },
            { id: 'adubacao', label: 'Adubação', icon: 'flask', color: '#1B5E20' },
            { id: 'plantio', label: 'Plantio', icon: 'sprout', color: '#1B5E20' },
            { id: 'descarte', label: 'Descarte', icon: 'trash-can', color: '#1B5E20' },
            { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-text-outline', color: '#1B5E20' },
        ]
    },
    {
        title: 'COMERCIAL',
        items: [
            { id: 'vendas', label: 'Vendas', icon: 'cash', color: '#1B5E20' },
            { id: 'compras', label: 'Compras', icon: 'cart', color: '#1B5E20' },
            { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-list', color: '#1B5E20' },
        ]
    },
    {
        title: 'CONTROLE',
        items: [
            { id: 'funcionarios', label: 'Funcionários', icon: 'account-group', color: '#1B5E20' },
            { id: 'maquinas', label: 'Máquinas', icon: 'tractor', color: '#1B5E20' },
            { id: 'relatorios', label: 'Relatórios', icon: 'chart-pie', color: '#1B5E20' },
        ]
    }
];

export default function HomeScreen({ navigation }) {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetchStats = async () => {
            try {
                const d = await getDashboardStats();
                if (d) setStats(d);
            } catch (e) {}
        };
        fetchStats();
    }, []));

    const MenuItem = ({ icon, label, id }) => (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate(id === 'cadastros' ? 'Cadastro' : id === 'sync' ? 'Sync' : id)}
        >
            <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name={icon} size={28} color="#1B5E20" />
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HEADER COM DEGRADÊ VERDE (FIDO À IMAGEM) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.iconCircle}>
                        <Ionicons name="person" size={20} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.brandingBox}>
                        <View style={styles.logoRow}>
                            <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
                            <Text style={styles.brandTitle}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#4CAF50'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.brandSub}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.iconCircle}>
                        <Ionicons name="notifications" size={20} color="#FFF" />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* CARD DE RESUMO (FIDO À IMAGEM - FLUTUANTE) */}
                <View style={styles.dashboardCard}>
                    <View style={styles.dashItem}>
                        <Ionicons name="sunny" size={30} color="#FFC107" />
                        <View style={styles.dashTexts}>
                            <Text style={styles.dashTitle}>Clima</Text>
                            <Text style={styles.dashValue}>25°C</Text>
                            <Text style={styles.dashMeta}>Ensolarado</Text>
                        </View>
                    </View>
                    
                    <View style={styles.vDivider} />

                    <View style={styles.dashItem}>
                        <MaterialCommunityIcons name="leaf" size={30} color="#4CAF50" />
                        <View style={styles.dashTexts}>
                            <Text style={styles.dashTitle}>Colheita</Text>
                            <Text style={styles.dashValue}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashMeta}>Total colhido</Text>
                        </View>
                    </View>

                    <View style={styles.vDivider} />

                    <View style={styles.dashItem}>
                        <MaterialCommunityIcons name="currency-usd" size={30} color="#2E7D32" />
                        <View style={styles.dashTexts}>
                            <Text style={styles.dashTitle}>Vendas</Text>
                            <Text style={styles.dashValue}>R$ {stats.vendasHoje?.toFixed(2) || '0,00'}</Text>
                            <Text style={styles.dashMeta}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {SECTIONS.map((sec, idx) => (
                    <View key={idx} style={styles.section}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{sec.title}</Text>
                            <TouchableOpacity style={styles.verTudoBox}>
                                <Text style={styles.verTudoText}>Ver tudo</Text>
                                <Ionicons name="chevron-forward" size={14} color="#1B5E20" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {sec.items.map((item, i) => (
                                <MenuItem key={i} {...item} />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* BOTTOM NAV BAR (ESTILO IPHONE - FIDELIDADE 100%) */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home" size={24} color="#1B5E20" />
                    <Text style={[styles.navText, {color: '#1B5E20', fontWeight: 'bold'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="leaf-outline" size={24} color="#9E9E9E" />
                    <Text style={styles.navText}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="settings-outline" size={24} color="#9E9E9E" />
                    <Text style={styles.navText}>Configurações</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6F7' },
    header: {
        paddingTop: 50,
        paddingBottom: 50,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    brandingBox: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    miniLogo: { width: 35, height: 35, borderRadius: 10 },
    brandTitle: { fontSize: 24, fontWeight: 'bold' },
    brandSub: { color: '#C8E6C9', fontSize: 11, marginTop: -2 },
    notifDot: { 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: '#4CAF50', 
        borderWidth: 1.5, 
        borderColor: '#0F3D2E' 
    },

    scroll: { paddingHorizontal: 16, paddingBottom: 100 },
    
    dashboardCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -35,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20
    },
    dashItem: { flex: 1, alignItems: 'center' },
    dashTexts: { alignItems: 'center', marginTop: 5 },
    dashTitle: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold' },
    dashValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginVertical: 2 },
    dashMeta: { fontSize: 8, color: '#999', fontWeight: 'bold' },
    vDivider: { width: 1, backgroundColor: '#F0F0F0', height: '80%', alignSelf: 'center' },

    section: { marginTop: 25 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    secTitle: { fontSize: 14, fontWeight: 'bold', color: '#1B5E20' },
    verTudoBox: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    verTudoText: { color: '#1B5E20', fontSize: 11, fontWeight: 'bold' },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    card: { 
        width: (width - 32) / 4 - 8, 
        backgroundColor: '#FFF', 
        borderRadius: 18, 
        paddingVertical: 12, 
        alignItems: 'center', 
        marginBottom: 10,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    iconWrapper: {
        backgroundColor: 'rgba(76,175,80,0.1)',
        padding: 10,
        borderRadius: 50,
        marginBottom: 6
    },
    label: { fontSize: 10, fontWeight: 'bold', color: '#333', textAlign: 'center' },

    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingTop: 12,
        paddingBottom: 30,
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderColor: '#F0F0F0'
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, color: '#9E9E9E', marginTop: 4, fontWeight: 'bold' }
});
