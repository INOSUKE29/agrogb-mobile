import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    StatusBar, 
    Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
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

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();
    const { data, loading, refreshing, onRefresh } = useDashboardData();
    
    const [user, setUser] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

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
            }
        } catch (e) {
            console.error('Error loading user session', e);
        }
    };

    if (loading && !refreshing) {
        return <SkeletonDashboard />;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
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
                    onProfilePress={() => setDrawerVisible(true)}
                    onNotifyPress={() => Alert.alert('Notificações', 'Você não tem novas mensagens.')}
                    isSyncing={isSyncing}
                />

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
