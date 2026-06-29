import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SidebarAdmin({ navigation, closeSidebar, panX }) {

    const MenuItem = ({ icon, label, screen }) => (
        <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
                closeSidebar();
                navigation.navigate(screen);
            }}
        >
            <Ionicons name={icon} size={22} color="#D4AF37" />
            <Text style={styles.menuText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: panX }] }]}>
            <LinearGradient colors={['#111111', '#000000']} style={styles.gradient}>
                <View style={styles.header}>
                    <View style={styles.profileBadge}>
                        <Ionicons name="shield-checkmark" size={28} color="#000" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.userName}>Administrador</Text>
                        <Text style={styles.userRole}>Modo Gestão (Bolso)</Text>
                    </View>
                </View>

                <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>VISÃO EXECUTIVA</Text>
                    <MenuItem icon="pie-chart-outline" label="Painel de Bolso" screen="HomeAdmin" />
                    <MenuItem icon="checkmark-done-outline" label="Aprovações Pendentes" screen="HomeAdmin" />

                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionTitle}>SUPORTE</Text>
                    <MenuItem icon="people-outline" label="Ver Equipe" screen="HomeAdmin" />
                    <MenuItem icon="swap-horizontal-outline" label="Trocar Perfil (Impersonate)" screen="AdminSelector" />

                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionTitle}>CONFIGURAÇÕES</Text>
                    <MenuItem icon="settings-outline" label="Configurações Globais" screen="HomeAdmin" />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('Login')}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Sair do App</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 280,
        zIndex: 100,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    gradient: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    profileBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    userName: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userRole: {
        color: '#D4AF37',
        fontSize: 13,
        marginTop: 2,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 20,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    menuText: {
        color: '#E2E8F0',
        fontSize: 15,
        marginLeft: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 10,
        marginHorizontal: 20,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        marginLeft: 10,
        fontWeight: 'bold',
    }
});
