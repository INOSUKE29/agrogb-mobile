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
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.sectionTitleDash} />
                        <Text style={styles.sectionTitle}>GESTÃO OPERACIONAL</Text>
                    </View>
                    <View style={styles.grid}>
                        <BigCard icon="leaf" label="Plantio" color="#10B981" onPress={() => navigation.navigate('Plantio')} />
                        <BigCard icon="basket" label="Colheita" color="#84CC16" onPress={() => navigation.navigate('Colheita')} />
                        <BigCard icon="telescope" label="Monitorar" color="#8B5CF6" onPress={() => alert('Em breve')} />
                        <BigCard icon="flask" label="Adubação" color="#10B981" onPress={() => navigation.navigate('MenuAdubacao')} />
                    </View>
                </View>

                {/* Seção 2: Comercial & Financeiro */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleDash, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.sectionTitle}>COMERCIAL & FINANCEIRO</Text>
                    </View>
                    <View style={styles.grid}>
                        <BigCard icon="cart" label="Vendas" color="#3B82F6" onPress={() => navigation.navigate('Vendas')} />
                        <BigCard icon="shopping" label="Compras" color="#F59E0B" onPress={() => navigation.navigate('Compras')} />
                    </View>
                </View>

                {/* Seção 3: Sistema */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleDash, { backgroundColor: '#FCD34D' }]} />
                        <Text style={styles.sectionTitle}>SISTEMA</Text>
                    </View>
                    <View style={styles.grid}>
                        <BigCard icon="cube-outline" label="Cadastros" color="#64748B" onPress={() => navigation.navigate('Cadastro')} />
                        <BigCard icon="account-group" label="Equipe" color="#FCD34D" onPress={() => alert('Em breve')} />
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </SafeAreaView>
    );
}

// O Clássico BigCard (Design Ouro)
const BigCard = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.bigCard} onPress={onPress} activeOpacity={0.8}>
        <MaterialCommunityIcons name={icon} size={32} color={color} style={{ marginBottom: 12 }} />
        <Text style={styles.bigCardText}>{label}</Text>
    </TouchableOpacity>
);

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
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitleDash: {
        width: 4,
        height: 16,
        backgroundColor: '#10B981',
        borderRadius: 2,
        marginRight: 8,
    },
    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    bigCard: {
        width: '48%',
        backgroundColor: '#F8FAFC', // BRANCO PREMIUM
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bigCardText: {
        color: '#0F172A',
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center'
    }
});
