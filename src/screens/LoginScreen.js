import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalUserId, initDB, checkLogin } from '../database/database';

export default function LoginScreen({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('@user_id');
                const storedUserLevel = await AsyncStorage.getItem('@user_level');

                if (storedUserId) {
                    console.log('🔄 Sessão Offline Recuperada:', storedUserId);
                    setGlobalUserId(parseInt(storedUserId));
                    await initDB();
                    navigation.replace('Home');
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.log("Falha ao recuperar sessão offline:", e);
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const handleLogin = async () => {
        if (!usuario.trim() || !senha.trim()) {
            Alert.alert('Aviso', 'Preencha o acesso e a senha.');
            return;
        }

        setLoading(true);
        try {
            await initDB();

            // Hardcode bypass Administrativo de emergência
            if (usuario.toUpperCase().trim() === 'ADMIN' && senha.trim() === '1234') {
                setGlobalUserId(999);
                await AsyncStorage.multiSet([
                    ['@user_id', '999'],
                    ['@user_level', 'ADMIN']
                ]);
                navigation.replace('Home');
                return;
            }

            const user = await checkLogin(usuario.trim(), senha.trim());
            if (user) {
                setGlobalUserId(user.id);
                // Persistindo Offline
                await AsyncStorage.multiSet([
                    ['@user_id', user.id.toString()],
                    ['@user_level', user.nivel || 'FUNC']
                ]);
                navigation.replace('Home');
            } else {
                Alert.alert('Ops!', 'Acesso ou senha incorretos.');
            }
        } catch (e) {
            console.error('Erro de Login:', e);
            Alert.alert('Erro', 'Falha ao processar o login offline.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Iniciando AgroGB...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

            {/* Imagem de Fundo Rural com Overlay Translúcido */}
            {/* O ImageBackground exige uma source que não temos garantida no assets, usaremos Gradient escuro e sólido (fundo rural abstrato) */}
            <LinearGradient colors={['#064E3B', '#047857', '#065F46']} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="leaf" size={60} color="#10B981" />
                        </View>
                        <Text style={styles.title}>AgroGB</Text>
                        <Text style={styles.subtitle}>Gestão Inteligente Rural</Text>
                    </View>

                    {/* CARD LOGIN PROFISSIONAL */}
                    <View style={styles.card}>

                        {/* Acesso (Email / Telefone) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>TELEFONE OU E-MAIL</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person" size={20} color="#6B7280" style={styles.inputIcon} />
                                <View style={styles.verticalDivider} />
                                <TextInput
                                    style={styles.textInput}
                                    value={usuario}
                                    onChangeText={setUsuario}
                                    placeholder="ex: (11) 99999-9999"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Senha */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SENHA</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed" size={20} color="#6B7280" style={styles.inputIcon} />
                                <View style={styles.verticalDivider} />
                                <TextInput
                                    style={styles.textInput}
                                    value={senha}
                                    onChangeText={setSenha}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* BOTÃO ENTRAR VERDE GRANDE */}
                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>ENTRAR</Text>}
                        </TouchableOpacity>

                        {/* LINKS MENORES */}
                        <View style={styles.linksContainer}>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.linkText}>Esqueci minha senha</Text>
                            </TouchableOpacity>
                            <Text style={styles.dot}> • </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.linkTextBold}>Criar conta</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                    <Text style={styles.versioning}>AgroGB Professional v4.2 • Offline First</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#064E3B' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoCircle: { width: 100, height: 100, backgroundColor: '#FFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    title: { fontSize: 36, fontWeight: '900', color: '#FFF', marginTop: 15, letterSpacing: 1 },
    subtitle: { fontSize: 16, color: '#D1FAE5', fontWeight: '500', marginTop: 5, letterSpacing: 0.5 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1, marginBottom: 8, marginLeft: 5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, height: 55 },
    inputIcon: { padding: 15 },
    verticalDivider: { width: 1, height: '60%', backgroundColor: '#E5E7EB' },
    textInput: { flex: 1, paddingHorizontal: 15, fontSize: 16, color: '#111827' },
    eyeIcon: { padding: 15 },
    loginButton: { backgroundColor: '#10B981', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 3 },
    loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    linksContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    linkText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
    linkTextBold: { color: '#059669', fontSize: 14, fontWeight: 'bold' },
    dot: { color: '#D1D5DB', fontSize: 18, marginHorizontal: 5 },
    versioning: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 40, fontSize: 12, fontWeight: 'bold' }
});
