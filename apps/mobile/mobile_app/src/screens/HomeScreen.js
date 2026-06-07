import React, { useState, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    StatusBar, 
    Text,
    TouchableOpacity,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardData } from '../hooks/useDashboardData';
import SyncService from '../services/SyncService';

// Componentes
import SkeletonDashboard from '../components/dashboard/SkeletonDashboard';
import SidebarDrawer from '../components/SidebarDrawer';
import OnboardingTour from '../components/common/OnboardingTour';
import GlowFAB from '../components/ui/GlowFAB';

export default function HomeScreen({ navigation }) {
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* CABEÇALHO VERDE CURVO (Idêntico à Imagem de Referência) */}
            <View style={styles.greenHeader}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButtonSquare}>
                        <Ionicons name="menu" size={26} color="#065F46" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitleMain}>AgroGB</Text>
                        <Text style={styles.headerTitleSub}>PAINEL GERENCIAL</Text>
                    </View>
                </View>

                {/* Weather Placeholder */}
                <TouchableOpacity style={styles.weatherCard} onPress={() => alert('Clima')}>
                    <Ionicons name="location-outline" size={20} color="#FFF" />
                    <Text style={styles.weatherText}>Ativar Clima da Fazenda</Text>
                </TouchableOpacity>

                {/* Resumo Rápido */}
                <View style={styles.statsCard}>
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>COLHEITA (HOJE)</Text>
                        <View style={styles.statValueRow}>
                            <Ionicons name="leaf" size={14} color="#A3E635" />
                            <Text style={styles.statValue}> 0 <Text style={styles.statUnit}>kg</Text></Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>VENDAS (HOJE)</Text>
                        <View style={styles.statValueRow}>
                            <Ionicons name="cash" size={14} color="#34D399" />
                            <Text style={styles.statValue}> R$ 0,00</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>RESULTADO (MÊS)</Text>
                        <Text style={[styles.statValue, { color: '#34D399', marginTop: 2 }]}>R$ 0,00</Text>
                    </View>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                }
            >
                <Text style={styles.sectionTitleLabel}>ACESSO RÁPIDO</Text>
                <View style={styles.grid3x}>
                    <BigCard icon="book-outline" label="Caderno" color="#059669" bgColor="rgba(5,150,105,0.1)" onPress={() => navigation.navigate('CadernoCampo')} />
                    <BigCard icon="leaf-outline" label="Colheita" color="#10B981" bgColor="rgba(16,185,129,0.1)" onPress={() => navigation.navigate('Colheita')} />
                    <BigCard icon="cash-outline" label="Vendas" color="#059669" bgColor="rgba(5,150,105,0.1)" onPress={() => navigation.navigate('Vendas')} />
                    
                    <BigCard icon="cube-outline" label="Estoque" color="#3B82F6" bgColor="rgba(59,130,246,0.1)" onPress={() => navigation.navigate('Estoque')} />
                    <BigCard icon="camera-outline" label="Monitorar" color="#DB2777" bgColor="rgba(219,39,119,0.1)" onPress={() => navigation.navigate('Monitoramento')} />
                    <BigCard icon="flask-outline" label="Adubação" color="#8B5CF6" bgColor="rgba(139,92,246,0.1)" onPress={() => navigation.navigate('MenuAdubacao')} />
                    
                    <BigCard icon="cart-outline" label="Compras" color="#F59E0B" bgColor="rgba(245,158,11,0.1)" onPress={() => navigation.navigate('Compras')} />
                    <BigCard icon="clipboard-outline" label="Encomendas" color="#F59E0B" bgColor="rgba(245,158,11,0.1)" onPress={() => navigation.navigate('Encomendas')} />
                    <BigCard icon="flower-outline" label="Plantio" color="#8B5CF6" bgColor="rgba(139,92,246,0.1)" onPress={() => navigation.navigate('Plantio')} />
                    
                    <BigCard icon="calculator-outline" label="Custos" color="#EA580C" bgColor="rgba(234,88,12,0.1)" onPress={() => navigation.navigate('Custos')} />
                    <BigCard icon="trash-outline" label="Descarte" color="#EF4444" bgColor="rgba(239,68,68,0.1)" onPress={() => navigation.navigate('Descarte')} />
                    <BigCard icon="car-sport-outline" label="Frota" color="#3B82F6" bgColor="rgba(59,130,246,0.1)" onPress={() => navigation.navigate('Frota')} />
                    
                    <BigCard icon="pie-chart-outline" label="Relatórios" color="#1E3A8A" bgColor="rgba(30,58,138,0.1)" onPress={() => navigation.navigate('Relatorios')} />
                    <BigCard icon="create-outline" label="Cadastros" color="#1E3A8A" bgColor="rgba(30,58,138,0.1)" onPress={() => navigation.navigate('Cadastro')} />
                    <BigCard icon="people-outline" label="Clientes" color="#1E3A8A" bgColor="rgba(30,58,138,0.1)" onPress={() => navigation.navigate('Clientes')} />
                    
                    <BigCard icon="map-outline" label="Áreas" color="#1E3A8A" bgColor="rgba(30,58,138,0.1)" onPress={() => alert('Em breve')} />
                    <BigCard icon="cloud-upload-outline" label="Sync" color="#8B5CF6" bgColor="rgba(139,92,246,0.1)" onPress={() => navigation.navigate('Sync')} />
                </View>
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

// O Clássico BigCard 3x4 (Design Branco com Círculo Colorido)
const BigCard = ({ icon, label, color, bgColor, onPress }) => (
    <TouchableOpacity style={styles.bigCard} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={styles.bigCardText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Fundo cinza claro igual o print
    },
    greenHeader: {
        backgroundColor: '#166534', // Verde escuro premium
        paddingTop: Platform.OS === 'android' ? 50 : 30,
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    menuButtonSquare: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    headerTitles: {
        flex: 1,
    },
    headerTitleMain: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerTitleSub: {
        color: '#A7F3D0',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    weatherCard: {
        backgroundColor: '#064E3B',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
    },
    weatherText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginLeft: 10,
    },
    statsCard: {
        backgroundColor: '#064E3B',
        borderRadius: 16,
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statLabel: {
        color: '#D1FAE5',
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    statUnit: {
        fontSize: 10,
        fontWeight: 'normal',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    sectionTitleLabel: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginVertical: 15,
        marginLeft: 5,
    },
    grid3x: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    bigCard: {
        width: '31%', // Para dar 3 colunas certinhas
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    bigCardText: {
        color: '#1F2937',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center'
    },
    fabPosition: {
        position: 'absolute',
        bottom: 30,
        right: 20
    }
});
