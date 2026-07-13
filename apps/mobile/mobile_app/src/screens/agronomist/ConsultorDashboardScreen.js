import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ScreenLayout from '../../components/layout/ScreenLayout';

export default function ConsultorDashboardScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Indicadores</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Empty State / Construction Banner */}
                <LinearGradient colors={['#172554', '#1E3A8A']} style={styles.constructionBanner}>
                    <MaterialCommunityIcons name="chart-box-outline" size={40} color="#60A5FA" style={{ marginBottom: 15 }} />
                    <Text style={styles.bannerTitle}>Módulo em Preparação</Text>
                    <Text style={styles.bannerText}>
                        A base do seu dashboard de campo está concluída. As métricas de Visitas vs. Pendências começarão a ser preenchidas nas próximas atualizações de backend.
                    </Text>
                </LinearGradient>

                <Text style={styles.sectionTitle}>Desempenho no Campo (Mock-Free)</Text>

                <View style={styles.grid}>
                    <View style={styles.gridCard}>
                        <Ionicons name="calendar-outline" size={28} color="#60A5FA" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Visitas Realizadas (Mês)</Text>
                    </View>
                    <View style={styles.gridCard}>
                        <Ionicons name="alert-circle-outline" size={28} color="#F87171" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Atendimentos Pendentes</Text>
                    </View>
                </View>

                <View style={styles.singleCard}>
                    <Ionicons name="trending-up-outline" size={32} color="#10B981" />
                    <View style={styles.singleCardBody}>
                        <Text style={styles.singleCardTitle}>Taxa de Sucesso</Text>
                        <Text style={styles.singleCardDesc}>Recomendações aplicadas vs prescritas.</Text>
                    </View>
                    <Text style={[styles.gridValue, { color: '#10B981' }]}>-%</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, 
        backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' 
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    content: { padding: 20 },
    
    constructionBanner: {
        padding: 24, borderRadius: 20, marginBottom: 30, alignItems: 'center',
        borderWidth: 1, borderColor: '#3B82F6'
    },
    bannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 10 },
    bannerText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#60A5FA', marginBottom: 15, letterSpacing: 1 },
    
    grid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    gridCard: {
        flex: 1, backgroundColor: '#1E293B', padding: 20, borderRadius: 16,
        borderWidth: 1, borderColor: '#334155', alignItems: 'center'
    },
    gridValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginVertical: 10 },
    gridLabel: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

    singleCard: {
        backgroundColor: '#1E293B', padding: 20, borderRadius: 16,
        borderWidth: 1, borderColor: '#334155', flexDirection: 'row',
        alignItems: 'center', gap: 15
    },
    singleCardBody: { flex: 1 },
    singleCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
    singleCardDesc: { fontSize: 12, color: '#94A3B8' }
});
