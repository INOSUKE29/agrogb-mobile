import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, StatusBar, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery, insertUsuario } from '../database/database';
import AgroInput from '../components/common/AgroInput';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { translateAuthError } from '../utils/errorHelpers';
import { getSupabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');
const LOGO = require('../../assets/icon.png');
const RURAL_BG = require('../../assets/login_bg.jpg');
const BIO_KEY = 'agrogb_biometric_credentials';

export default function LoginScreen({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        checkBiometrics();
        initApp();
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
        const userTrim = usuario.trim().toUpperCase();
        const passTrim = senha.trim();

        if (!userTrim || !passTrim) return Alert.alert('Atenção', 'Informe seu telefone/email e senha.');

        setLoading(true);
        try {
            // 1. LOGIN ADMIN LOCAL: Bypass instantâneo para a conta de administração
            if (userTrim === 'ADMIN' && passTrim === '1234') {
                const sessionData = {
                    id: 999999,
                    usuario: 'ADMIN',
                    nome: 'ADMINISTRADOR PADRÃO',
                    nivel: 'ADM',
                    role: 'ADMIN',
                    timestamp: new Date().getTime()
                };
                await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
                navigation.replace('Home');
                return;
            }

            const supabase = getSupabase();
            let targetEmail = userTrim;

            // 2. RESOLUÇÃO DE E-MAIL (E-mail, Telefone ou Username)
            if (!userTrim.includes('@')) {
                // Limpa caracteres especiais do telefone para consulta local
                const phoneClean = userTrim.replace(/\D/g, '');
                
                // Primeiro tenta localizar o e-mail no SQLite local
                const localUser = await executeQuery(
                    `SELECT email FROM usuarios WHERE (usuario = ? OR telefone = ? OR telefone = ?) AND is_deleted = 0`,
                    [userTrim, userTrim, phoneClean]
                );

                if (localUser.rows.length > 0) {
                    targetEmail = localUser.rows.item(0).email;
                } else {
                    // Caso não ache local (aparelho novo), consulta remotamente na tabela profiles
                    try {
                        const { data: remoteProfile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('username', userTrim.toLowerCase())
                            .single();
                        
                        if (remoteProfile && remoteProfile.email) {
                            targetEmail = remoteProfile.email;
                        }
                    } catch (e) {
                        console.log('Erro ao buscar e-mail por username no Supabase:', e);
                    }
                }
            }

            // 3. AUTENTICAÇÃO SUPABASE COM FALLBACK OFFLINE
            let authData = null;
            let authError = null;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: targetEmail.toLowerCase(),
                    password: passTrim
                });
                authData = data;
                authError = error;
            } catch (netError) {
                // Se falhar a conexão, tenta o login off-line diretamente com o banco SQLite local
                console.log('📡 Falha de rede. Tentando autenticação SQLite local (off-line)...');
                const phoneClean = userTrim.replace(/\D/g, '');
                const localRes = await executeQuery(
                    `SELECT * FROM usuarios WHERE (is_deleted = 0 OR is_deleted IS NULL) AND (usuario = ? OR telefone = ? OR telefone = ? OR email = ?) AND senha = ?`,
                    [userTrim, userTrim, phoneClean, userTrim, passTrim]
                );

                if (localRes.rows.length > 0) {
                    const userRow = localRes.rows.item(0);
                    const sessionData = {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nome: userRow.nome_completo || userRow.usuario,
                        nivel: userRow.nivel,
                        role: userRow.role || 'CLIENTE',
                        timestamp: new Date().getTime()
                    };
                    await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
                    navigation.replace('Home');
                    return;
                }
                throw netError;
            }

            if (authError) throw authError;

            // 4. LOGIN BEM-SUCEDIDO: Baixar/atualizar perfil e sincronizar SQLite local
            let profileData = null;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();
                profileData = data;
            } catch (e) {
                console.log('Erro ao baixar perfil do Supabase:', e);
            }

            const localCheck = await executeQuery('SELECT * FROM usuarios WHERE uuid = ?', [authData.user.id]);
            const userPayload = {
                uuid: authData.user.id,
                usuario: (profileData && profileData.username) || targetEmail.split('@')[0],
                senha: passTrim,
                nivel: (profileData && profileData.role === 'AGRONOMO') ? 'AGRONOMO' : 'USUARIO',
                role: (profileData && profileData.role) || 'CLIENTE',
                nome_completo: (profileData && profileData.nome_completo) || 'USUÁRIO AGROGB',
                email: targetEmail.toLowerCase(),
                telefone: authData.user.user_metadata?.phone || authData.user.phone || '',
                endereco: authData.user.user_metadata?.farm_name || ''
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
            const finalCheck = await executeQuery('SELECT id, usuario, nome_completo, nivel, role FROM usuarios WHERE uuid = ?', [authData.user.id]);
            const userRow = finalCheck.rows.item(0);

            const sessionData = {
                id: userRow.id,
                usuario: userRow.usuario,
                nome: userRow.nome_completo,
                nivel: userRow.nivel,
                role: userRow.role || 'CLIENTE',
                timestamp: new Date().getTime()
            };
            await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));

            // Pergunta biometria se aplicável
            if (!bypassBiometricPrompt && isBiometricSupported) {
                const bioEnabled = await SecureStore.getItemAsync(BIO_KEY);
                if (!bioEnabled) {
                    Alert.alert(
                        '🚀 Acesso Rápido',
                        'Deseja ativar o login por biometria (Digital/FaceID) para entrar automaticamente nos próximos acessos?',
                        [
                            { text: 'Agora não', onPress: () => navigation.replace('Home'), style: 'cancel' },
                            {
                                text: 'ATIVAR AGORA',
                                onPress: async () => {
                                    try {
                                        const auth = await LocalAuthentication.authenticateAsync({
                                            promptMessage: 'Confirme sua biometria para ativar',
                                        });
                                        if (auth.success) {
                                            await SecureStore.setItemAsync(BIO_KEY, JSON.stringify({ usuario: userTrim, senha: passTrim }));
                                            Alert.alert('Sucesso', 'Login biométrico ativado!');
                                            navigation.replace('Home');
                                        } else {
                                            navigation.replace('Home');
                                        }
                                    } catch (e) {
                                        navigation.replace('Home');
                                    }
                                }
                            }
                        ]
                    );
                    return;
                }
            }
            navigation.replace('Home');
        } catch (e) {
            Alert.alert('Erro no Login', translateAuthError(e.message || e.toString()));
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async (isAuto = false) => {
        try {
            const bioCreds = await SecureStore.getItemAsync(BIO_KEY);
            if (!bioCreds) {
                if (!isAuto) Alert.alert('Atenção', 'Biometria não configurada.');
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'AgroGB Autenticação Biométrica',
                fallbackLabel: 'Usar Senha Manual',
                disableDeviceFallback: false,
            });

            if (result.success) {
                const { usuario: bioUser, senha: bioPass } = JSON.parse(bioCreds);
                setUsuario(bioUser);
                setSenha(bioPass);
                // Executar login com os dados recuperados
                setTimeout(() => handleLogin(true), 100);
            } else if (!isAuto) {
                Alert.alert('Autenticação', 'Não foi possível autenticar biometria.');
            }
        } catch (e) {
            console.log('Erro Bio:', e);
            if (!isAuto) Alert.alert('Erro', 'Falha técnica na biometria.');
        }
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inner}>
                
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                    </View>
                    <Text style={styles.brandName}>AgroGB</Text>
                    <Text style={styles.tagline}>Gestão Inteligente Rural</Text>
                </View>

                <View style={styles.formCard}>
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
                        <Text style={styles.loginBtnText}>{loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}</Text>
                    </TouchableOpacity>

                    {isBiometricSupported && (
                        <TouchableOpacity style={styles.bioBtn} onPress={handleBiometricLogin}>
                            <Ionicons name="finger-print" size={26} color="#10B981" />
                            <Text style={styles.bioBtnText}>Entrar com Biometria</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.linksRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Não tem conta? <Text style={styles.linkTextBold}>Cadastre-se</Text></Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Versão Pro • 2026</Text>
                </View>

            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
    inner: { flex: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 20,
        borderRadius: 40,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    logo: { width: 80, height: 80 },
    brandName: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    tagline: { fontSize: 14, color: '#D1FAE5', fontWeight: '500', marginTop: -5, opacity: 0.8 },
    formCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 35, 
        padding: 30, 
        elevation: 20, 
        shadowColor: '#000', 
        shadowOpacity: 0.2, 
        shadowRadius: 20 
    },
    loginBtn: { 
        backgroundColor: '#10B981', 
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
        borderColor: '#E5E7EB' 
    },
    bioBtnText: { color: '#374151', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
    linksRow: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        marginTop: 30 
    },
    linkText: { fontSize: 14, color: '#6B7280' },
    linkTextBold: { color: '#10B981', fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' }
});


