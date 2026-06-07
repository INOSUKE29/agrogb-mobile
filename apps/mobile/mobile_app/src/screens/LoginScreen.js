import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, StatusBar, ImageBackground, Animated, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery, insertUsuario } from '../database/database';
import AgroInput from '../components/common/AgroInput';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { translateAuthError } from '../utils/errorHelpers';
import { getSupabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import FriendlyModal from '../components/common/FriendlyModal';
import SafeBlurView from '../components/ui/SafeBlurView';

const { width, height } = Dimensions.get('window');
const LOGO = require('../../assets/icon.png');
const RURAL_BG = require('../../assets/farm_bg.png');
const BIO_KEY = 'agrogb_biometric_credentials';

const withTimeout = (promise, ms) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout de ${ms/1000}s excedido. O servidor demorou muito para responder.`));
        }, ms);
        promise
            .then(value => { clearTimeout(timer); resolve(value); })
            .catch(reason => { clearTimeout(timer); reject(reason); });
    });
};

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingState, setLoadingState] = useState('');
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    
    // Animação do Logo
    const [logoTranslateY] = useState(new Animated.Value(-Dimensions.get('window').height)); // Começa fora da tela, em cima
    const [formOpacity] = useState(new Animated.Value(0));
    
    // Master Key State
    const [tapCount, setTapCount] = useState(0);
    const [lastTap, setLastTap] = useState(0);
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterPin, setMasterPin] = useState('');
    
    // Diagnostic Panel State
    const [diagTapCount, setDiagTapCount] = useState(0);
    const [lastDiagTap, setLastDiagTap] = useState(0);
    const [showDiagnosticPanel, setShowDiagnosticPanel] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState(null);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        emoji: '🧐',
        title: 'Atenção',
        message: '',
        buttonText: 'Entendi 👍'
    });

    const showAlert = (emoji, title, message, buttonText = 'Entendi 👍') => {
        setAlertConfig({
            visible: true,
            emoji,
            title,
            message,
            buttonText
        });
    };

    useEffect(() => {
        checkBiometrics();
        initApp();
        
        // Sequência da Animação: Desce devagar, pausa, sobe e mostra form
        Animated.sequence([
            // 1. Desce até o meio da tela devagar (2 segundos)
            Animated.timing(logoTranslateY, {
                toValue: Dimensions.get('window').height * 0.25,
                duration: 2000,
                useNativeDriver: true
            }),
            // 2. Pausa para o cliente admirar a marca
            Animated.delay(1200),
            // 3. Sobe o logo para a posição original e revela o form
            Animated.parallel([
                Animated.timing(logoTranslateY, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true
                })
            ])
        ]).start();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setIsBiometricSupported(compatible && types.length > 0);
    };

    const initApp = async () => {
        // 1. Verificar se já existe uma sessão ativa
        const userJson = await AsyncStorage.getItem('user_session');
        if (userJson) {
            try {
                const sessionObj = JSON.parse(userJson);
                if (sessionObj && sessionObj.role === 'PENDENTE') {
                    navigation.replace('OnboardingProfile');
                    return;
                }
            } catch (e) {
                console.log('Erro ao ler sessao:', e);
            }
            navigation.replace('Home');
            return;
        }

        // 2. Se não houver sessão, verificar se a biometria está ativada para auto-login
        try {
            const bioCreds = await SecureStore.getItemAsync(BIO_KEY);
            if (bioCreds && isBiometricSupported) {
                // Pequeno delay para garantir que a UI carregou
                setTimeout(() => handleBiometricLogin(true), 500);
            }
        } catch (e) {
            console.log('Erro ao checar auto-bio:', e);
            if (e.message && e.message.includes('Could not decrypt')) {
                console.log('Corrupção detectada no initApp. Limpando chaves antigas...');
                await SecureStore.deleteItemAsync(BIO_KEY).catch(() => {});
            }
        }

        // Inicializar Admin se banco estiver vazio
        try {
            const res = await executeQuery('SELECT COUNT(*) as qtd FROM usuarios');
            if (res.rows.item(0).qtd === 0) {
                await insertUsuario({
                    usuario: 'ADMIN',
                    senha: '1234',
                    nivel: 'ADMIN',
                    nome_completo: 'Administrador Padrão',
                    email: 'admin',
                    telefone: '0000',
                    endereco: ''
                });
            }
        } catch (error) {
            console.log('Erro ao inicializar admin:', error);
        }
    };

    const handleLogin = async (bypassBiometricPrompt = false) => {
        const userTrim = (usuario || '').trim().replace(/\s/g, '').toUpperCase();
        const passTrim = (senha || '').trim();

        if (!userTrim || !passTrim) {
            showAlert('✍️', 'Campos Vazios', 'Por favor, preencha o seu e-mail/telefone e a sua senha para entrar no AgroGB! 😉');
            return;
        }

        setLoading(true);
        setLoadingState('Validando...');
        try {
            // 1. LOGIN ADMIN LOCAL: Bypass instantâneo para a conta de administração
            if (userTrim === 'ADMIN' && passTrim === '1234') {
                const sessionData = {
                    id: 999999,
                    uuid: 'admin-local-bypass-uuid-999999',
                    usuario: 'ADMIN',
                    nome: 'ADMINISTRADOR PADRÃO',
                    nivel: 'ADM',
                    role: 'ADMIN',
                    timestamp: new Date().getTime()
                };
                await login(sessionData);
                navigation.replace('Home');
                return;
            }

            const supabase = getSupabase();
            let targetEmail = null;
            let targetPhone = null;

            const inputClean = userTrim.toLowerCase();
            const phoneClean = userTrim.replace(/\D/g, ''); // Apenas os números

            // 2. RESOLUÇÃO DE CREDENCIAIS (E-mail, Telefone ou Username)
            if (inputClean.includes('@')) {
                // Caso A: É um E-mail
                targetEmail = inputClean;
            } else if (phoneClean.length >= 8 && /^\d+$/.test(phoneClean)) {
                // Caso B: É um Telefone
                // Primeiro tentamos achar o e-mail correspondente localmente
                try {
                    const localUser = await executeQuery(
                        `SELECT email FROM usuarios WHERE (REPLACE(REPLACE(REPLACE(REPLACE(telefone, ' ', ''), '(', ''), ')', ''), '-', '') = ? OR telefone = ?) AND is_deleted = 0`,
                        [phoneClean, userTrim]
                    );
                    if (localUser.rows.length > 0) {
                        targetEmail = localUser.rows.item(0).email;
                    } else {
                        // Se não achar local, tenta formatar o telefone para o padrão DDI do Supabase (+55)
                        let formattedPhone = phoneClean;
                        if (phoneClean.length === 10 || phoneClean.length === 11) {
                            formattedPhone = '+55' + phoneClean;
                        } else if (!phoneClean.startsWith('+')) {
                            formattedPhone = '+' + phoneClean;
                        }
                        targetPhone = formattedPhone;
                    }
                } catch (err) {
                    targetPhone = phoneClean;
                }
            } else {
                // Caso C: É um Username
                // Primeiro tentamos achar o e-mail correspondente localmente
                try {
                    const localUser = await executeQuery(
                        `SELECT email FROM usuarios WHERE LOWER(usuario) = ? AND is_deleted = 0`,
                        [inputClean]
                    );
                    if (localUser.rows.length > 0) {
                        targetEmail = localUser.rows.item(0).email;
                    } else {
                        // Caso não ache local (aparelho novo), consulta remotamente na tabela profiles
                        const { data: remoteProfile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('username', inputClean)
                            .maybeSingle();
                        
                        if (remoteProfile && remoteProfile.email) {
                            targetEmail = remoteProfile.email;
                        } else {
                            targetEmail = inputClean;
                        }
                    }
                } catch (err) {
                    targetEmail = inputClean;
                }
            }

            // 3. AUTENTICAÇÃO SUPABASE COM FALLBACK OFFLINE
            let authSession = null;
            let authError = null;

            try {
                setLoadingState('Acessando servidor...');
                const { AuthService } = require('../services/authService');
                
                // O authService centralizado lidará com o signIn e também irá buscar o Profile para montar a sessão
                console.log('🔄 [Rastreamento] Iniciando Login Remoto (15s Timeout)...');
                const loginResult = await withTimeout(
                    AuthService.loginWithEmail(targetEmail || targetPhone || inputClean, passTrim), 
                    15000
                );
                console.log('✅ [Rastreamento] LOGIN OK');
                authSession = loginResult.session;
                console.log('✅ [Rastreamento] SESSÃO OK (ID: ' + authSession.id + ')');
                console.log('✅ [Rastreamento] PERFIL OK (User: ' + authSession.usuario + ')');
                console.log('✅ [Rastreamento] ROLE OK (' + authSession.role + ')');
                setLoadingState('Preparando ambiente...');
            } catch (netError) {
                // Se falhar a conexão, tenta o login off-line diretamente com o banco SQLite local
                console.log('📡 Falha de rede/Timeout. Tentando autenticação SQLite local (off-line)...');
                const localRes = await executeQuery(
                    `SELECT * FROM usuarios WHERE (is_deleted = 0 OR is_deleted IS NULL) AND (LOWER(usuario) = ? OR REPLACE(REPLACE(REPLACE(REPLACE(telefone, ' ', ''), '(', ''), ')', ''), '-', '') = ? OR LOWER(email) = ?) AND senha = ?`,
                    [inputClean, phoneClean, inputClean, passTrim]
                );

                if (localRes.rows.length > 0) {
                    const userRow = localRes.rows.item(0);
                    const sessionData = {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nome: userRow.nome_completo || userRow.usuario,
                        nivel: userRow.nivel,
                        role: userRow.role || 'AGRICULTOR',
                        timestamp: new Date().getTime()
                    };
                    await login(sessionData);
                    if (sessionData.role === 'PENDENTE') {
                        navigation.replace('OnboardingProfile');
                    } else {
                        navigation.replace('Home');
                    }
                    return;
                }
                throw netError;
            }

            // 4. LOGIN BEM-SUCEDIDO: Atualizar SQLite local (sincronização)
            const localCheck = await executeQuery('SELECT * FROM usuarios WHERE uuid = ?', [authSession.id]);
            const finalEmail = authSession.email || targetEmail || '';
            const userPayload = {
                uuid: authSession.id,
                usuario: authSession.usuario,
                senha: passTrim,
                nivel: (authSession.role === 'AGRONOMO' || authSession.role === 'ADMIN') ? 'AGRONOMO' : 'USUARIO',
                role: authSession.role,
                nome_completo: authSession.nome_completo || 'USUÁRIO AGROGB',
                email: finalEmail.toLowerCase(),
                telefone: '',
                endereco: ''
            };

            if (localCheck.rows.length > 0) {
                await executeQuery(
                    `UPDATE usuarios SET senha = ?, nivel = ?, role = ?, email = ?, nome_completo = ?, telefone = ?, endereco = ?, last_updated = ? WHERE uuid = ?`,
                    [userPayload.senha, userPayload.nivel, userPayload.role, userPayload.email, userPayload.nome_completo, userPayload.telefone, userPayload.endereco, new Date().toISOString(), userPayload.uuid]
                );
            } else {
                await executeQuery(
                    `INSERT INTO usuarios (uuid, usuario, senha, nivel, role, email, nome_completo, telefone, endereco, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userPayload.uuid, userPayload.usuario, userPayload.senha, userPayload.nivel, userPayload.role, userPayload.email, userPayload.nome_completo, userPayload.telefone, userPayload.endereco, new Date().toISOString()]
                );
            }

            // Recupera o ID do SQLite local recém inserido/atualizado para manter consistência da sessão
            const finalCheck = await executeQuery('SELECT id, usuario, nome_completo, nivel, role FROM usuarios WHERE uuid = ?', [authSession.id]);
            const userRow = finalCheck.rows.item(0);

            const sessionData = {
                id: userRow.id,
                usuario: userRow.usuario,
                nome: userRow.nome_completo,
                nivel: userRow.nivel,
                role: userRow.role || 'AGRICULTOR',
                timestamp: new Date().getTime()
            };
            await login(sessionData);

            if (sessionData.role === 'PENDENTE') {
                return; // O RootNavigator trocará para o Onboarding automaticamente
            }

            // Pergunta biometria se aplicável
            if (!bypassBiometricPrompt && isBiometricSupported) {
                try {
                    const bioEnabled = await SecureStore.getItemAsync(BIO_KEY);
                    if (!bioEnabled) {
                        Alert.alert(
                            '🚀 Acesso Rápido',
                            'Deseja ativar o login por biometria (Digital/FaceID) para entrar automaticamente nos próximos acessos?',
                            [
                                { text: 'Agora não', style: 'cancel', onPress: () => {
                                    console.log('✅ [Rastreamento] REDIRECIONANDO DASHBOARD (Sem Bio)...');
                                    navigation.replace('Home');
                                }},
                                {
                                    text: 'ATIVAR AGORA',
                                    onPress: async () => {
                                        try {
                                            const auth = await LocalAuthentication.authenticateAsync({
                                                promptMessage: 'Confirme sua biometria para ativar',
                                            });
                                            if (auth.success) {
                                                await SecureStore.setItemAsync(BIO_KEY, JSON.stringify({ usuario: userTrim, senha: passTrim }));
                                                Alert.alert('Sucesso', 'Login biométrico ativado!', [{
                                                    text: 'OK', 
                                                    onPress: () => {
                                                        console.log('✅ [Rastreamento] REDIRECIONANDO DASHBOARD (Bio Criada)...');
                                                        navigation.replace('Home');
                                                    }
                                                }]);
                                            } else {
                                                console.log('✅ [Rastreamento] REDIRECIONANDO DASHBOARD (Bio Falhou/Cancelada)...');
                                                navigation.replace('Home');
                                            }
                                        } catch (e) {
                                            console.log('Erro biometria prompt:', e);
                                            console.log('✅ [Rastreamento] REDIRECIONANDO DASHBOARD (Erro no Bio Prompt)...');
                                            navigation.replace('Home');
                                        }
                                    }
                                }
                            ]
                        );
                        return; // Aguarda resposta do Alert
                    }
                } catch (storeError) {
                    // Trata corrupção no momento da verificação pós-login
                    if (storeError.message && storeError.message.includes('Could not decrypt')) {
                        await SecureStore.deleteItemAsync(BIO_KEY).catch(() => {});
                        console.log('Chave corrompida removida durante o login. O usuário precisará reativar na próxima sessão.');
                    }
                }
            }
            
            // Corrige o congelamento: Assegura o redirecionamento quando a Biometria já existia ou foi bypassada
            console.log('✅ [Rastreamento] REDIRECIONANDO DASHBOARD...');
            navigation.replace('Home');
            
        } catch (e) {
            const friendlyMsg = translateAuthError(e.message || e.toString());
            showAlert('🧐', 'Acesso Negado', friendlyMsg + ' Que tal tentar de novo com bastante calma? Se precisar, você pode recuperar sua senha abaixo.');
        } finally {
            setLoading(false);
            setLoadingState('');
        }
    };

    const handleBiometricLogin = async (isAutoLogin = false) => {
        try {
            setLoading(true);
            setLoadingState('Autenticando...');
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) throw new Error('Biometria não suportada');

            // Aqui é onde ocorria o Erro #007 Fatal
            let rawCreds = null;
            try {
                rawCreds = await SecureStore.getItemAsync(BIO_KEY);
            } catch (secErr) {
                console.log('Erro crítico no SecureStore:', secErr.message);
                if (secErr.message && secErr.message.includes('Could not decrypt')) {
                    // CORREÇÃO 1 e 2: Limpar credenciais corrompidas
                    await SecureStore.deleteItemAsync(BIO_KEY).catch(() => {});
                    // CORREÇÃO 3: Fallback message
                    showAlert('🔑', 'Chave de Segurança Alterada', 'Credenciais biométricas inválidas ou corrompidas. Por favor, faça login com sua senha novamente para reativar a biometria.');
                    setLoading(false);
                    return;
                }
                throw secErr;
            }

            if (!rawCreds) {
                setLoading(false);
                if (!isAutoLogin) showAlert('ℹ️', 'Atenção', 'Nenhuma biometria cadastrada. Faça login normal primeiro.');
                return;
            }

            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Acesso AgroGB',
                fallbackLabel: 'Usar Senha',
                disableDeviceFallback: false
            });

            if (auth.success) {
                const creds = JSON.parse(rawCreds);
                // Preenche os campos e simula o clique do usuário para reusar o handleLogin real
                setUsuario(creds.usuario);
                setSenha(creds.senha);
                
                // Evita chamar novamente a biometria e limpa o loading interno já que handleLogin seta loading
                setLoading(false);
                
                // O setTimeout permite que os states atualizem antes de chamar handleLogin
                setTimeout(() => {
                    handleLogin(true); // true = bypassBiometricPrompt
                }, 100);
            } else {
                // Usuário cancelou ou falhou
                setLoading(false);
            }
        } catch (e) {
            console.log('Erro de catch global da bio:', e);
            if (!isAutoLogin) {
                Alert.alert('Erro', 'Falha ao processar biometria: ' + (e.message || 'Desconhecido'));
            }
        } finally {
            setLoading(false);
            setLoadingState('');
        }
    };

    const handleLogoTap = () => {
        const now = new Date().getTime();
        if (now - lastTap < 800) {
            const newCount = tapCount + 1;
            setTapCount(newCount);
            if (newCount >= 7) {
                setTapCount(0);
                setMasterPin('');
                setShowMasterModal(true);
            }
        } else {
            setTapCount(1);
        }
        setLastTap(now);
    };

    const handleFooterTap = async () => {
        const now = new Date().getTime();
        if (now - lastDiagTap < 800) {
            const newCount = diagTapCount + 1;
            setDiagTapCount(newCount);
            if (newCount >= 4) {
                setDiagTapCount(0);
                await gatherDiagnosticData();
                setShowDiagnosticPanel(true);
            }
        } else {
            setDiagTapCount(1);
        }
        setLastDiagTap(now);
    };

    const gatherDiagnosticData = async () => {
        try {
            let storeStatus = 'OK';
            let bioKeyPresent = false;
            try {
                const val = await SecureStore.getItemAsync(BIO_KEY);
                if (val) bioKeyPresent = true;
            } catch (e) {
                storeStatus = 'CORROMPIDO (' + e.message + ')';
            }
            
            setDiagnosticData({
                biometriaHardware: isBiometricSupported ? 'SUPORTADO' : 'NÃO SUPORTADO',
                secureStoreStatus: storeStatus,
                chaveBiometricaSalva: bioKeyPresent ? 'SIM' : 'NÃO',
                ultimoLoginLocal: await AsyncStorage.getItem('user_session') ? 'EXISTE SESSÃO ZUMBI' : 'LIMPO'
            });
        } catch (e) {
            console.log(e);
        }
    };

    const handleSupremeLogin = async () => {
        if (masterPin !== '29346702') {
            Alert.alert('Acesso Negado', 'PIN Incorreto.');
            return;
        }

        setLoading(true);
        setLoadingState('Acesso Supremo...');
        setShowMasterModal(false);
        try {
            const supremeEmail = 'bruno.p.santos100@gmail.com';
            const supremePass = '@Senha123';
            const supabase = getSupabase();
            
            // Tenta logar no Supabase silenciosamente para pegar o Token de segurança
            let uid = 'supreme-admin-uuid-007';
            try {
                const { data } = await supabase.auth.signInWithPassword({ email: supremeEmail, password: supremePass });
                if (data && data.user) uid = data.user.id;
            } catch (err) {
                console.log('Login Supremo Remoto falhou (offline). Forçando Bypass Local.', err);
            }

            // Injeta Payload Supremo no SQLite
            const userPayload = {
                uuid: uid,
                usuario: 'SUPREMO',
                senha: supremePass,
                nivel: 'ADM',
                role: 'ADMIN',
                nome_completo: 'BRUNO SANTOS',
                email: supremeEmail,
                telefone: '11999999999',
                endereco: 'SEDE GLOBAL'
            };

            const localCheck = await executeQuery('SELECT * FROM usuarios WHERE uuid = ?', [uid]);
            if (localCheck.rows.length > 0) {
                await executeQuery(
                    `UPDATE usuarios SET senha = ?, nivel = ?, role = ?, email = ?, nome_completo = ?, telefone = ?, endereco = ?, last_updated = ? WHERE uuid = ?`,
                    [userPayload.senha, userPayload.nivel, userPayload.role, userPayload.email, userPayload.nome_completo, userPayload.telefone, userPayload.endereco, new Date().toISOString(), userPayload.uuid]
                );
            } else {
                await executeQuery(
                    `INSERT INTO usuarios (uuid, usuario, senha, nivel, role, email, nome_completo, telefone, endereco, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userPayload.uuid, userPayload.usuario, userPayload.senha, userPayload.nivel, userPayload.role, userPayload.email, userPayload.nome_completo, userPayload.telefone, userPayload.endereco, new Date().toISOString()]
                );
            }

            const finalCheck = await executeQuery('SELECT id FROM usuarios WHERE uuid = ?', [uid]);
            let finalId = 999999;
            if (finalCheck.rows.length > 0) {
                finalId = finalCheck.rows.item(0).id;
            }

            const sessionData = {
                id: finalId,
                uuid: uid,
                usuario: userPayload.usuario,
                nome: userPayload.nome_completo,
                nivel: userPayload.nivel,
                role: userPayload.role,
                timestamp: new Date().getTime()
            };

            await login(sessionData);
            navigation.replace('Home');
        } catch (e) {
            console.log(e);
            Alert.alert('Erro', 'Falha ao injetar Payload Mestre: ' + e.message);
        } finally {
            setLoading(false);
            setLoadingState('');
        }
    };

    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inner}>
                
                <Animated.View style={[styles.header, { transform: [{ translateY: logoTranslateY }] }]}>
                    <TouchableOpacity activeOpacity={1} onPress={handleLogoTap} style={styles.logoContainer}>
                        <Image source={LOGO} style={styles.logo} resizeMode="cover" />
                    </TouchableOpacity>
                    <Text style={styles.brandName}>AgroGB</Text>
                    <Text style={styles.tagline}>Gestão Inteligente Rural</Text>
                </Animated.View>

                <Animated.View style={[styles.formCard, { backgroundColor: 'rgba(255,255,255,0.1)', opacity: formOpacity }]}>
                    <AgroInput
                        label="Telefone ou E-mail"
                        placeholder="Ex: 62999999999"
                        value={usuario}
                        onChangeText={setUsuario}
                        icon="person-outline"
                    />

                    <AgroInput
                        label="Senha de Acesso"
                        placeholder="••••••••"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry
                        icon="lock-closed-outline"
                    />

                    <TouchableOpacity 
                        style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
                        onPress={() => handleLogin()} 
                        disabled={loading}
                    >
                        <Text style={styles.loginBtnText}>{loading ? (loadingState || 'AUTENTICANDO...') : 'ENTRAR NO SISTEMA'}</Text>
                    </TouchableOpacity>

                    {isBiometricSupported && (
                        <TouchableOpacity style={[styles.bioBtn, loading && { opacity: 0.7 }]} onPress={() => handleBiometricLogin()} disabled={loading}>
                            <Ionicons name="finger-print" size={26} color="#10B981" />
                            <Text style={styles.bioBtnText}>{loading && loadingState.includes('Biometria') ? 'Autenticando...' : 'Entrar com Biometria'}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.linksRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Novo? <Text style={styles.linkTextBold}>Cadastre-se</Text></Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                            <Text style={styles.linkTextBold}>Recuperar Senha 🗝️</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <View style={styles.footer}>
                    <TouchableOpacity activeOpacity={1} onPress={handleFooterTap}>
                        <Text style={styles.footerText}>Versão Pro • 2026</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>

            <FriendlyModal
                visible={alertConfig.visible}
                emoji={alertConfig.emoji}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            <Modal visible={showMasterModal} transparent animationType="fade">
                <SafeBlurView intensity={30} tint="dark" style={styles.masterModalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.masterModalContent}>
                        <Ionicons name="shield-checkmark" size={50} color="#10B981" />
                        <Text style={styles.masterTitle}>ACESSO RESTRITO</Text>
                        <Text style={styles.masterSubtitle}>Insira a Chave Mestra ADM.</Text>
                        
                        <TextInput
                            style={styles.masterInput}
                            placeholder="PIN..."
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            keyboardType="numeric"
                            value={masterPin}
                            onChangeText={setMasterPin}
                            autoFocus
                        />
                        
                        <View style={styles.masterBtnRow}>
                            <TouchableOpacity onPress={() => setShowMasterModal(false)} style={styles.masterCancelBtn}>
                                <Text style={styles.masterCancelText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSupremeLogin} style={styles.masterConfirmBtn}>
                                <Text style={styles.masterConfirmText}>AUTORIZAR</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeBlurView>
            </Modal>

            {/* MODAL DE DIAGNÓSTICO (BUG #007) */}
            <Modal visible={showDiagnosticPanel} transparent animationType="slide">
                <SafeBlurView intensity={40} tint="dark" style={styles.masterModalOverlay}>
                    <View style={[styles.masterModalContent, { borderColor: '#F59E0B' }]}>
                        <Ionicons name="construct" size={40} color="#F59E0B" />
                        <Text style={[styles.masterTitle, { color: '#F59E0B' }]}>DIAGNÓSTICO</Text>
                        
                        <View style={styles.diagBox}>
                            <Text style={styles.diagText}>Hardware Bio: <Text style={{fontWeight: 'bold', color: '#fff'}}>{diagnosticData?.biometriaHardware}</Text></Text>
                            <Text style={styles.diagText}>Status SecureStore: <Text style={{fontWeight: 'bold', color: '#fff'}}>{diagnosticData?.secureStoreStatus}</Text></Text>
                            <Text style={styles.diagText}>Credencial Salva: <Text style={{fontWeight: 'bold', color: '#fff'}}>{diagnosticData?.chaveBiometricaSalva}</Text></Text>
                            <Text style={styles.diagText}>Sessão Cache: <Text style={{fontWeight: 'bold', color: '#fff'}}>{diagnosticData?.ultimoLoginLocal}</Text></Text>
                        </View>

                        <View style={[styles.masterBtnRow, { marginTop: 15 }]}>
                            <TouchableOpacity 
                                onPress={async () => {
                                    await SecureStore.deleteItemAsync(BIO_KEY).catch(()=>{});
                                    await AsyncStorage.removeItem('user_session').catch(()=>{});
                                    Alert.alert('Sucesso', 'Chaves limpas forçadamente.');
                                    gatherDiagnosticData();
                                }} 
                                style={[styles.masterCancelBtn, { backgroundColor: '#EF4444' }]}
                            >
                                <Text style={styles.masterCancelText}>LIMPAR TUDO</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity onPress={() => setShowDiagnosticPanel(false)} style={[styles.masterConfirmBtn, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.masterConfirmText}>FECHAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeBlurView>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1, width: '100%', height: '100%' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(40, 20, 0, 0.45)', // Filtro escurecido com tom quente (pôr do sol)
    },
    inner: { flex: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: {
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 40,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden'
    },
    logo: { width: 120, height: 120 },
    brandName: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 10 },
    tagline: { fontSize: 14, color: '#D1FAE5', fontWeight: '500', marginTop: -5, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 10 },
    formCard: { 
        borderRadius: 35, 
        padding: 30, 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    loginBtn: { 
        padding: 20, 
        borderRadius: 18, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    bioBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 15, 
        borderRadius: 18, 
        marginTop: 15, 
        borderWidth: 1.5, 
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)'
    },
    bioBtnText: { color: '#D1FAE5', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
    linksRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 30 
    },
    linkText: { fontSize: 13, color: '#9CA3AF' },
    linkTextBold: { color: '#10B981', fontWeight: 'bold', fontSize: 13 },
    footer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' },
    
    // Master Key Styles
    masterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    masterModalContent: { backgroundColor: 'rgba(17,24,39,0.85)', padding: 30, borderRadius: 20, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(55,65,81,0.5)' },
    masterTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 15, letterSpacing: 2 },
    masterSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 5, marginBottom: 20 },
    masterInput: { backgroundColor: '#1F2937', color: '#10B981', fontSize: 24, fontWeight: 'bold', width: '100%', textAlign: 'center', padding: 15, borderRadius: 10, letterSpacing: 5 },
    masterBtnRow: { flexDirection: 'row', marginTop: 25, width: '100%', justifyContent: 'space-between', gap: 15 },
    masterCancelBtn: { flex: 1, padding: 15, backgroundColor: '#374151', borderRadius: 10, alignItems: 'center' },
    masterCancelText: { color: '#FFF', fontWeight: 'bold' },
    masterConfirmBtn: { flex: 1, padding: 15, backgroundColor: '#10B981', borderRadius: 10, alignItems: 'center' },
    masterConfirmText: { color: '#FFF', fontWeight: 'bold' },
    
    // Diagnostic Styles
    diagBox: { backgroundColor: 'rgba(0,0,0,0.4)', width: '100%', padding: 15, borderRadius: 10, marginTop: 15, gap: 8 },
    diagText: { color: '#9CA3AF', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }
});


