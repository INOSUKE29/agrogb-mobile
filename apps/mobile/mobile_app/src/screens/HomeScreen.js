import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar, 
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboardData } from '../hooks/useDashboardData';
import SidebarDrawer from '../components/SidebarDrawer';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { data, loading, refreshing, onRefresh } = useDashboardData('month');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                setUser(JSON.parse(userJson));
            }
        } catch (e) {
            console.error('Error loading user session', e);
        }
    };

    // Dados de fallback para a UI
    const revenue = data?.financial?.revenue || 0;
    const expenses = data?.financial?.expenses || 0;
    const losses = 0; // Exemplo fixo ou vindo da API

    const formatCurrency = (val) => {
        return `R$ ${val.toFixed(2).replace('.', ',')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B121E" />
            
            <View style={styles.header}>
                <Text style={styles.greeting}>Olá, {user?.usuario || 'Agricultor'}, <Ionicons name="leaf" size={24} color="#10B981" /></Text>
                <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
                    <Ionicons name="menu" size={28} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                }
            >
                {/* Resumo Mensal */}
                <LinearGradient colors={['#064E3B', '#022C22']} style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>RESUMO MENSAL</Text>
                        <Ionicons name="bar-chart" size={18} color="#10B981" />
                    </View>
                    
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryLabelRow}>
                                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.summaryLabel}>TOTAL VENDAS</Text>
                            </View>
                            <Text style={styles.summaryValue}>{formatCurrency(revenue)}</Text>
                        </View>
                        
                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryLabelRow}>
                                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.summaryLabel}>CUSTOS TOTAIS</Text>
                            </View>
                            <Text style={styles.summaryValueWarning}>{formatCurrency(expenses)}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.lossesText}>PERDAS (MÊS): <Text style={styles.lossesValue}>{losses} KG</Text></Text>
                </LinearGradient>

                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} onPress={() => navigation.navigate('Vendas')}>
                        <Text style={[styles.quickActionText, { color: '#10B981' }]}>+ Registrar{'\n'}Venda</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]} onPress={() => navigation.navigate('Custos')}>
                        <Text style={[styles.quickActionText, { color: '#F59E0B' }]}>+ Registrar{'\n'}Custo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} onPress={() => navigation.navigate('Colheita')}>
                        <Text style={[styles.quickActionText, { color: '#10B981' }]}>+ Registrar{'\n'}Colheita</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção 1: Gestão Operacional */}
                <Text style={styles.sectionTitle}><View style={styles.sectionLine} /> GESTÃO OPERACIONAL</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Plantio')}>
                        <MaterialCommunityIcons name="leaf" size={32} color="#10B981" />
                        <Text style={styles.gridCardTitle}>Plantio</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Colheita')}>
                        <MaterialCommunityIcons name="basket" size={32} color="#84CC16" />
                        <Text style={styles.gridCardTitle}>Colheita</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.gridCard} onPress={() => alert('Em breve')}>
                        <MaterialCommunityIcons name="telescope" size={32} color="#10B981" />
                        <Text style={styles.gridCardTitle}>Monitorar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('MenuAdubacao')}>
                        <MaterialCommunityIcons name="flask" size={32} color="#10B981" />
                        <Text style={styles.gridCardTitle}>Adubação</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção 2: Comercial & Financeiro */}
                <Text style={styles.sectionTitle}><View style={[styles.sectionLine, { backgroundColor: '#3B82F6' }]} /> COMERCIAL E FINANCEIRO</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Vendas')}>
                        <MaterialCommunityIcons name="cart" size={32} color="#3B82F6" />
                        <Text style={styles.gridCardTitle}>Vendas</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Compras')}>
                        <MaterialCommunityIcons name="shopping" size={32} color="#3B82F6" />
                        <Text style={styles.gridCardTitle}>Compras</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção 3: Sistema */}
                <Text style={styles.sectionTitle}><View style={styles.sectionLine} /> SISTEMA</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Cadastro')}>
                        <MaterialCommunityIcons name="cube-outline" size={32} color="#94A3B8" />
                        <Text style={styles.gridCardTitle}>Cadastros</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.gridCard} onPress={() => alert('Em breve')}>
                        <MaterialCommunityIcons name="account-group" size={32} color="#94A3B8" />
                        <Text style={styles.gridCardTitle}>Equipe</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B121E',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F8FAFC',
    },
    menuButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    summaryTitle: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryBlock: {
        flex: 1,
    },
    summaryLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    summaryLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    summaryValue: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: 'bold',
    },
    summaryValueWarning: {
        color: '#FCA5A5',
        fontSize: 22,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    lossesText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    lossesValue: {
        color: '#F8FAFC',
        fontWeight: 'bold',
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    quickActionBtn: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    quickActionText: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionLine: {
        width: 4,
        height: 14,
        backgroundColor: '#10B981',
        marginRight: 8,
        borderRadius: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    gridCard: {
        width: '48%',
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    gridCardTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
    }
});
