import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Alert, 
    TouchableOpacity, RefreshControl, Image, Switch,
    StatusBar, SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import SafeBlurView from '../ui/SafeBlurView';

import { useTheme } from '../context/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { showToast } from '../ui/Toast';
import { AuthService } from '../services/authService';
import { executeQuery } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { LoggingService } from '../modules/system/services/LoggingService';
import { StorageHelper } from '../services/storageHelper';

export default function SettingsScreen({ navigation }) {
    const { theme, saveTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({ 
        nome: 'Carregando...', 
        email: '', 
        avatar: null, 
        empresa: 'Carregando fazenda...' 
    });
    const [biometryInfo, setBiometryInfo] = useState({ available: false, enrolled: false });

    const loadData = async () => {
        setLoading(true);
        try {
            const session = await AuthService.checkSession();
            if (session) {
                // 1. Busca dados do Usuário
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ? OR uuid = ?', [session.userId, session.userId]);
                let userData = { nome: 'Produtor AgroGB', email: session.email, empresa: 'Fazenda não encontrada' };
                
                if (res.rows.length > 0) {
                    const dbUser = res.rows.item(0);
                    userData.nome = dbUser.nome_completo || dbUser.usuario;
                    userData.email = dbUser.email || session.email;
                    userData.avatar = dbUser.avatar;
                }

                // 2. Busca Empresa/Fazenda vinculada (v2_fazendas)
                const resFazenda = await executeQuery('SELECT nome FROM v2_fazendas WHERE produtor_id = ? LIMIT 1', [session.userId]);
                if (resFazenda.rows.length > 0) {
                    userData.empresa = resFazenda.rows.item(0).nome;
                }

                setUser(userData);
            }

            // 3. Status Biometria
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const asked = await StorageHelper.get('@asked_biometrics');
            setBiometryInfo({
                available: hasHardware,
                enrolled: asked === 'true' && isEnrolled
            });

        } catch (e) {
            console.error('[Settings] Erro ao carregar dados:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleToggleBiometry = async () => {
        if (!biometryInfo.available) {
            Alert.alert('Indisponível', 'Este dispositivo não suporta biometria ou ela não está configurada nas configurações do sistema.');
            return;
        }

        if (biometryInfo.enrolled) {
            await StorageHelper.remove('@asked_biometrics');
            showToast('Biometria desativada');
            loadData();
        } else {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirme sua identidade para ativar a biometria',
                fallbackLabel: 'Usar Senha',
                disableDeviceFallback: false
            });
            
            if (result.success) {
                await StorageHelper.save('@asked_biometrics', 'true');
                showToast('Biometria ativada!');
                loadData();
            } else {
                showToast('Falha ao autenticar biometria');
            }
        }
    };

    const runManualSync = async () => {
        setLoading(true);
        try {
            showToast('Sincronizando...');
            const push = await pushLocalChanges();
            const pull = await pullServerChanges();
            showToast(`Sincronizado! ↑${push.pushed || 0} ↓${pull.pulled || 0}`);
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja encerrar a sessão?', [
            { text: 'MANTER CONECTADO', style: 'cancel' },
            { text: 'SAIR AGORA', style: 'destructive', onPress: async () => { await AuthService.logout(); } }
        ]);
    };

    // --- COMPONENTES INTERNOS FIÉIS AO MOCKUP ---

    const SettingsItem = ({ icon, label, value, onPress, type = 'chevron', danger, isLast, iconColor = '#10B981' }) => (
        <View>
            <TouchableOpacity 
                onPress={onPress} 
                activeOpacity={0.7} 
                style={styles.itemWrapper}
            >
                <View style={styles.itemMain}>
                    <View style={[styles.iconBox, { backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : iconColor} />
                    </View>
                    <Text style={[styles.itemLabel, danger && { color: '#EF4444' }]}>{label}</Text>
                </View>
                
                <View style={styles.itemRight}>
                    {type === 'switch' ? (
                        <Switch 
                            value={!!value} 
                            onValueChange={onPress}
                            trackColor={{ false: '#1E293B', true: '#10B981' }}
                            thumbColor="#FFF"
                        />
                    ) : (
                        <View style={styles.chevronGroup}>
                            {value && <Text style={styles.itemValue}>{value}</Text>}
                            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            {!isLast && <View style={styles.itemDivider} />}
        </View>
    );

    const SettingsGroup = ({ icon, title, children }) => (
        <View style={styles.groupContainer}>
            <View style={styles.groupHeader}>
                <Ionicons name={icon} size={16} color="rgba(16, 185, 129, 0.6)" />
                <Text style={styles.groupTitle}>{title}</Text>
            </View>
            <SafeBlurView intensity={20} tint="dark" style={styles.groupCard}>
                {children}
            </SafeBlurView>
        </View>
    );

    return (
        <AppContainer>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#030712', '#060B18', '#020617']} style={StyleSheet.absoluteFill} />
            
            {/* 🌀 AMBIENT ORBS (Estilo Diamond) */}
            <View style={[styles.ambientOrb, { top: -80, right: -40, backgroundColor: '#10B981', opacity: 0.06 }]} />
            <View style={[styles.ambientOrb, { bottom: 100, left: -60, backgroundColor: '#3B82F6', opacity: 0.04 }]} />

            <ScreenHeader title="Perfil & Configurações" onBack={() => navigation.goBack()} transparent />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#10B981" />}
            >
                {/* 👤 PERFIL HEADER (Fiel ao Mockup Foto 3) */}
                <SafeBlurView intensity={35} tint="dark" style={styles.profileCard}>
                    <View style={styles.profileContent}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarInner}>
                                {user.avatar ? (
                                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                                ) : (
                                    <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarLetter}>{user.nome?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        
                        <View style={styles.userTextContent}>
                            <Text style={styles.profileName} numberOfLines={1}>{user.nome}</Text>
                            <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
                            <View style={styles.farmBadge}>
                                <Ionicons name="leaf" size={10} color="#10B981" />
                                <Text style={styles.profileCompany}>{user.empresa}</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.editBtn} 
                            onPress={() => navigation.navigate('ProfileEdit')}
                            activeOpacity={0.7}
                        >
                            <SafeBlurView intensity={40} tint="light" style={styles.editBtnContent}>
                                <Text style={styles.editBtnText}>Editar Perfil</Text>
                            </SafeBlurView>
                        </TouchableOpacity>
                    </View>
                </SafeBlurView>

                {/* 👤 PERFIL/APP */}
                <SettingsGroup icon="person-outline" title="Perfil">
                    <SettingsItem icon="sunny-outline" label="Tema" value={theme?.theme_mode === 'dark' ? 'Escuro' : 'Claro'} onPress={() => saveTheme(theme?.theme_mode === 'dark' ? 'light' : 'dark')} iconColor="#EAB308" />
                    <SettingsItem icon="globe-outline" label="Idioma" value="Português" onPress={() => {}} />
                    <SettingsItem icon="layers-outline" label="Unidade" value="kg" onPress={() => {}} iconColor="#10B981" />
                    <SettingsItem icon="calendar-outline" label="Safra" value="2024/25" isLast onPress={() => {}} />
                </SettingsGroup>

                {/* 🔔 NOTIFICAÇÕES */}
                <SettingsGroup icon="notifications-outline" title="Notificações">
                    <SettingsItem icon="notifications-outline" label="Alertas Agrícolas" type="switch" value={true} onPress={() => {}} />
                    <SettingsItem icon="wallet-outline" label="Financeiro" type="switch" value={true} onPress={() => {}} iconColor="#3B82F6" />
                    <SettingsItem icon="time-outline" label="Horário" value="20:00" onPress={() => {}} />
                    <SettingsItem icon="repeat-outline" label="Frequência" value="Diariamente" isLast onPress={() => {}} />
                </SettingsGroup>

                {/* 🛡️ SEGURANÇA */}
                <SettingsGroup icon="shield-checkmark-outline" title="Segurança">
                    <SettingsItem icon="lock-closed-outline" label="Senha" onPress={() => showToast('Funcionalidade em breve')} iconColor="rgba(255,255,255,0.4)" />
                    <SettingsItem icon="finger-print-outline" label="Biometria" type="switch" value={biometryInfo.enrolled} onPress={handleToggleBiometry} />
                    <SettingsItem icon="key-outline" label="Autenticação em Duas Etapas" onPress={() => {}} />
                    <SettingsItem icon="phone-portrait-outline" label="Sessões Ativas" isLast onPress={() => {}} />
                </SettingsGroup>

                {/* 🔄 DADOS & SYNC */}
                <SettingsGroup icon="cloud-upload-outline" title="Dados">
                    <SettingsItem icon="sync-outline" label="Sincronizar Dados" onPress={runManualSync} />
                    <SettingsItem icon="cloud-done-outline" label="Backup & Sincronização" onPress={() => navigation.navigate('Sync')} />
                    <View style={styles.syncStatusFooter}>
                        <View style={styles.statusDotRow}>
                            <View style={styles.activeDot} />
                            <Text style={styles.statusText}>Status: <Text style={{ color: '#10B981' }}>Online</Text></Text>
                        </View>
                        <Text style={styles.syncDate}>Último Backup: 23/04/2024</Text>
                    </View>
                </SettingsGroup>

                {/* 🛠️ SUPORTE TÉCNICO (Novo) */}
                <SettingsGroup icon="construct-outline" title="Suporte Técnico">
                    <SettingsItem 
                        icon="bug-outline" 
                        label="Exportar Relatório de Erros" 
                        iconColor="#F59E0B"
                        isLast
                        onPress={async () => {
                            setLoading(true);
                            const res = await LoggingService.exportLogs();
                            setLoading(false);
                            if (!res.success) {
                                Alert.alert('Aviso', res.message);
                            }
                        }} 
                    />
                </SettingsGroup>

                {/* 🚪 LOGOUT (Fiel ao Mockup) */}
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={['#991B1B', '#7F1D1D']} style={styles.logoutGradient}>
                        <Text style={styles.logoutBtnText}>Sair</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>AgroGB Diamond Pro • v{Constants.expoConfig.version}</Text>
                    <Text style={styles.versionSub}>SISTEMA DE GESTÃO RURAL</Text>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 18, paddingBottom: 60 },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },

    // Profile Card
    profileCard: {
        borderRadius: 28, marginBottom: 26, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    profileContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    avatarWrapper: {
        width: 68, height: 68, borderRadius: 34,
        padding: 2, borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    avatarInner: { width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden', backgroundColor: '#000' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { backgroundColor: '#0B1120', justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { color: '#10B981', fontSize: 28, fontWeight: '900' },
    
    userTextContent: { flex: 1, marginLeft: 16 },
    profileName: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    profileEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 1 },
    farmBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    profileCompany: { color: 'rgba(16, 185, 129, 0.8)', fontSize: 11, fontWeight: '700' },

    editBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    editBtnContent: { paddingHorizontal: 14, paddingVertical: 10 },
    editBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

    // Groups
    groupContainer: { marginBottom: 28 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8, marginBottom: 12 },
    groupTitle: { 
        color: '#FFF', fontSize: 13, fontWeight: '800', 
        letterSpacing: 0.5, opacity: 0.9
    },
    groupCard: {
        borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
    },

    // Items
    itemWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14
    },
    itemLabel: { color: '#F1F5F9', fontSize: 15, fontWeight: '600' },
    itemRight: { flexDirection: 'row', alignItems: 'center' },
    chevronGroup: { flexDirection: 'row', alignItems: 'center' },
    itemValue: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginRight: 8, fontWeight: '500' },
    itemDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 18 },

    // Dados specific
    syncStatusFooter: { padding: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.02)' },
    statusDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },
    syncDate: { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 14 },

    // Sair Button
    logoutBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 10, marginBottom: 30 },
    logoutGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
    logoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    versionInfo: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
    versionText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    versionSub: { color: 'rgba(16, 185, 129, 0.3)', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 2 }
});

