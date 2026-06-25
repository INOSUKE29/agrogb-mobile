import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { PermissionService } from '../services/PermissionService';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export default function SidebarDrawer({ visible, onClose }) {
    const { theme } = useTheme();
    const { role, logout } = useAuth();
    const navigation = useNavigation();

    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // Start hidden (left)
    const [profile, setProfile] = useState({ nome: 'Usuário', email: 'agrogb@sistema.com' });

    useEffect(() => {
        if (visible) {
            // Slide In
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
            loadProfile();
        } else {
            // Slide Out
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadProfile = async () => {
        try {
            const json = await AsyncStorage.getItem('user_session');
            if (json) {
                const session = JSON.parse(json);
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [session.id]);
                if (res.rows.length > 0) {
                    const u = res.rows.item(0);
                    setProfile({
                        nome: u.nome_completo || u.usuario,
                        email: u.email || 'agrogb@sistema.com',
                        avatar: u.avatar || null
                    });
                } else {
                    setProfile({ nome: session.nome, email: 'agrogb@sistema.com', avatar: null });
                }
            }
        } catch (e) { console.error('Sidebar Profile Error:', e); }
    };

    const handleNavigation = (screen, params = {}) => {
        onClose();
        setTimeout(() => {
            navigation.navigate(screen, params);
        }, 300);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sair do App',
            'Deseja realmente sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'SAIR', style: 'destructive',
                    onPress: async () => {
                        onClose();
                        try {
                            await logout();
                        } catch (e) {
                            console.log('Login error', e);
                        }
                    }
                }
            ]
        );
    };

    const MenuItem = ({ icon, label, screen, badge }) => {
        if (!PermissionService.canAccess(role, screen)) return null;

        return (
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation(screen)}>
                <View style={{ width: 30, alignItems: 'center' }}>
                    <Ionicons name={icon} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.menuText}>{label}</Text>
                {badge && <View style={[styles.badge, { backgroundColor: theme?.colors?.error ?? "#EF4444" }]}><Text style={styles.badgeText}>{badge}</Text></View>}
            </TouchableOpacity>
        );
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
            <View style={styles.overlay}>
                {/* Backdrop (Click to close) */}
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                {/* Drawer Content */}
                <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                    <LinearGradient colors={['#06111C', '#0A1522']} style={StyleSheet.absoluteFillObject} />

                    {/* Header: User Info */}
                    <View style={styles.header}>

                        <View style={styles.avatar}>
                            {profile.avatar ? (
                                <Image source={{ uri: profile.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                            ) : (
                                <Ionicons name="person" size={30} color="#0D8C39" />
                            )}
                        </View>
                        <View>
                            <Text style={styles.userName}>{profile.nome || 'AgroGB User'}</Text>
                            <Text style={styles.userEmail}>{profile.email || 'Online'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 20, right: 10 }}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>{role === 'AGRONOMO' ? 'FERRAMENTAS TÉCNICAS' : 'OPERACIONAL'}</Text>
                        <MenuItem icon="home-outline" label="Painel / Início" screen="Home" />
                        {role !== 'AGRONOMO' && <MenuItem icon="leaf-outline" label="Plantio" screen="Plantio" />}
                        <MenuItem icon="camera-outline" label="Monitoramento" screen="Monitoramento" />
                        {role !== 'AGRONOMO' && <MenuItem icon="water-outline" label="Irrigação" screen="Irrigacao" />}
                        {role !== 'AGRONOMO' && <MenuItem icon="flask-outline" label="Fertirrigação" screen="Fertirrigacao" />}
                        {role !== 'AGRONOMO' && <MenuItem icon="color-filter-outline" label="Adubação" screen="AdubacaoList" />}
                        {role !== 'AGRONOMO' && <MenuItem icon="shield-checkmark-outline" label="Aplicações" screen="Aplicacoes" />}
                        {role !== 'AGRONOMO' && <MenuItem icon="basket-outline" label="Colheita" screen="Colheita" />}
                        <MenuItem icon="book-outline" label="Caderno de Campo" screen="CadernoCampo" />
                        {role !== 'AGRONOMO' && <MenuItem icon="link-outline" label="Vincular Agrônomo" screen="AgronomistLink" />}
                        <MenuItem icon="receipt-outline" label={role === 'AGRONOMO' ? 'Emitir Receitas' : 'Receitas e Prescrições'} screen="RecommendationsList" />

                        {role !== 'AGRONOMO' && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>ADMINISTRATIVO</Text>
                                <MenuItem icon="cube-outline" label="Estoque" screen="Estoque" />
                                <MenuItem icon="cart-outline" label="Compras" screen="Compras" />
                                <MenuItem icon="barcode-outline" label="Vendas" screen="Vendas" />
                                <MenuItem icon="people-outline" label="Clientes" screen="Clientes" />
                                <MenuItem icon="business-outline" label="Fornecedores" screen="Fornecedores" />
                                <MenuItem icon="map-outline" label="Talhões" screen="Talhoes" />
                                <MenuItem icon="car-outline" label="Frota / Máquinas" screen="Frota" />
                                <MenuItem icon="people-circle-outline" label="Equipes" screen="Equipes" />
                            </>
                        )}

                        {role !== 'AGRONOMO' && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>FINANCEIRO</Text>
                                <MenuItem icon="cash-outline" label="Contas Pagar/Rec" screen="FinanceiroLancamentos" />
                                <MenuItem icon="stats-chart-outline" label="Financeiro Pro" screen="FinanceiroDashboard" />
                                <MenuItem icon="document-text-outline" label="Relatórios / PDF" screen="Relatorios" />
                            </>
                        )}

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>SISTEMA</Text>
                        <MenuItem icon="person-outline" label="Meu Perfil" screen="Profile" />
                        <MenuItem icon="bar-chart-outline" label="BI Avançado" screen="BIRelatoriosAvancados" />
                        <MenuItem icon="sync-outline" label="Sincronizar" screen="Sync" />
                        <MenuItem icon="shield-outline" label="Auditoria Logs" screen="Audit" />
                        <MenuItem icon="settings-outline" label="Configurações" screen="Settings" />
                    </ScrollView>

                    {/* Footer: Logout */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                            <Text style={styles.logoutText}>SAIR DO SISTEMA</Text>
                        </TouchableOpacity>
                        <Text style={styles.version}>v8.0.0 (Premium)</Text>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    drawer: {
        width: DRAWER_WIDTH,
        height: '100%',
        position: 'absolute',
        left: 0,
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#18B34A'
    },
    userName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    userEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    body: { flex: 1, paddingVertical: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#18B34A', marginLeft: 20, marginTop: 25, marginBottom: 10, letterSpacing: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    menuText: { fontSize: 14, color: '#FFFFFF', marginLeft: 15, fontWeight: '500' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10, marginHorizontal: 20 },
    footer: { padding: 25, backgroundColor: 'transparent' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
    logoutText: { color: '#EF4444', fontSize: 14, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
    version: { marginTop: 15, fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }
});
