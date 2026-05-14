import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { executeQuery, insertUsuario } from '../database/database';
import AgroInput from '../components/AgroInput';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { translateAuthError } from '../utils/errorHelpers';

const { width, height } = Dimensions.get('window');
const LOGO = require('../../assets/icon.png');
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
        const userJson = await AsyncStorage.getItem('user_session');
        if (userJson) {
            navigation.replace('Home');
            return;
        }

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
            const phoneClean = userTrim.replace(/\D/g, '');
            const sql = `SELECT * FROM usuarios WHERE is_deleted = 0 AND (usuario = ? OR telefone = ? OR usuario = ? OR email = ?)`;
            const params = [userTrim, userTrim, phoneClean, userTrim];

            const res = await executeQuery(sql, params);

            if (res.rows.length > 0) {
                const userRow = res.rows.item(0);
                if (userRow.senha === passTrim) {
                    const sessionData = {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nome: userRow.nome_completo || userRow.usuario,
                        nivel: userRow.nivel,
                        timestamp: new Date().getTime()
                    };
                    await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));

                    if (!bypassBiometricPrompt && isBiometricSupported) {
                        const bioEnabled = await SecureStore.getItemAsync(BIO_KEY);
                        if (!bioEnabled) {
                            Alert.alert(
                                'Biometria',
                                'Deseja ativar o acesso rápido por biometria?',
                                [
                                    { text: 'Agora não', onPress: () => navigation.replace('Home') },
                                    {
                                        text: 'Ativar',
                                        onPress: async () => {
                                            await SecureStore.setItemAsync(BIO_KEY, JSON.stringify({ usuario: userTrim, senha: passTrim }));
                                            navigation.replace('Home');
                                        }
                                    }
                                ]
                            );
                            return;
                        }
                    }
                    navigation.replace('Home');
                } else {
                    Alert.alert('Erro', 'Senha incorreta.');
                }
            } else {
                Alert.alert('Erro', 'Usuário não encontrado.');
            }
        } catch (e) {
            Alert.alert('Erro', translateAuthError(e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const bioCreds = await SecureStore.getItemAsync(BIO_KEY);
            if (!bioCreds) return Alert.alert('Atenção', 'Biometria não configurada.');

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'AgroGB Autenticação',
                fallbackLabel: 'Usar Senha',
            });

            if (result.success) {
                const { usuario: bioUser, senha: bioPass } = JSON.parse(bioCreds);
                setUsuario(bioUser);
                setSenha(bioPass);
                setTimeout(() => handleLogin(true), 100);
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha na biometria.');
        }
    };

    return (
        <LinearGradient colors={['#064E3B', '#065F46', '#047857']} style={styles.container}>
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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold' }
});


