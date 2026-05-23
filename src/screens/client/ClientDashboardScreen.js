import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { registerForPushNotificationsAsync } from '../../services/notificationService'; // NOVO: Notificações

export default function ClientDashboardScreen({ navigation }) {
    const [userName, setUserName] = useState("Carregando...");
    const [farmName, setFarmName] = useState("Nenhuma fazenda");
    const [nextApplication, setNextApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [agronomistPhone, setAgronomistPhone] = useState("");

    const loadData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            
            // 1. Tentar pegar dados do cache primeiro (Offline-first)
            const cachedUser = await AsyncStorage.getItem('@client_user_name');
            const cachedFarm = await AsyncStorage.getItem('@client_farm_name');
            const cachedNextApp = await AsyncStorage.getItem('@client_next_app');
            const cachedPhone = await AsyncStorage.getItem('@client_agro_phone');

            if (cachedUser) setUserName(cachedUser);
            if (cachedFarm) setFarmName(cachedFarm);
            if (cachedNextApp) setNextApplication(JSON.parse(cachedNextApp));
            if (cachedPhone) setAgronomistPhone(cachedPhone);

            // 2. Buscar da Nuvem (Supabase) para atualizar o cache
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) return;
            
            const userId = sessionData.session.user.id;

            // Busca Perfil
            const { data: profile } = await supabase.from('profiles').select('full_name, expo_push_token').eq('id', userId).single();
            if (profile) {
                setUserName(profile.full_name || 'Produtor');
                await AsyncStorage.setItem('@client_user_name', profile.full_name || 'Produtor');
                
                // --- NOVO: Lógica de Push Notification ---
                const token = await registerForPushNotificationsAsync();
                if (token && profile.expo_push_token !== token) {
                    // Atualiza o token no Supabase apenas se for novo ou diferente
                    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
                    console.log('[ClientDashboard] Push Token atualizado no banco.');
                }
            }

            // Busca Fazenda
            const { data: farm } = await supabase.from('farms').select('name').eq('owner_id', userId).limit(1).single();
            if (farm) {
                setFarmName(farm.name);
                await AsyncStorage.setItem('@client_farm_name', farm.name);
            }

            // Busca Próxima Recomendação Pendente
            const { data: recs } = await supabase.from('recommendations')
                .select(`id, title, scheduled_date, field_id, status, fields(name), agronomist_id`)
                .eq('client_id', userId)
                .eq('status', 'PENDING')
                .order('scheduled_date', { ascending: true })
                .limit(1)
                .single();

            if (recs) {
                const nextApp = {
                    title: recs.title,
                    date: new Date(recs.scheduled_date).toLocaleDateString('pt-BR'),
                    field: recs.fields?.name || 'Geral',
                    status: 'Pendente'
                };
                setNextApplication(nextApp);
                await AsyncStorage.setItem('@client_next_app', JSON.stringify(nextApp));

                // Busca Telefone do Agrônomo vinculado
                const { data: agroProfile } = await supabase.from('profiles').select('phone').eq('id', recs.agronomist_id).single();
                if (agroProfile?.phone) {
                    setAgronomistPhone(agroProfile.phone);
                    await AsyncStorage.setItem('@client_agro_phone', agroProfile.phone);
                }
            } else {
                setNextApplication(null);
                await AsyncStorage.removeItem('@client_next_app');
            }

        } catch (error) {
            console.log('[ClientDashboard] Usando apenas dados locais. Erro de rede:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    const handleWhatsApp = () => {
        const phone = agronomistPhone || "5511999999999"; 
        const msg = "Olá, estou com uma dúvida sobre a minha fazenda no aplicativo AgroGB.";
        Linking.openURL(`whatsapp://send?text=${msg}&phone=${phone}`).catch(() => {
            alert('WhatsApp não está instalado neste dispositivo.');
        });
    };

    if (loading && !nextApplication && userName === "Carregando...") {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1B5E20" />
                <Text style={{ marginTop: 10, color: '#1B5E20', fontWeight: 'bold' }}>Sincronizando com a Nuvem...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {userName} 👋</Text>
                    <View style={styles.farmRow}>
                        <Ionicons name="location" size={14} color="#1B5E20" />
                        <Text style={styles.farmName}>{farmName}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                    <Ionicons name="person-circle" size={40} color="#1B5E20" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
            >
                
                {/* Weather / Alert Widget */}
                <View style={styles.weatherCard}>
                    <View style={styles.weatherIconBox}>
                        <Ionicons name="partly-sunny" size={32} color="#F57F17" />
                    </View>
                    <View style={styles.weatherInfo}>
                        <Text style={styles.weatherTemp}>24°C</Text>
                        <Text style={styles.weatherDesc}>Condição ideal para pulverização hoje.</Text>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Próxima Atividade</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Recommendations')}>
                        <Text style={styles.seeAll}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Action Card */}
                {nextApplication ? (
                    <TouchableOpacity activeOpacity={0.9} style={styles.actionCardWrapper}>
                        <LinearGradient colors={['#1B5E20', '#166534']} style={styles.actionCard}>
                            <View style={styles.actionCardHeader}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>AGENDADO: {nextApplication.date}</Text>
                                </View>
                                <MaterialCommunityIcons name="spray-bottle" size={24} color="#FFF" />
                            </View>
                            <Text style={styles.actionTitle}>{nextApplication.title}</Text>
                            <Text style={styles.actionSubtitle}>{nextApplication.field}</Text>
                            
                            <View style={styles.actionFooter}>
                                <View style={styles.btnMix}>
                                    <Text style={styles.btnMixText}>PREPARAR CALDA</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#1B5E20" style={{marginLeft: 5}}/>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyActionCard}>
                        <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                        <Text style={styles.emptyActionTitle}>Tudo em dia!</Text>
                        <Text style={styles.emptyActionSub}>Você não tem nenhuma aplicação pendente no momento.</Text>
                    </View>
                )}

                {/* Quick Actions Grid */}
                <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Recommendations')}>
                        <View style={[styles.gridIconBox, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialCommunityIcons name="clipboard-text-clock" size={26} color="#2E7D32" />
                        </View>
                        <Text style={styles.gridText}>Histórico</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('MyFarm')}>
                        <View style={[styles.gridIconBox, { backgroundColor: '#FFF3E0' }]}>
                            <FontAwesome5 name="tractor" size={20} color="#E65100" />
                        </View>
                        <Text style={styles.gridText}>Meus Talhões</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={handleWhatsApp}>
                        <View style={[styles.gridIconBox, { backgroundColor: '#E1F5FE' }]}>
                            <FontAwesome5 name="whatsapp" size={26} color="#0277BD" />
                        </View>
                        <Text style={styles.gridText}>Falar com Agrônomo</Text>
                    </TouchableOpacity>
                </View>

                {/* WhatsApp Big Button (Alternative/Footer) */}
                <TouchableOpacity style={styles.whatsappBtnWrapper} onPress={handleWhatsApp} activeOpacity={0.8}>
                    <LinearGradient colors={['#25D366', '#128C7E']} style={styles.whatsappBtn}>
                        <FontAwesome5 name="whatsapp" size={24} color="#FFF" />
                        <Text style={styles.whatsappBtnText}>Tirar Dúvida no WhatsApp</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#ECEFF1' },
    greeting: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    farmRow: { flexDirection: 'row', alignItems: 'center' },
    farmName: { fontSize: 14, color: '#64748B', marginLeft: 4, fontWeight: '600' },
    content: { padding: 20, paddingBottom: 40 },
    
    weatherCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    weatherIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFFDE7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    weatherTemp: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    weatherDesc: { fontSize: 13, color: '#64748B', marginTop: 2, flexWrap: 'wrap', width: '80%' },
    
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 10, marginBottom: 15 },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#1B5E20', marginBottom: 15 },
    
    actionCardWrapper: { borderRadius: 24, elevation: 8, shadowColor: '#1B5E20', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, marginBottom: 30 },
    actionCard: { borderRadius: 24, padding: 24 },
    actionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    actionTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 8 },
    actionSubtitle: { fontSize: 15, color: '#C8E6C9', fontWeight: '500', marginBottom: 25 },
    actionFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
    btnMix: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    btnMixText: { color: '#1B5E20', fontWeight: '900', fontSize: 13 },
    
    emptyActionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#E8F5E9', borderStyle: 'dashed' },
    emptyActionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 15, marginBottom: 5 },
    emptyActionSub: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingHorizontal: 20 },

    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    gridItem: { width: '30%', backgroundColor: '#FFF', borderRadius: 16, padding: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5 },
    gridIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridText: { fontSize: 12, fontWeight: '700', color: '#475569', textAlign: 'center' },
    
    whatsappBtnWrapper: { borderRadius: 16, elevation: 4, shadowColor: '#25D366', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, marginTop: 10 },
    whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16 },
    whatsappBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginLeft: 12 }
});
