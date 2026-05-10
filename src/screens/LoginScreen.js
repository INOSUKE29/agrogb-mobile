import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery, insertUsuario } from '../database/database';
import AgroInput from '../components/AgroInput';

// Botão Simples embutido para garantir a cor verde caso o AgroButton genérico tenha cache de azul
const GreenButton = ({ title, onPress, loading }) => (
    <TouchableOpacity style={styles.greenBtn} onPress={onPress} disabled={loading}>
        <Text style={styles.greenBtnText}>{loading ? 'CARREGANDO...' : title}</Text>
    </TouchableOpacity>
);

const { height } = Dimensions.get('window');

// Fundo rural provisório (pode ser trocado por um asset local depois)
// Fundo oficial (usuário deve colocar a imagem enviada em assets/login_bg.png)
const RURAL_BG = require('../../assets/login_bg.png');
// Logo oficial (se existir, senão usa ícone)
const LOGO = require('../../assets/icon.png');

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { translateAuthError } from '../utils/errorHelpers';

const BIO_KEY = 'agrogb_biometric_credentials';

export default function LoginScreen({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        const checkBiometrics = async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            setIsBiometricSupported(compatible && types.length > 0);
        };
        checkBiometrics();

        const init = async () => {
            // Verificar Auto-Login (Sessão Persistida Offline)
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                navigation.replace('Home');
                return;
            }

            // Criar Usuário ADMIN Padrão
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
        init();
    }, []);

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
                const hash = userRow.senha;

                let isValid = (hash === passTrim); // Simplificado para exemplo, mantendo lógica anterior se necessário

                if (isValid) {
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
                                'Login por Biometria',
                                'Deseja ativar o login por biometria para os próximos acessos?',
                                [
                                    { text: 'Agora não', onPress: () => navigation.replace('Home') },
                                    {
                                        text: 'Sim, ativar',
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
                    Alert.alert('Acesso Negado', 'Senha incorreta.');
                }
            } else {
                Alert.alert('Não Encontrado', 'Usuário não cadastrado.');
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
                promptMessage: 'Login AgroGB',
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
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inner}>
                <View style={styles.header}>
                    <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.brandName}>AgroGB</Text>
                    <Text style={styles.tagline}>Gestão Inteligente Rural</Text>
                </View>

                <View style={styles.formCard}>
                    <AgroInput
                        label="E-MAIL OU TELEFONE"
                        placeholder="seu@email.com"
                        value={usuario}
                        onChangeText={setUsuario}
                        icon="person-outline"
                    />

                    <AgroInput
                        label="SENHA"
                        placeholder="••••••••"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry
                        icon="lock-closed-outline"
                    />

                    <TouchableOpacity style={styles.loginBtn} onPress={() => handleLogin()} disabled={loading}>
                        <Text style={styles.loginBtnText}>{loading ? 'CARREGANDO...' : 'ENTRAR'}</Text>
                    </TouchableOpacity>

                    {isBiometricSupported && (
                        <TouchableOpacity style={styles.bioBtn} onPress={handleBiometricLogin}>
                            <Ionicons name="finger-print-outline" size={24} color="#10B981" />
                            <Text style={styles.bioBtnText}>Entrar com biometria</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.linksRow}>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Esqueci minha senha</Text>
                        </TouchableOpacity>
                        <Text style={styles.linkSeparator}>ou</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkTextBold}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Feito com ❤️ para o agro</Text>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    inner: { flex: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 120, height: 120, marginBottom: 10 },
    brandName: { fontSize: 32, fontWeight: '900', color: '#82C91E', letterSpacing: 1 },
    tagline: { fontSize: 14, color: '#FFF', fontWeight: '600', marginTop: -5 },
    formCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 30, 
        padding: 30, 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 15 
    },
    loginBtn: { 
        backgroundColor: '#10B981', 
        padding: 18, 
        borderRadius: 15, 
        alignItems: 'center', 
        marginTop: 10 
    },
    loginBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
    bioBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 15, 
        borderRadius: 15, 
        marginTop: 15, 
        borderWidth: 1, 
        borderColor: '#10B981' 
    },
    bioBtnText: { color: '#10B981', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
    linksRow: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 25, 
        gap: 10 
    },
    linkText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    linkSeparator: { fontSize: 13, color: '#9CA3AF' },
    linkTextBold: { fontSize: 13, color: '#10B981', fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' }
});

