import React, { useState, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    StatusBar, 
    Alert,
    Text,
    TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useDashboardData } from '../hooks/useDashboardData';
import SyncService from '../services/SyncService';

// Componentes do Dashboard
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SkeletonDashboard from '../components/dashboard/SkeletonDashboard';
import SidebarDrawer from '../components/SidebarDrawer';
import OnboardingTour from '../components/common/OnboardingTour';

// Componentes "Órfãos de Ouro" resgatados
import WeatherWidget from '../components/ui/WeatherWidget';
import GlowFAB from '../components/ui/GlowFAB';
import TasksWidget from '../components/dashboard/TasksWidget';

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();
    const [period, setPeriod] = useState('month');
    const { data, loading, refreshing, onRefresh } = useDashboardData(period);
    
     const [user, setUser] = useState(null);
     const [drawerVisible, setDrawerVisible] = useState(false);
     const [isSyncing, setIsSyncing] = useState(false);
     const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        loadUser();
        const unsubscribe = SyncService.subscribe(status => setIsSyncing(status));
        return () => unsubscribe();
    }, []);

    const loadUser = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                setUser(JSON.parse(userJson));
                
                // Checar se Onboarding já foi visualizado
                const onboardingDone = await AsyncStorage.getItem('@onboarding_completed');
                if (!onboardingDone) {
                    setShowOnboarding(true);
                }
            }
        } catch (e) {
            console.error('Error loading user session', e);
        }
    };

    const handleCloseOnboarding = async () => {
        try {
            await AsyncStorage.setItem('@onboarding_completed', 'true');
        } catch (e) {
            console.error('Error saving onboarding state', e);
        }
        setShowOnboarding(false);
    };

    if (loading && !refreshing) {
        return <SkeletonDashboard />;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[theme?.colors?.primary || '#10B981']}
                        tintColor={theme?.colors?.primary || '#10B981'}
                    />
                }
            >
                <DashboardHeader 
                    userName={user?.nome} 
                    propertyName="Fazenda Santa Maria" 
                    onProfilePress={() => navigation.navigate('Profile')}
                    onProfileLongPress={() => navigation.navigate('AdminSelector')}
                    onNotifyPress={() => Alert.alert('Notificações', 'Você não tem novas mensagens.')}
                    isSyncing={isSyncing}
                    selectedPeriod={period}
                    onPeriodChange={setPeriod}
                />

                <WeatherWidget />
                <TasksWidget />

                {/* Banner de Upgrade para o Plano PRO */}
                <TouchableOpacity 
                    style={[styles.proBanner, { backgroundColor: theme?.colors?.primary || '#10B981' }]} 
                    onPress={() => navigation.navigate('Planos')}
                    activeOpacity={0.8}
                >
                    <View style={styles.proBannerContent}>
                        <Ionicons name="star" size={24} color="#FBBF24" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.proBannerTitle}>Desbloqueie o AgroGB PRO</Text>
                            <Text style={styles.proBannerDesc}>CRM de vendas, Sincronização em nuvem e Exportação em PDF.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </View>
                </TouchableOpacity>

                {data && (
                    <>
                        <View style={styles.actionPillsRow}>
                            <TouchableOpacity style={styles.actionPill} onPress={() => navigation.navigate('Vendas')}>
                                <Ionicons name="add" size={16} color="#10B981" />
                                <Text style={styles.actionPillText}>Registrar Venda</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionPill, styles.actionPillHighlight]} onPress={() => navigation.navigate('Custos')}>
                                <Ionicons name="add" size={16} color="#FFF" />
                                <Text style={[styles.actionPillText, { color: '#FFF' }]}>Registrar Custo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionPill} onPress={() => navigation.navigate('Colheita')}>
                                <Ionicons name="add" size={16} color="#10B981" />
                                <Text style={styles.actionPillText}>Registrar Colheita</Text>
                            </TouchableOpacity>
                        </View>

                        {/* GESTÃO OPERACIONAL */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionTitleDash} />
                                <Text style={styles.sectionTitle}>GESTÃO OPERACIONAL</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="leaf" label="Plantio" color="#10B981" onPress={() => navigation.navigate('Plantio')} />
                                <BigCard icon="basket" label="Colheita" color="#84CC16" onPress={() => navigation.navigate('Colheita')} />
                                <BigCard icon="calendar" label="Monitorar" color="#3B82F6" onPress={() => navigation.navigate('Monitoramento')} />
                                <BigCard icon="flask" label="Adubação" color="#8B5CF6" onPress={() => navigation.navigate('MenuAdubacao')} />
                            </View>
                        </View>

                        {/* COMERCIAL & FINANCEIRO */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionTitleDash, { backgroundColor: '#3B82F6' }]} />
                                <Text style={styles.sectionTitle}>COMERCIAL & FINANCEIRO</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="cart" label="Vendas" color="#3B82F6" onPress={() => navigation.navigate('Vendas')} />
                                <BigCard icon="cube" label="Estoque" color="#F59E0B" onPress={() => navigation.navigate('Estoque')} />
                                <BigCard icon="wallet" label="Despesas" color="#EF4444" onPress={() => navigation.navigate('Custos')} />
                                <BigCard icon="car" label="Compras" color="#14B8A6" onPress={() => navigation.navigate('Compras')} />
                            </View>
                        </View>

                        {/* SISTEMA & INTELIGÊNCIA */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionTitleDash, { backgroundColor: '#FCD34D' }]} />
                                <Text style={styles.sectionTitle}>SISTEMA</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="people" label="Cadastros" color="#64748B" onPress={() => navigation.navigate('Cadastro')} />
                                <BigCard icon="bulb" label="Inteligência" color="#FCD34D" onPress={() => navigation.navigate('Intelligence')} />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
            <OnboardingTour visible={showOnboarding} onClose={handleCloseOnboarding} />

            <GlowFAB 
                icon="add" 
                onPress={() => navigation.navigate('Cadastro')} 
                style={styles.fabPosition}
            />
        </View>
    );
}

// NOVO COMPONENTE: BIG CARD (Estilo do Print Oficial)
const BigCard = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.bigCard} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name={icon} size={28} color={color} style={{ marginBottom: 10 }} />
        <Text style={styles.bigCardText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fabPosition: {
        position: 'absolute',
        bottom: 30,
        right: 20
    },
    proBanner: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 15,
        elevation: 4,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    proBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    proBannerTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    proBannerDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
    },
    actionPillsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 25, gap: 10 },
    actionPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 20, height: 45 },
    actionPillHighlight: { backgroundColor: 'rgba(16, 185, 129, 0.4)', borderColor: '#10B981' },
    actionPillText: { color: '#E2E8F0', fontSize: 11, fontWeight: 'bold', marginLeft: 6, textAlign: 'center' },
    sectionContainer: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitleDash: { width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2, marginRight: 8 },
    sectionTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    bigGridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    bigCard: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    bigCardText: { color: '#0F172A', fontSize: 13, fontWeight: '800' }
});
