import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Alert, 
    TouchableOpacity, RefreshControl, Platform, Linking, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import SettingItem from '../ui/components/SettingItem';
import { showToast } from '../ui/Toast';
import { AuthService } from '../services/authService';
import { getAppSettings, updateAppSetting, executeQuery } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';

export default function SettingsScreen({ navigation }) {
    const { colors, theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [user, setUser] = useState({ nome: 'Produtor', email: '', avatar: null });
    const [biometryInfo, setBiometryInfo] = useState({ available: false, enrolled: false });

    // Padrão v1.1.11: Idiomas e Notificações (Simulados no Banco)
    const [language, setLanguage] = useState('Português (Brasil)');
    const [notifications, setNotifications] = useState({ push: true, alerts: true });

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Carrega Settings do Banco
            const s = await getAppSettings();
            if (s) setSettings(s);

            // 2. Carrega Perfil
            const session = await AuthService.checkSession();
            if (session) {
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ? OR uuid = ?', [session.userId, session.userId]);
                if (res.rows.length > 0) setUser(res.rows.item(0));
            }

            // 3. Status Biometria
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const asked = await AsyncStorage.getItem('@asked_biometrics');
            setBiometryInfo({
                available: hasHardware,
                enrolled: asked === 'true' && isEnrolled
            });

            // 4. Idioma Escolhido (Persistência Simples)
            const savedLang = await AsyncStorage.getItem('@app_language');
            if (savedLang) setLanguage(savedLang);

        } catch (e) {
            console.error('[Settings] Erro ao carregar dados:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleUpdate = async (key, value) => {
        try {
            await updateAppSetting(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
            showToast('Preferência salva!');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível salvar a configuração.');
        }
    };

    const handleLanguageChange = async () => {
        const nextLang = language === 'Português (Brasil)' ? 'English (US)' : 'Português (Brasil)';
        setLanguage(nextLang);
        await AsyncStorage.setItem('@app_language', nextLang);
        showToast(`Idioma alterado para ${nextLang}`);
    };

    const handleToggleBiometry = async () => {
        if (!biometryInfo.available) return;
        
        if (biometryInfo.enrolled) {
            await AsyncStorage.removeItem('@asked_biometrics');
            showToast('Biometria desativada');
            loadData();
        } else {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirme sua identidade para ativar o acesso rápido',
                fallbackLabel: 'Usar Senha'
            });
            if (result.success) {
                await AsyncStorage.setItem('@asked_biometrics', 'true');
                showToast('Login por digital ativado!');
                loadData();
            }
        }
    };

    const runManualSync = async () => {
        setLoading(true);
        try {
            showToast('Iniciando sincronização...');
            const push = await pushLocalChanges();
            const pull = await pullServerChanges();
            showToast(`Sincronizado! ↑${push.pushed || 0} ↓${pull.pulled || 0} itens.`);
        } catch (e) {
            Alert.alert('Erro na Sync', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja encerrar a sessão profissional?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'SAIR', style: 'destructive', onPress: async () => { await AuthService.logout(); } }
        ]);
    };

    const checkForUpdates = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('AgroGB Update', 'Seu aplicativo já está na versão mais recente (v1.1.11 Diamond Pro).');
        }, 1500);
    };

    return (
        <AppContainer>
            <ScreenHeader title="Configurações" onBack={() => navigation.goBack()} />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={[colors.primary]} />}
            >
                {/* 1. SEÇÃO: MINHA CONTA (FOTO E DADOS) */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>MINHA CONTA</Text>
                    <TouchableOpacity 
                        style={styles.profileBox} 
                        onPress={() => navigation.navigate('ProfileEdit')}
                    >
                        <View style={[styles.avatarBox, { borderColor: colors.primary }]}>
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={28} color={colors.primary} />
                            )}
                        </View>
                        <View style={styles.profileText}>
                            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user.nome_completo || user.usuario}</Text>
                            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>Configurações de Identidade</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </GlowCard>

                {/* 2. SEÇÃO: OPERAÇÃO DA FAZENDA */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS OPERACIONAIS</Text>
                    
                    <SettingItem 
                        icon="business" 
                        title="Nome da Fazenda" 
                        subtitle="Identificação nos relatórios PDF"
                        value={settings.fazenda_nome || 'Não definido'} 
                        onPress={() => Alert.prompt('Nome da Fazenda', '', (text) => handleUpdate('fazenda_nome', text), 'plain-text', settings.fazenda_nome)}
                    />

                    <SettingItem 
                        icon="calendar" 
                        title="Safra Ativa" 
                        subtitle="Filtro global de dados"
                        value={settings.fazenda_safra || '24/25'} 
                        onPress={() => Alert.prompt('Safra Fiscal', 'Ex: 2024/2025', (text) => handleUpdate('fazenda_safra', text), 'plain-text', settings.fazenda_safra)}
                    />

                    <SettingItem 
                        icon="leaf" 
                        title="Unidade de Medida" 
                        subtitle="Padrão do sistema"
                        value={settings.unidade_padrao} 
                        onPress={() => handleUpdate('unidade_padrao', settings.unidade_padrao === 'KG' ? 'SACAS' : 'KG')}
                    />
                </GlowCard>

                {/* 3. SEÇÃO: PREFERÊNCIAS E TEMA */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>PREFERÊNCIAS E INTERFACE</Text>
                    
                    <SettingItem 
                        icon="color-palette" 
                        title="Tema do Aplicativo" 
                        subtitle={theme === 'dark' ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}
                        value={theme === 'dark' ? 'ESCURO' : 'CLARO'}
                        onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    />

                    <SettingItem 
                        icon="language" 
                        title="Idioma do Sistema" 
                        subtitle="Traduzir interface e suporte"
                        value={language}
                        onPress={handleLanguageChange}
                    />

                    <SettingItem 
                        icon="notifications" 
                        title="Notificações Push" 
                        subtitle="Alertas de colheita e custos"
                        type="switch"
                        value={notifications.push}
                        onPress={() => setNotifications({ ...notifications, push: !notifications.push })}
                    />
                </GlowCard>

                {/* 4. SEÇÃO: SEGURANÇA E FINANCEIRO */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>SEGURANÇA E FINANÇAS</Text>
                    
                    <SettingItem 
                        icon="finger-print" 
                        title="Acesso Biométrico" 
                        subtitle="Digital/FaceID para entrar"
                        type="switch"
                        value={biometryInfo.enrolled}
                        onPress={handleToggleBiometry}
                        disabled={!biometryInfo.available}
                    />

                    <SettingItem 
                        icon="cash" 
                        title="Moeda Padrão" 
                        value={settings.fin_moeda} 
                        onPress={() => handleUpdate('fin_moeda', settings.fin_moeda === 'R$' ? 'US$' : 'R$')}
                    />
                </GlowCard>

                {/* 5. SEÇÃO: SOBRE E ATUALIZAÇÕES */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>SOBRE O APP</Text>
                    
                    <SettingItem 
                        icon="cloud-download" 
                        title="Verificar Atualizações" 
                        subtitle="Checar nova versão no servidor"
                        onPress={checkForUpdates}
                    />

                    <SettingItem 
                        icon="document-lock" 
                        title="Termos e Privacidade" 
                        onPress={() => Linking.openURL('https://agrogb.com/termos')}
                    />

                    <SettingItem 
                        icon="help-circle" 
                        title="Centro de Ajuda" 
                        onPress={() => Linking.openURL('https://agrogb.com/ajuda')}
                    />
                </GlowCard>

                {/* FOOTER: SAIR E VERSÃO */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={colors.danger} />
                        <Text style={[styles.logoutText, { color: colors.danger }]}>LOGOUT SEGURO</Text>
                    </TouchableOpacity>
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>AGROGB DIAMOND PRO v1.1.11 • 2026</Text>
                    <Text style={[styles.legalText, { color: colors.textMuted }]}>AGROGB TECNOLOGIA LTDA • TODOS DIREITOS RESERVADOS</Text>
                </View>

            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionCard: {
        padding: 20,
        marginBottom: 20,
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    profileBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    avatarBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    profileText: {
        flex: 1,
        marginLeft: 15,
    },
    profileName: {
        fontSize: 17,
        fontWeight: '900',
    },
    profileEmail: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
        paddingBottom: 20,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 20,
        marginBottom: 15,
    },
    logoutText: {
        fontWeight: '900',
        fontSize: 13,
        marginLeft: 10,
        letterSpacing: 1,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    legalText: {
        fontSize: 8,
        fontWeight: '800',
        marginTop: 5,
        letterSpacing: 0.5,
    }
});
