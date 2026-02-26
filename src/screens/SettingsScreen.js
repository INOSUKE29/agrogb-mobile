import React, { useState, useEffect } from 'react';
import { COLORS } from '../styles/theme';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, AVAILABLE_THEMES } from '../context/ThemeContext';
import { saveSetting, loadSetting } from '../services/settingsService';
import SettingSection from '../components/SettingSection';
import SettingItem from '../components/SettingItem';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
    const { colors, theme, setTheme, themeParams } = useTheme(); // Use Theme Hook
    const [user, setUser] = useState({ nome: '', email: '', telefone: '' });
    const [settings, setSettings] = useState({
        farm_name: '',
        farm_area: '',
        current_season: '2025/2026',
        default_unit: 'KG',
        currency: 'R$',
        loss_unit: 'KG',
        sales_unit: 'CX',
        show_charts: true,
        auto_pdf: false,
        notify_low_stock: true,
        notify_loss: true,
        notify_application: true,
        notify_harvest: true,
        google_auth: false,
        biometric_auth: false
    });

    useEffect(() => {
        loadUserData();
        loadSettings();
    }, []);

    const loadUserData = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                const userData = JSON.parse(userJson);
                setUser({
                    nome: userData.nome || userData.usuario,
                    email: userData.email || 'Não informado',
                    telefone: userData.telefone || 'Não informado'
                });
            }
        } catch (e) {
            console.error('Error loading user data:', e);
        }
    };

    const loadSettings = async () => {
        try {
            const loaded = {};
            for (const key of Object.keys(settings)) {
                loaded[key] = await loadSetting(key);
            }
            setSettings(loaded);
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    };

    const handleSettingChange = async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        await saveSetting(key, value);
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('user_session');
            navigation.replace('Login');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao sair da conta.');
        }
    };

    const handleChangePassword = () => {
        navigation.navigate('ForgotPassword');
    };

    const handleLogoutAll = () => {
        Alert.alert(
            'Encerrar Sessões',
            'Esta ação encerrará todas as sessões ativas em todos os dispositivos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: handleLogout, style: 'destructive' }
            ]
        );
    };

    // Theme Switcher Widget
    const renderThemeSwitcher = () => (
        <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>ESTILO VISUAL DO APP</Text>
            <View style={[styles.themeSelector, { borderColor: colors.glassBorder }]}>
                {Object.keys(AVAILABLE_THEMES).map((key) => {
                    const isActive = theme === key;
                    const item = AVAILABLE_THEMES[key];
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.themeOption,
                                isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                                { borderColor: colors.glassBorder }
                            ]}
                            onPress={() => setTheme(key)}
                        >
                            <Ionicons
                                name={key === 'ultra_premium' ? 'diamond-outline' : 'code-working-outline'}
                                size={20}
                                color={isActive ? '#FFF' : colors.textSecondary}
                            />
                            <Text style={[
                                styles.themeText,
                                { color: isActive ? '#FFF' : colors.textSecondary }
                            ]}>
                                {item.name}
                            </Text>
                            {isActive && <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            {/* HEADER */}
            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
                <Text style={styles.headerSubtitle}>Personalize seu aplicativo</Text>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* THEME SWITCHER (New!) */}
                {renderThemeSwitcher()}

                {/* 1. CONTA */}
                <SettingSection title="Conta">
                    <SettingItem
                        type="info"
                        label="Nome"
                        value={user.nome}
                        icon="person-outline"
                    />
                    <SettingItem
                        type="info"
                        label="Email"
                        value={user.email}
                        icon="mail-outline"
                    />
                    <SettingItem
                        type="info"
                        label="Telefone"
                        value={user.telefone}
                        icon="call-outline"
                    />
                    <SettingItem
                        type="navigation"
                        label="Alterar senha"
                        icon="key-outline"
                        onPress={handleChangePassword}
                    />
                    <SettingItem
                        type="action"
                        label="Sair da conta"
                        icon="log-out-outline"
                        danger={true}
                        onPress={handleLogout}
                        isLast={true}
                    />
                </SettingSection>

                {/* 2. FAZENDA */}
                <SettingSection title="Fazenda">
                    <SettingItem
                        type="input"
                        label="Nome da propriedade"
                        value={settings.farm_name}
                        icon="home-outline"
                        onValueChange={(val) => handleSettingChange('farm_name', val)}
                    />
                    <SettingItem
                        type="input"
                        label="Área total (ha)"
                        value={settings.farm_area}
                        icon="map-outline"
                        keyboardType="numeric"
                        onValueChange={(val) => handleSettingChange('farm_area', val)}
                    />
                    <SettingItem
                        type="input"
                        label="Safra atual"
                        value={settings.current_season}
                        icon="calendar-outline"
                        onValueChange={(val) => handleSettingChange('current_season', val)}
                    />
                    <SettingItem
                        type="select"
                        label="Unidade padrão"
                        value={settings.default_unit}
                        icon="cube-outline"
                        options={['KG', 'SC', 'CX', 'LT']}
                        onValueChange={(val) => handleSettingChange('default_unit', val)}
                    />
                    <SettingItem
                        type="select"
                        label="Moeda"
                        value={settings.currency}
                        icon="cash-outline"
                        options={['R$', 'USD', 'EUR']}
                        onValueChange={(val) => handleSettingChange('currency', val)}
                        isLast={true}
                    />
                </SettingSection>

                {/* 4. RELATÓRIOS */}
                <SettingSection title="Relatórios">
                    <SettingItem
                        type="select"
                        label="Unidade para perdas"
                        value={settings.loss_unit}
                        icon="trending-down-outline"
                        options={['KG', 'SC', 'CX']}
                        onValueChange={(val) => handleSettingChange('loss_unit', val)}
                    />
                    <SettingItem
                        type="select"
                        label="Unidade para vendas"
                        value={settings.sales_unit}
                        icon="cart-outline"
                        options={['KG', 'SC', 'CX']}
                        onValueChange={(val) => handleSettingChange('sales_unit', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Exibir gráficos"
                        value={settings.show_charts}
                        icon="bar-chart-outline"
                        onValueChange={(val) => handleSettingChange('show_charts', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Exportação PDF automática"
                        value={settings.auto_pdf}
                        icon="document-text-outline"
                        onValueChange={(val) => handleSettingChange('auto_pdf', val)}
                        isLast={true}
                    />
                </SettingSection>

                {/* 5. NOTIFICAÇÕES */}
                <SettingSection title="Notificações">
                    <SettingItem
                        type="toggle"
                        label="Alerta de estoque baixo"
                        value={settings.notify_low_stock}
                        icon="alert-circle-outline"
                        onValueChange={(val) => handleSettingChange('notify_low_stock', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Alerta de prejuízo mensal"
                        value={settings.notify_loss}
                        icon="warning-outline"
                        onValueChange={(val) => handleSettingChange('notify_loss', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Lembrete de aplicação"
                        value={settings.notify_application}
                        icon="flask-outline"
                        onValueChange={(val) => handleSettingChange('notify_application', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Lembrete de colheita"
                        value={settings.notify_harvest}
                        icon="leaf-outline"
                        onValueChange={(val) => handleSettingChange('notify_harvest', val)}
                        isLast={true}
                    />
                </SettingSection>

                {/* 6. SEGURANÇA */}
                <SettingSection title="Segurança">
                    <SettingItem
                        type="toggle"
                        label="Login com Google"
                        value={settings.google_auth}
                        icon="logo-google"
                        onValueChange={(val) => handleSettingChange('google_auth', val)}
                    />
                    <SettingItem
                        type="toggle"
                        label="Biometria"
                        value={settings.biometric_auth}
                        icon="finger-print-outline"
                        onValueChange={(val) => handleSettingChange('biometric_auth', val)}
                    />
                    <SettingItem
                        type="action"
                        label="Encerrar todas sessões"
                        icon="power-outline"
                        danger={true}
                        onPress={handleLogoutAll}
                        isLast={true}
                    />
                </SettingSection>

                {/* 7. SOBRE */}
                <SettingSection title="Sobre">
                    <SettingItem
                        type="info"
                        label="Versão do aplicativo"
                        value="7.0.0"
                        icon="information-circle-outline"
                    />
                    <SettingItem
                        type="navigation"
                        label="Política de privacidade"
                        icon="shield-checkmark-outline"
                        onPress={() => Alert.alert('Em breve', 'Política de privacidade será disponibilizada em breve.')}
                    />
                    <SettingItem
                        type="navigation"
                        label="Termos de uso"
                        icon="document-outline"
                        onPress={() => Alert.alert('Em breve', 'Termos de uso serão disponibilizados em breve.')}
                        isLast={true}
                    />
                </SettingSection>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4
    },
    scrollView: {
        flex: 1
    },
    content: {
        padding: 20
    },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }, // New Style
    themeSelector: {
        flexDirection: 'column',
        gap: 10
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12
    },
    themeText: {
        fontSize: 14,
        fontWeight: 'bold'
    }
});
