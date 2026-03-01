import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, Dimensions, ImageBackground, SafeAreaView, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { executeQuery, insertUsuario } from '../database/database';

const { width } = Dimensions.get('window');

// Fundo rural provisório (pode ser trocado por um asset local depois)
const RURAL_BG = { uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' };

export default function LoginScreen({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                const session = JSON.parse(userJson);
                const now = new Date().getTime();
                const sessionTime = session.timestamp || 0;

                // Validade da Sessão: 7 dias (7 * 24 * 60 * 60 * 1000 = 604800000 ms)
                const isSessionValid = (now - sessionTime) < 604800000;

                if (isSessionValid) {
                    navigation.replace('Home');
                    return;
                } else {
                    // Sessão expirada, forçar novo login removendo token velho
                    await AsyncStorage.removeItem('user_session');
                }
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
                } else {
                    await executeQuery("UPDATE usuarios SET senha = '1234' WHERE usuario = 'ADMIN' AND senha = '123'");
                }
            } catch (error) {
                console.log('Erro ao inicializar admin:', error);
            }
        };
        init();
    }, []);

    const handleLogin = async () => {
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

                let isValid = false;
                if (hash && hash.startsWith('$2')) {
                    const bcrypt = require('react-native-bcrypt');
                    const isaac = require('isaac');
                    bcrypt.setRandomFallback((len) => {
                        const buf = new Uint8Array(len);
                        return buf.map(() => Math.floor(isaac.random() * 256));
                    });
                    isValid = bcrypt.compareSync(passTrim, hash);
                } else {
                    isValid = (hash === passTrim);
                }

                if (isValid) {
                    const sessionData = {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nome: userRow.nome_completo || userRow.usuario,
                        nivel: userRow.nivel,
                        timestamp: new Date().getTime()
                    };
                    await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
                    navigation.replace('Home');
                } else {
                    Alert.alert('Acesso Negado', 'Senha incorreta.');
                }
            } else {
                Alert.alert('Não Encontrado', 'Usuário não cadastrado no banco local.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao processar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.backgroundImage} blurRadius={4}>
            {/* Overlay Branco Semi-transparente */}
            <View style={styles.overlay} />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* HEADER LOGO */}
                        <View style={styles.header}>
                            <Image
                                source={require('../../assets/logo_agrogb.jpg')}
                                style={styles.realLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>AgroGB</Text>
                            <Text style={styles.subtitle}>Gestão Inteligente Rural</Text>
                        </View>

                        {/* LOGIN CARD */}
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>TELEFONE OU E-MAIL</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call" size={20} color="#4CAF50" style={styles.inputIconLeft} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="(xx) 9xxxx-xxxx"
                                        placeholderTextColor="#9e9e9e"
                                        value={usuario}
                                        onChangeText={setUsuario}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>SENHA</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed" size={20} color="#9e9e9e" style={styles.inputIconLeft} />
                                    <TextInput
                                        style={[styles.input, { paddingRight: 45 }]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#9e9e9e"
                                        value={senha}
                                        onChangeText={setSenha}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.inputIconRight}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9e9e9e" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.loginButtonContainer}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#66BB6A', '#2E7D32']}
                                    style={styles.loginButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.loginButtonText}>{loading ? 'CARREGANDO...' : 'ENTRAR'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.linksContainer}>
                                <TouchableOpacity>
                                    <Text style={styles.linkText}>Esqueci minha senha</Text>
                                </TouchableOpacity>
                                <Text style={styles.linkSeparator}>   ou   </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.linkText}>Criar conta</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* FOOTER */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Feito com ❤ para o agro</Text>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.85)'
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50
    },
    header: {
        alignItems: 'center',
        marginBottom: 35,
    },
    realLogo: {
        width: 130,
        height: 130,
        marginBottom: 10,
        borderRadius: 65, // Caso queira deixar arredondado, ou remover
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b6b6b',
    },
    card: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: '#7a7a7a',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '600'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#FFFFFF', // manter branco
        position: 'relative'
    },
    inputIconLeft: {
        position: 'absolute',
        left: 15,
        zIndex: 1,
    },
    inputIconRight: {
        position: 'absolute',
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingLeft: 45,
        fontSize: 15,
        color: '#333',
    },
    loginButtonContainer: {
        marginTop: 15,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    loginButton: {
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    linksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
    },
    linkText: {
        fontSize: 14,
        color: '#6b6b6b',
    },
    linkSeparator: {
        fontSize: 14,
        color: '#b0b0b0',
    },
    footer: {
        marginTop: 60,
    },
    footerText: {
        fontSize: 14,
        color: '#8e8e8e',
    }
});
