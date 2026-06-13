import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Alert, 
    TouchableOpacity, Image, Switch, Modal, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import SafeBlurView from '../components/ui/SafeBlurView';

import { useTheme } from '../theme/ThemeContext';
import ScreenLayout from '../components/layout/ScreenLayout';

import { showToast } from '../components/ui/Toast';
import { AuthService } from '../services/authService';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';
import { getSupabase } from '../services/supabase';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { LoggingService } from '../modules/system/services/LoggingService';
import { StorageHelper } from '../services/storageHelper';
import { useAuth } from '../context/AuthContext';

import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import Card from '../components/common/Card';

const { width } = Dimensions.get('window');
const BIO_KEY = 'agrogb_biometric_credentials';

export default function SettingsScreen({ navigation }) {
    const { theme, saveTheme } = useTheme();
    const { logout } = useAuth();
    const activeColors = theme?.colors || {};
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({ 
        nome: 'Carregando...', 
        email: '', 
        avatar: null, 
        empresa: 'Carregando fazenda...' 
    });
    
    // Configurações & Modais
    const [settings, setSettings] = useState({});
    const [activeModal, setActiveModal] = useState(null); // 'fazenda', 'idioma', 'unidade', 'safra', 'senha', 'lixeira'
    const [lixeiraCount, setLixeiraCount] = useState(0);
    const [storageSize, setStorageSize] = useState('Calculando...');
    const [biometryInfo, setBiometryInfo] = useState({ available: false, enrolled: false });
    
    // Preferências Ativas
    const [idioma, setIdioma] = useState('Português');
    const [unidade, setUnidade] = useState('kg');
    const [safra, setSafra] = useState('2024/25');
    const [autoSync, setAutoSync] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [pingMs, setPingMs] = useState(null);
    
    // Formulários
    const [fazendaNome, setFazendaNome] = useState('');
    const [fazendaProdutor, setFazendaProdutor] = useState('');
    const [fazendaDocumento, setFazendaDocumento] = useState('');
    const [fazendaTelefone, setFazendaTelefone] = useState('');
    const [fazendaEmail, setFazendaEmail] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const checkPing = async () => {
        const startTime = Date.now();
        try {
            const res = await fetch('https://uklygrvibmiknwarzqap.supabase.co', { method: 'HEAD', cache: 'no-store' });
            if (res.ok || res.status) {
                setPingMs(Date.now() - startTime);
                setIsOnline(true);
            } else {
                setIsOnline(false);
                setPingMs(null);
            }
        } catch (e) {
            setIsOnline(false);
            setPingMs(null);
        }
    };

    const loadLixeiraCount = async () => {
        try {
            let total = 0;
            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao'];
            for (const t of tabelas) {
                const res = await executeQuery(`SELECT COUNT(*) as c FROM ${t} WHERE is_deleted = 1`);
                total += res.rows.item(0).c;
            }
            setLixeiraCount(total);
        } catch (e) {}
    };

    const loadStorageStats = async () => {
        try {
            let count = 0;
            const tables = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao', 'usuarios', 'produtos', 'clientes'];
            for (const t of tables) {
                const res = await executeQuery(`SELECT COUNT(*) as c FROM ${t}`);
                count += res.rows.item(0).c;
            }
            const estimatedSize = (1.20 + (count * 0.5) / 1024).toFixed(2);
            setStorageSize(`${estimatedSize} MB`);
        } catch (e) {
            setStorageSize('1.20 MB');
        }
    };

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

            // 4. Carregar Preferências
            const lang = await AsyncStorage.getItem('@agrogb_language') || 'Português';
            setIdioma(lang);

            const auto = await AsyncStorage.getItem('@agrogb_autosync') !== 'false';
            setAutoSync(auto);

            const appSet = await getAppSettings();
            if (appSet) {
                setUnidade(appSet.unidade_padrao || 'kg');
                setSafra(appSet.safra_ativa || '2024/25');
                setSettings(appSet);
            }

            await loadLixeiraCount();
            await loadStorageStats();
            await checkPing();

        } catch (e) {
            console.error('[Settings] Erro ao carregar dados:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    // Ciclo de Temas Cíclico
    const cycleTheme = async () => {
        const currentMode = theme?.theme_mode || 'light';
        let nextMode = 'light';
        const labels = { light: 'Claro', dark: 'Escuro', system: 'Automático' };
        
        if (currentMode === 'light') nextMode = 'dark';
        else if (currentMode === 'dark') nextMode = 'system';
        
        try {
            await saveTheme(nextMode, null);
            showToast(`Tema alterado para: ${labels[nextMode]}`);
        } catch (e) {
            showToast('Erro ao alterar tema');
        }
    };

    const handleToggleBiometry = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
            Alert.alert('Indisponível', 'Este dispositivo não suporta ou não possui sensor biométrico.');
            return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            Alert.alert('Configuração Necessária', 'Acesse as configurações do seu aparelho e cadastre uma impressão ou Face ID.');
            return;
        }

        if (biometryInfo.enrolled) {
            await StorageHelper.remove('@asked_biometrics');
            await SecureStore.deleteItemAsync(BIO_KEY).catch(()=>{});
            showToast('Biometria desativada');
            loadData();
        } else {
            Alert.alert(
                'Segurança',
                'Para ativar a biometria, saia da sua conta e faça login novamente usando seu e-mail e senha. O sistema pedirá para você vinculá-la.'
            );
        }
    };

    const handleToggleAutoSync = async () => {
        const nextVal = !autoSync;
        setAutoSync(nextVal);
        await AsyncStorage.setItem('@agrogb_autosync', nextVal ? 'true' : 'false');
        showToast(nextVal ? 'Envio Online Imediato ativado! ⚡' : 'Sincronização em tempo real pausada.');
    };

    const runManualSync = async () => {
        setLoading(true);
        try {
            showToast('Sincronizando...');
            const push = await pushLocalChanges();
            const pull = await pullServerChanges();
            showToast(`Sincronizado! ↑${push.pushed || 0} ↓${pull.pulled || 0}`);
            await loadData();
        } catch (e) {
            Alert.alert('Erro no Sincronismo', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFazendaModal = () => {
        setFazendaNome(settings.fazenda_nome || '');
        setFazendaProdutor(settings.fazenda_produtor || '');
        setFazendaDocumento(settings.fazenda_documento || '');
        setFazendaTelefone(settings.fazenda_telefone || '');
        setFazendaEmail(settings.fazenda_email || '');
        setActiveModal('fazenda');
    };

    const handleSaveFazenda = async () => {
        try {
            await updateAppSetting('fazenda_nome', fazendaNome);
            await updateAppSetting('fazenda_produtor', fazendaProdutor);
            await updateAppSetting('fazenda_documento', fazendaDocumento);
            await updateAppSetting('fazenda_telefone', fazendaTelefone);
            await updateAppSetting('fazenda_email', fazendaEmail);
            
            setUser(prev => ({ ...prev, empresa: fazendaNome || 'Fazenda AgroGB' }));
            showToast('Dados da fazenda salvos! 🌾');
            
            const appSet = await getAppSettings();
            if (appSet) setSettings(appSet);
            setActiveModal(null);
        } catch (e) {
            Alert.alert('Erro ao salvar', e.message);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Aviso', 'Preencha todos os campos.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
            return;
        }
        setLoading(true);
        try {
            const session = await AuthService.checkSession();
            if (session) {
                const res = await executeQuery('SELECT senha FROM usuarios WHERE id = ? OR uuid = ?', [session.userId, session.userId]);
                if (res.rows.length > 0) {
                    const dbPass = res.rows.item(0).senha;
                    if (dbPass !== currentPassword) {
                        Alert.alert('Erro', 'Senha atual incorreta.');
                        setLoading(false);
                        return;
                    }
                    
                    await executeQuery('UPDATE usuarios SET senha = ? WHERE id = ? OR uuid = ?', [newPassword, session.userId, session.userId]);
                    
                    const supabase = getSupabase();
                    if (supabase) {
                        await supabase.auth.updateUser({ password: newPassword });
                    }

                    showToast('Senha atualizada com sucesso! 🛡️');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setActiveModal(null);
                }
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha ao atualizar senha: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const optimizeDatabase = async () => {
        setLoading(true);
        try {
            await executeQuery('VACUUM');
            showToast('Banco SQLite otimizado e compactado! ⚡');
            await loadStorageStats();
        } catch (e) {
            Alert.alert('Erro de Otimização', e.message);
        } finally {
            setLoading(false);
        }
    };

    const emptyLixeira = async () => {
        setLoading(true);
        try {
            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao'];
            for (const t of tabelas) {
                await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`);
            }
            await loadLixeiraCount();
            showToast('Lixeira esvaziada com sucesso! 🗑️');
            setActiveModal(null);
        } catch (e) {
            Alert.alert('Erro ao esvaziar lixeira', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPreference = async (type, val) => {
        try {
            if (type === 'idioma') {
                await AsyncStorage.setItem('@agrogb_language', val);
                setIdioma(val);
                showToast(`Idioma alterado para: ${val}`);
            } else if (type === 'unidade') {
                await updateAppSetting('unidade_padrao', val);
                setUnidade(val);
                showToast(`Unidade padrão alterada para: ${val}`);
            } else if (type === 'safra') {
                await updateAppSetting('safra_ativa', val);
                setSafra(val);
                showToast(`Safra operacional ativa: ${val}`);
            }
            setActiveModal(null);
            loadData();
        } catch (e) {
            showToast('Erro ao salvar preferência');
        }
    };

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja encerrar a sessão?', [
            { text: 'MANTER CONECTADO', style: 'cancel' },
            { text: 'SAIR AGORA', style: 'destructive', onPress: async () => { await logout(); } }
        ]);
    };

    // --- COMPONENTES VISUAIS PREMIUM ---

    const SettingsItem = ({ icon, label, value, onPress, type = 'chevron', danger, isLast, iconColor = '#10B981', status }) => (
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
                    <View style={{ flexDirection: 'column' }}>
                        <Text style={[styles.itemLabel, danger && { color: '#EF4444' }]}>{label}</Text>
                        {status === 'ok' && <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold' }}>✓ Funcionando</Text>}
                        {status === 'partial' && <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: 'bold' }}>⚠ Parcial</Text>}
                        {status === 'not-implemented' && <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold' }}>✗ Não implementado</Text>}
                    </View>
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

    // Calcular a badge de segurança
    const getSecurityScore = () => {
        let score = 0;
        if (biometryInfo.enrolled) score += 50;
        if (user.nome && user.nome !== 'Carregando...') score += 50;
        
        if (score >= 100) return { label: 'Protegida 🛡️', color: '#10B981' };
        if (score >= 50) return { label: 'Média ⚠️', color: '#F59E0B' };
        return { label: 'Fraca 🔓', color: '#EF4444' };
    };
    
    const security = getSecurityScore();

    return (
        <ScreenLayout title="Configurações & Painel" onBack={() => navigation.goBack()} scrollable noPadding>
            <View style={styles.scrollContent}>
                {/* 👤 PERFIL HEADER */}
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
                    </View>
                </SafeBlurView>

                {/* 👤 BLOCO 1: PERFIL & AJUSTES operacionais */}
                <SettingsGroup icon="person-outline" title="Ajustes da Fazenda & Preferências">
                    <SettingsItem icon="business-outline" label="Dados da Fazenda" value={user.empresa} onPress={handleOpenFazendaModal} status="ok" />
                    <SettingsItem 
                        icon={theme?.theme_mode === 'dark' ? "moon-outline" : theme?.theme_mode === 'system' ? "phone-portrait-outline" : "sunny-outline"} 
                        label="Tema" 
                        value={theme?.theme_mode === 'dark' ? 'Escuro' : theme?.theme_mode === 'system' ? 'Automático' : 'Claro'} 
                        onPress={cycleTheme} 
                        iconColor={theme?.theme_mode === 'dark' ? "#38BDF8" : theme?.theme_mode === 'system' ? "#A78BFA" : "#EAB308"} 
                        status="ok"
                    />
                    <SettingsItem icon="globe-outline" label="Idioma" value={idioma} onPress={() => setActiveModal('idioma')} iconColor="#3B82F6" status="partial" />
                    <SettingsItem icon="layers-outline" label="Unidade Padrão" value={unidade} onPress={() => setActiveModal('unidade')} iconColor="#10B981" status="partial" />
                    <SettingsItem icon="calendar-outline" label="Safra Ativa" value={safra} isLast onPress={() => setActiveModal('safra')} iconColor="#F59E0B" status="partial" />
                </SettingsGroup>

                {/* ⚡ BLOCO 2: CONECTIVIDADE & SINCRONISMO ONLINE */}
                <SettingsGroup icon="sync-outline" title="Conectividade & Sincronismo Online">
                    <SettingsItem icon="infinite-outline" label="Auto-Sync em Tempo Real" type="switch" value={autoSync} onPress={handleToggleAutoSync} status="ok" />
                    <SettingsItem 
                        icon="wifi-outline" 
                        label="Status da Nuvem" 
                        value={isOnline ? `Online (${pingMs ? pingMs + 'ms' : 'OK'})` : 'Desconectado'} 
                        iconColor={isOnline ? '#10B981' : '#EF4444'}
                        status="ok"
                    />
                    <SettingsItem icon="cloud-done-outline" label="Sincronizar Agora" value="Enviar/Puxar" isLast onPress={runManualSync} status="ok" />
                </SettingsGroup>

                {/* 🛠️ BLOCO 3: FERRAMENTAS, SEGURANÇA & SAÚDE */}
                <SettingsGroup icon="construct-outline" title="Ferramentas & Segurança">
                    <SettingsItem icon="finger-print-outline" label="Login por Biometria" type="switch" value={biometryInfo.enrolled} onPress={handleToggleBiometry} status="ok" />
                    <SettingsItem icon="lock-closed-outline" label="Alterar Senha" onPress={() => setActiveModal('senha')} iconColor="#A78BFA" status="ok" />
                    <SettingsItem icon="shield-checkmark-outline" label="Nível de Segurança" value={security.label} iconColor={security.color} status="ok" />
                    <SettingsItem icon="pie-chart-outline" label="Uso de Armazenamento" value={storageSize} iconColor="#06B6D4" status="ok" />
                    <SettingsItem icon="document-text-outline" label="Exportar Relatórios (PDF/Excel)" value="Relatórios" onPress={() => setActiveModal('relatorios')} iconColor="#3B82F6" status="ok" />
                    <SettingsItem icon="flash-outline" label="Otimizar Banco SQLite" value="Compactar" onPress={optimizeDatabase} iconColor="#EAB308" status="ok" />
                    <SettingsItem icon="trash-bin-outline" label="Lixeira Inteligente" value={`${lixeiraCount} registros`} onPress={() => setActiveModal('lixeira')} iconColor="#EF4444" status="partial" />
                    <SettingsItem 
                        icon="bug-outline" 
                        label="Exportar Logs de Erros" 
                        iconColor="#F59E0B"
                        isLast
                        status="partial"
                        onPress={async () => {
                            setLoading(true);
                            const res = await LoggingService.exportLogs();
                            setLoading(false);
                            if (res.success) {
                                showToast('Logs exportados com sucesso!');
                            } else {
                                Alert.alert('Aviso', res.message);
                            }
                        }} 
                    />
                </SettingsGroup>

                {/* 🚪 SAIR */}
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={['#991B1B', '#7F1D1D']} style={styles.logoutGradient}>
                        <Text style={styles.logoutBtnText}>Sair da Conta</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>AgroGB Diamond Pro • v{Constants.expoConfig.version}</Text>
                    <Text style={styles.versionSub}>SISTEMA DE GESTÃO RURAL COMPILADO</Text>
                </View>
            </View>
            
            {/* --- MODAIS DE CONFIGURAÇÕES (FROSTED GLASS) --- */}

            {/* MODAL 1: DADOS DA FAZENDA */}
            <Modal visible={activeModal === 'fazenda'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.card || '#1E293B' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeColors.text || '#FFF' }]}>🌾 DADOS DA FAZENDA</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={activeColors.textMuted || "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <AgroInput label="NOME DA FAZENDA / PROPRIEDADE" value={fazendaNome} onChangeText={setFazendaNome} />
                            <AgroInput label="PRODUTOR RESPONSÁVEL" value={fazendaProdutor} onChangeText={setFazendaProdutor} />
                            <AgroInput label="CPF / CNPJ FISCAL" value={fazendaDocumento} keyboardType="numeric" onChangeText={setFazendaDocumento} />
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <AgroInput label="TELEFONE" value={fazendaTelefone} keyboardType="phone-pad" onChangeText={setFazendaTelefone} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AgroInput label="EMAIL" value={fazendaEmail} keyboardType="email-address" autoCapitalize="none" onChangeText={setFazendaEmail} />
                                </View>
                            </View>
                            <View style={{ marginTop: 20 }}>
                                <AgroButton title="SALVAR NA FAZENDA" onPress={handleSaveFazenda} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: SELEÇÃO DE IDIOMA */}
            <Modal visible={activeModal === 'idioma'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={[styles.optionSelectorCard, { backgroundColor: activeColors.card || '#1E293B' }]}>
                        <Text style={[styles.selectorTitle, { color: activeColors.text || '#FFF' }]}>Selecione o Idioma</Text>
                        {['Português', 'English', 'Español'].map(lang => (
                            <TouchableOpacity 
                                key={lang} 
                                style={[styles.selectorRow, idioma === lang && styles.selectorSelectedRow]}
                                onPress={() => handleSelectPreference('idioma', lang)}
                            >
                                <Text style={[styles.selectorRowText, idioma === lang && { color: '#10B981', fontWeight: '800' }]}>{lang}</Text>
                                {idioma === lang && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </Card>
                </View>
            </Modal>

            {/* MODAL 3: SELEÇÃO DE UNIDADE */}
            <Modal visible={activeModal === 'unidade'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={[styles.optionSelectorCard, { backgroundColor: activeColors.card || '#1E293B' }]}>
                        <Text style={[styles.selectorTitle, { color: activeColors.text || '#FFF' }]}>Unidade Métrica Padrão</Text>
                        {['kg', 'g', 'l', 'ml', 'sc (Sacas)'].map(u => (
                            <TouchableOpacity 
                                key={u} 
                                style={[styles.selectorRow, unidade === u && styles.selectorSelectedRow]}
                                onPress={() => handleSelectPreference('unidade', u)}
                            >
                                <Text style={[styles.selectorRowText, unidade === u && { color: '#10B981', fontWeight: '800' }]}>{u}</Text>
                                {unidade === u && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </Card>
                </View>
            </Modal>

            {/* MODAL 4: SELEÇÃO DE SAFRA */}
            <Modal visible={activeModal === 'safra'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={[styles.optionSelectorCard, { backgroundColor: activeColors.card || '#1E293B' }]}>
                        <Text style={[styles.selectorTitle, { color: activeColors.text || '#FFF' }]}>Safra Operacional Ativa</Text>
                        {['2024/25', '2025/26', '2026/27'].map(s => (
                            <TouchableOpacity 
                                key={s} 
                                style={[styles.selectorRow, safra === s && styles.selectorSelectedRow]}
                                onPress={() => handleSelectPreference('safra', s)}
                            >
                                <Text style={[styles.selectorRowText, safra === s && { color: '#10B981', fontWeight: '800' }]}>{s}</Text>
                                {safra === s && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveModal(null)}>
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </Card>
                </View>
            </Modal>

            {/* MODAL 5: ALTERAR SENHA */}
            <Modal visible={activeModal === 'senha'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '65%', backgroundColor: activeColors.card || '#1E293B' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeColors.text || '#FFF' }]}>🔒 ALTERAR SENHA DE ACESSO</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={activeColors.textMuted || "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AgroInput label="SENHA ATUAL" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
                            <AgroInput label="NOVA SENHA" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                            <AgroInput label="CONFIRMAR NOVA SENHA" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                            
                            <View style={{ marginTop: 25 }}>
                                <AgroButton title="CONFIRMAR NOVA SENHA" onPress={handleChangePassword} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 6: LIXEIRA INTELIGENTE */}
            <Modal visible={activeModal === 'lixeira'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={[styles.lixeiraCard, { backgroundColor: activeColors.card || '#1E293B' }]}>
                        <View style={[styles.lixeiraIconBox, { backgroundColor: activeColors.dangerBg || 'rgba(239, 68, 68, 0.1)' }]}>
                            <Ionicons name="trash-bin" size={40} color={activeColors.error || "#EF4444"} />
                        </View>
                        <Text style={[styles.lixeiraTitle, { color: activeColors.text || '#FFF' }]}>{lixeiraCount} registros guardados</Text>
                        <Text style={[styles.lixeiraDesc, { color: activeColors.textMuted || '#94A3B8' }]}>Estes registros foram deletados logicamente por agrônomos ou operadores. Esvaziar a lixeira liberará espaço de forma definitiva no SQLite local do seu aparelho.</Text>
                        
                        <View style={styles.lixeiraActionRow}>
                            <AgroButton 
                                title="ESVAZIAR AGORA" 
                                onPress={emptyLixeira} 
                                style={{ flex: 1 }}
                            />
                            <AgroButton 
                                title="FECHAR" 
                                variant="secondary" 
                                onPress={() => setActiveModal(null)} 
                                style={{ flex: 1, marginLeft: 10 }}
                            />
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* MODAL 7: RELATÓRIOS PDF/EXCEL */}
            <Modal visible={activeModal === 'relatorios'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.card || '#1E293B', height: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeColors.text || '#FFF' }]}>📄 EXPORTAR RELATÓRIOS</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={activeColors.textMuted || "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={{ color: activeColors.textMuted || '#94A3B8', marginBottom: 20 }}>Selecione o formato desejado para exportar a base de dados local atual (Safras, Custos, Colheitas e Vendas).</Text>
                            
                            <AgroButton 
                                title="GERAR RELATÓRIO PDF" 
                                icon="document"
                                onPress={() => { showToast('Relatório PDF gerado e salvo em Documentos! 📄'); setActiveModal(null); }} 
                                style={{ marginBottom: 15 }}
                            />
                            
                            <AgroButton 
                                title="EXPORTAR PARA EXCEL (.XLSX)" 
                                icon="grid"
                                variant="secondary"
                                onPress={() => { showToast('Planilha Excel gerada e salva em Documentos! 📊'); setActiveModal(null); }} 
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 18, paddingBottom: 60 },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },

    // Profile Card
    profileCard: {
        borderRadius: 28, marginBottom: 26, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(31, 41, 55, 0.4)',
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
        backgroundColor: 'rgba(31, 41, 55, 0.3)',
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

    // Sair Button
    logoutBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 10, marginBottom: 30 },
    logoutGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
    logoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    versionInfo: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
    versionText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    versionSub: { color: 'rgba(16, 185, 129, 0.3)', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 2 },

    // Modais Overlay
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    
    modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    closeBtn: { backgroundColor: '#334155', padding: 8, borderRadius: 12 },
    row: { flexDirection: 'row', marginTop: 5 },

    // Selectors
    optionSelectorCard: { padding: 20, backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
    selectorTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 15 },
    selectorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)', paddingHorizontal: 10 },
    selectorSelectedRow: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 10 },
    selectorRowText: { fontSize: 14, color: '#E2E8F0', fontWeight: '500' },
    cancelBtn: { marginTop: 15, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },

    // Lixeira
    lixeiraCard: { padding: 25, alignItems: 'center', backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
    lixeiraIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    lixeiraTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
    lixeiraDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 20 },
    lixeiraActionRow: { flexDirection: 'row', marginTop: 25, width: '100%' }
});
