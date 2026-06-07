import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminSelectorScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Painel do Administrador</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Modo de Teste / Auditoria</Text>
                <Text style={styles.subtitle}>Escolha abaixo qual visão do aplicativo você deseja testar neste momento. Você tem acesso total.</Text>

                {/* Visão Cliente */}
                <TouchableOpacity activeOpacity={0.9} style={styles.cardWrapper} onPress={() => navigation.navigate('Dashboard')}>
                    <LinearGradient colors={['#1B5E20', '#166534']} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="tractor" size={30} color="#FFF" />
                            <View style={styles.badge}><Text style={styles.badgeText}>PRODUTOR</Text></View>
                        </View>
                        <Text style={styles.cardTitle}>Acessar como Cliente</Text>
                        <Text style={styles.cardSub}>Navegue pelo Dashboard Verde, veja receitas e acompanhe o clima.</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Visão Agrônomo */}
                <TouchableOpacity activeOpacity={0.9} style={styles.cardWrapper} onPress={() => navigation.navigate('Dashboard')}>
                    <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="leaf" size={30} color="#FFF" />
                            <View style={styles.badge}><Text style={styles.badgeText}>AGRÔNOMO</Text></View>
                        </View>
                        <Text style={styles.cardTitle}>Acessar como Agrônomo</Text>
                        <Text style={styles.cardSub}>Gerencie clientes, crie recomendações e pegue o código de convite.</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Visão Admin (Futuro Desktop App Mobile View) */}
                <TouchableOpacity activeOpacity={0.9} style={styles.cardWrapper} onPress={() => alert('O Gerenciamento (Aprovações, Faturamento) será mantido no Desktop Web como planejado!')}>
                    <LinearGradient colors={['#111111', '#000000']} style={[styles.card, { borderColor: '#D4AF37', borderWidth: 1 }]}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="shield-crown" size={30} color="#D4AF37" />
                            <View style={[styles.badge, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}><Text style={[styles.badgeText, { color: '#D4AF37' }]}>ADMIN (WEB)</Text></View>
                        </View>
                        <Text style={styles.cardTitle}>Gestão e Aprovações</Text>
                        <Text style={styles.cardSub}>As métricas pesadas e aprovações do sistema ficam restritas à plataforma Desktop.</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#ECEFF1' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#64748B', marginBottom: 30, lineHeight: 20 },
    cardWrapper: { borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, marginBottom: 20 },
    card: { borderRadius: 20, padding: 24 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 8 },
    cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', lineHeight: 18 }
});
