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
import FinancialSummary from '../components/dashboard/FinancialSummary';
import KPIGrid from '../components/dashboard/KPIGrid';
import QuickActions from '../components/dashboard/QuickActions';
import SmartAlerts from '../components/dashboard/SmartAlerts';
import RecentActivities from '../components/dashboard/RecentActivities';
import SkeletonDashboard from '../components/dashboard/SkeletonDashboard';
import SidebarDrawer from '../components/SidebarDrawer';
import ProductionChart from '../components/dashboard/ProductionChart';
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
                        <FinancialSummary 
                            revenue={data.financial.revenue}
                            expenses={data.financial.expenses}
                            netResult={data.financial.netResult}
                            trend={data.financial.trend}
                            trendType={data.financial.trendType}
                        />

                        <QuickActions navigation={navigation} />

                        <ProductionChart data={data.chartData} />

                        <KPIGrid kpis={data.kpis} />

                        <SmartAlerts alerts={data.alerts} navigation={navigation} />

                        <RecentActivities activities={data.activities} />
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
    }
});
