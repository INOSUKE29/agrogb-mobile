import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, Dimensions, ImageBackground, SafeAreaView, ScrollView, Image, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthService } from '../services/authService';

const { width } = Dimensions.get('window');

// Fundo rural clean
const RURAL_BG = { uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' };

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Animações
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleBiometricLogin = async () => {
        setLoading(true);
        try {
            const res = await AuthService.loginWithBiometrics();
            if (res.success) { 
                if (onLoginSuccess) onLoginSuccess(res.user); 
            } else {
                Alert.alert('Biometria', res.message || 'Falha na autenticação.');
            }
        } catch { 
            Alert.alert('Erro', 'Falha ao processar comando de biometria.'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleLogin = async () => {
        const userTrim = usuario.trim().toLowerCase();
        const passTrim = senha.trim();

        if (!userTrim || !passTrim) return Alert.alert('Acesso Restrito', 'Preencha usuário/e-mail e a senha.');

        setLoading(true);
        try {
            // Conecta ao Supabase Real que não existe na Cobaia mockada
            const res = await AuthService.login(userTrim, passTrim);
            
            if (res.success) {
                const alreadyAsked = await AsyncStorage.getItem('@asked_biometrics');
                const hardware = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                
                // UX da Digital Original sendo mantida
                if (hardware && !alreadyAsked && enrolled) {
                    Alert.alert('Acesso Biométrico', 'Deseja ativar acesso por digital na próxima vez que entrar?', [
                        { text: 'Agora não', onPress: async () => { await AsyncStorage.setItem('@asked_biometrics', 'false'); if (onLoginSuccess) onLoginSuccess(res.user); } },
                        { text: 'Sim', onPress: async () => { await AsyncStorage.setItem('@asked_biometrics', 'true'); if (onLoginSuccess) onLoginSuccess(res.user); } }
                    ]);
                } else { 
                    if (onLoginSuccess) onLoginSuccess(res.user); 
                }
            } else {
                 Alert.alert('Acesso Negado', res.message || 'Credenciais inválidas no servidor.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao conectar com o provedor de autenticação principal.');
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
                        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                            <Image
                                source={require('../../assets/logo_agrogb.jpg')}
                                style={styles.realLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>AgroGB</Text>
                            <Text style={styles.subtitle}>Gestão Profissional</Text>
                        </Animated.View>

                        {/* LOGIN CARD CLARO COM SOMBRA */}
                        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>E-MAIL OU USUÁRIO</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person" size={20} color="#4CAF50" style={styles.inputIconLeft} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="exemplo@agrogb.com"
                                        placeholderTextColor="#9e9e9e"
                                        value={usuario}
                                        onChangeText={setUsuario}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>SENHA DE ACESSO</Text>
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
                                     {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>ENTRAR</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* BIOMETRIA ANTIGA RESTAURADA AQUI NO MEIO DA UI CLARA */}
                            <View style={styles.bioContainer}>
                                <Text style={styles.bioTitle}>Ou acesse apenas com a sua digital</Text>
                                <TouchableOpacity onPress={handleBiometricLogin} style={styles.fpButtonContainer} activeOpacity={0.8}>
                                    <View style={styles.fpGlow}>
                                        <MaterialCommunityIcons name="fingerprint" size={38} color="#2E7D32" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.linksContainer}>
                                <TouchableOpacity>
                                    <Text style={styles.linkText}>Esqueci minha senha</Text>
                                </TouchableOpacity>
                                <Text style={styles.linkSeparator}>   •   </Text>
                                <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                                    <Text style={styles.linkText}>Criar nova conta</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
    safeArea: { flex: 1, },
    keyboardView: { flex: 1, },
    scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    
    header: { alignItems: 'center', marginBottom: 25, },
    realLogo: { width: 120, height: 120, marginBottom: 10, borderRadius: 60, },
    title: { fontSize: 32, fontWeight: '700', color: '#2E7D32', marginBottom: 4, },
    subtitle: { fontSize: 13, color: '#6b6b6b', fontWeight: 'bold', textTransform: 'uppercase' },
    
    card: { width: '88%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 5, },
    inputGroup: { marginBottom: 20, },
    label: { fontSize: 11, color: '#7a7a7a', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4, fontWeight: '700' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#FFFFFF', position: 'relative' },
    inputIconLeft: { position: 'absolute', left: 15, zIndex: 1, },
    inputIconRight: { position: 'absolute', right: 15, zIndex: 1, padding: 5, },
    input: { flex: 1, height: '100%', paddingLeft: 45, fontSize: 15, color: '#333', },
    loginButtonContainer: { marginTop: 5, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, },
    loginButton: { height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', },
    loginButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    
    bioContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
    bioTitle: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginBottom: 12 },
    fpButtonContainer: { width: 66, height: 66, borderRadius: 33, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#10B981', elevation: 2 },
    fpGlow: { justifyContent: 'center', alignItems: 'center' },
    
    linksContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, },
    linkText: { fontSize: 13, color: '#6b6b6b', fontWeight: 'bold' },
    linkSeparator: { fontSize: 14, color: '#b0b0b0', fontWeight: 'bold' },
});
