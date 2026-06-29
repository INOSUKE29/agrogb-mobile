import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SidebarAdmin from '../../components/SidebarAdmin';

const { width } = Dimensions.get('window');

export default function HomeAdminScreen({ navigation }) {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const panX = useRef(new Animated.Value(-width)).current;

    const openSidebar = () => {
        setSidebarVisible(true);
        Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(panX, {
            toValue: -width,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setSidebarVisible(false));
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dx < -20 && sidebarVisible;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    panX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -50 || gestureState.vx < -0.5) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            },
        })
    ).current;

    const KPICard = ({ title, value, subtitle, icon, color }) => (
        <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiTitle}>{title}</Text>
            <Text style={styles.kpiSub}>{subtitle}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Overlay Escuro quando Sidebar aberta */}
            {sidebarVisible && (
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1} 
                    onPress={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <SidebarAdmin navigation={navigation} closeSidebar={closeSidebar} panX={panX} />

            <View style={styles.header} {...panResponder.panHandlers}>
                <TouchableOpacity onPress={openSidebar} style={styles.menuBtn}>
                    <Ionicons name="menu" size={28} color="#D4AF37" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Painel Executivo</Text>
                    <Text style={styles.headerSub}>Visão Geral (Tempo Real)</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Header Dourado */}
                <LinearGradient colors={['#111111', '#000000']} style={styles.heroCard}>
                    <View style={styles.heroRow}>
                        <View>
                            <Text style={styles.heroLabel}>Faturamento Estimado (Mês)</Text>
                            <Text style={styles.heroValue}>R$ 485.200,00</Text>
                        </View>
                        <MaterialCommunityIcons name="finance" size={40} color="#D4AF37" />
                    </View>
                    <View style={styles.heroBottomRow}>
                        <Text style={styles.heroSubText}>+12.4% em relação ao mês passado</Text>
                    </View>
                </LinearGradient>

                {/* Grid de KPIs */}
                <View style={styles.kpiGrid}>
                    <KPICard title="Prescrições Hoje" value="14" subtitle="4 aguardando aprovação" icon="receipt-outline" color="#3B82F6" />
                    <KPICard title="Visitas Realizadas" value="28" subtitle="Meta semanal: 35" icon="location-outline" color="#10B981" />
                    <KPICard title="Clientes Ativos" value="112" subtitle="+3 esta semana" icon="people-outline" color="#F59E0B" />
                    <KPICard title="Alertas Críticos" value="2" subtitle="Requer atenção" icon="warning-outline" color="#EF4444" />
                </View>

                {/* Seção de Aprovações */}
                <Text style={styles.sectionTitle}>Aprovações de Emergência</Text>
                
                <View style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Ionicons name="alert-circle" size={20} color="#F59E0B" style={{marginRight: 8}}/>
                            <Text style={styles.approvalTitle}>Prescrição Alto Custo</Text>
                        </View>
                        <Text style={styles.approvalTime}>Há 15 min</Text>
                    </View>
                    <Text style={styles.approvalDesc}>Agrônomo: Carlos Silva</Text>
                    <Text style={styles.approvalDesc}>Cliente: Fazenda Boa Esperança</Text>
                    <Text style={styles.approvalValue}>Valor Estimado: R$ 125.000,00</Text>
                    
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => alert('Rejeitado!')}>
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Rejeitar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => alert('Aprovado com sucesso!')}>
                            <Text style={[styles.actionText, { color: '#10B981' }]}>Aprovar Pedido</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#111111' },
    menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
    headerSub: { fontSize: 12, color: '#D4AF37', textAlign: 'center' },
    content: { padding: 20 },
    
    heroCard: { borderRadius: 16, padding: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#333' },
    heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 5 },
    heroValue: { color: '#D4AF37', fontSize: 28, fontWeight: '900' },
    heroBottomRow: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heroSubText: { color: '#10B981', fontSize: 13, fontWeight: '600' },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    kpiCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    kpiIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    kpiValue: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    kpiTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 2 },
    kpiSub: { fontSize: 11, color: '#94A3B8' },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15, marginTop: 10 },
    
    approvalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, borderWidth: 1, borderColor: '#F1F5F9' },
    approvalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    approvalTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    approvalTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    approvalDesc: { fontSize: 14, color: '#475569', marginBottom: 4 },
    approvalValue: { fontSize: 15, fontWeight: '800', color: '#D4AF37', marginTop: 8, marginBottom: 15 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
    actionText: { fontWeight: '700', fontSize: 14 }
});
