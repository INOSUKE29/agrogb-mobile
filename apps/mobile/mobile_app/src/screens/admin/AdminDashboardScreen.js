import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ScreenLayout from '../../components/layout/ScreenLayout';

export default function AdminDashboardScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Painel Admin Móvel</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Empty State / Construction Banner */}
                <LinearGradient colors={['#3F3F46', '#18181B']} style={styles.constructionBanner}>
                    <MaterialCommunityIcons name="tools" size={40} color="#D4AF37" style={{ marginBottom: 15 }} />
                    <Text style={styles.bannerTitle}>Fundação Concluída</Text>
                    <Text style={styles.bannerText}>
                        A base deste módulo gerencial está estabelecida e em conformidade com as Regras de Ouro. O painel receberá métricas reais (Faturamento, Auditorias) nas próximas atualizações.
                    </Text>
                </LinearGradient>

                <Text style={styles.sectionTitle}>Métricas Previstas (Mock-Free)</Text>

                <View style={styles.grid}>
                    <View style={styles.gridCard}>
                        <Ionicons name="cash-outline" size={28} color="#D4AF37" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Faturamento Global</Text>
                    </View>
                    <View style={styles.gridCard}>
                        <Ionicons name="shield-checkmark-outline" size={28} color="#10B981" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Aprovações</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridCard}>
                        <Ionicons name="people-outline" size={28} color="#3B82F6" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Usuários Ativos</Text>
                    </View>
                    <View style={styles.gridCard}>
                        <Ionicons name="cloud-done-outline" size={28} color="#8B5CF6" />
                        <Text style={styles.gridValue}>-</Text>
                        <Text style={styles.gridLabel}>Sincronizações</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090B' },
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, 
        backgroundColor: '#18181B', borderBottomWidth: 1, borderColor: '#27272A' 
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    content: { padding: 20 },
    
    constructionBanner: {
        padding: 24, borderRadius: 20, marginBottom: 30, alignItems: 'center',
        borderWidth: 1, borderColor: '#D4AF37'
    },
    bannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 10 },
    bannerText: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', lineHeight: 22 },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37', marginBottom: 15, letterSpacing: 1 },
    
    grid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    gridCard: {
        flex: 1, backgroundColor: '#18181B', padding: 20, borderRadius: 16,
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center'
    },
    gridValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginVertical: 10 },
    gridLabel: { fontSize: 12, color: '#A1A1AA', textAlign: 'center' }
});
