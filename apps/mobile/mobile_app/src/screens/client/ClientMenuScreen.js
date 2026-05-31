import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';

const MENU_ITEMS = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'home-outline', route: 'HomeClient' },
    { id: 'Talhoes', label: 'Talhões / Culturas', icon: 'grid-outline', route: 'Culturas' },
    { id: 'Plantio', label: 'Plantio', icon: 'leaf-outline', route: null },
    { id: 'Monitoramento', label: 'Monitoramento', icon: 'scan-outline', route: null },
    { id: 'Adubacao', label: 'Adubação', icon: 'flask-outline', route: 'MenuAdubacao' },
    { id: 'Pulverizacao', label: 'Pulverização', icon: 'water-outline', route: null },
    { id: 'Irrigacao', label: 'Irrigação', icon: 'rainy-outline', route: null },
    { id: 'Colheita', label: 'Colheita', icon: 'basket-outline', route: 'Colheita' },
    { id: 'Frota', label: 'Frota e Máquinas', icon: 'car-sport-outline', route: 'Frota' },
    { id: 'Financeiro', label: 'Financeiro', icon: 'cash-outline', route: 'MenuFinanceiro' },
    { id: 'Relatorios', label: 'Relatórios', icon: 'bar-chart-outline', route: 'Relatorios' },
    { id: 'Documentos', label: 'Documentos', icon: 'document-text-outline', route: null },
    { id: 'MeuAgronomo', label: 'Meu Agrônomo', icon: 'person-outline', route: null },
    { id: 'Configuracoes', label: 'Configurações', icon: 'settings-outline', route: 'Settings' },
    { id: 'Ajuda', label: 'Ajuda e Suporte', icon: 'help-circle-outline', route: null },
];

export default function ClientMenuScreen({ navigation }) {

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: async () => {
                await supabase.auth.signOut();
            }}
        ]);
    };

    const handlePress = (item) => {
        if (item.route) {
            navigation.navigate(item.route);
        } else {
            Alert.alert('Em breve', `Módulo ${item.label} em desenvolvimento.`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Profile */}
            <View style={styles.header}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>JS</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>João da Silva</Text>
                        <Text style={styles.farmName}>Fazenda Boa Vista</Text>
                        <View style={styles.planBadge}>
                            <Text style={styles.planText}>Plano Básico</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.menuItem} 
                        activeOpacity={0.7}
                        onPress={() => handlePress(item)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name={item.icon} size={22} color="#10B981" style={styles.menuIcon} />
                            <Text style={styles.menuText}>{item.label}</Text>
                        </View>
                        {/* Only add bottom border if not the last item in a visual block, but here let's keep it clean without borders or subtle ones */}
                    </TouchableOpacity>
                ))}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.logoutItem} activeOpacity={0.7} onPress={handleLogout}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" style={styles.menuIcon} />
                        <Text style={styles.logoutText}>Sair da conta</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10B981', marginRight: 15 },
    avatarText: { color: '#10B981', fontSize: 20, fontWeight: '900' },
    profileInfo: { flex: 1 },
    userName: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 2 },
    farmName: { color: '#94A3B8', fontSize: 14, fontWeight: '500', marginBottom: 6 },
    planBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    planText: { color: '#10B981', fontSize: 11, fontWeight: '800' },

    scroll: { paddingVertical: 15 },
    
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuIcon: { marginRight: 15 },
    menuText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
    
    divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 15, marginHorizontal: 20 },
    
    logoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 30
    },
    logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' }
});
