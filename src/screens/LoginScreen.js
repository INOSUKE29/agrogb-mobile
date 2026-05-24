import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
    Image, ActivityIndicator, Animated, Dimensions, StatusBar, Vibration
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthService } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLoginSuccess }) {
    // --- ESTADO ---
    const [showSplash, setShowSplash] = useState(true);
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    // --- ATALHO SECRETO: 7x na logo ---
    const logoTapCount = useRef(0);
    const logoTapTimer = useRef(null);
    const [secretTapHint, setSecretTapHint] = useState(0); // mostra contador visual apÃ³s 3 cliques

    // --- ANIMAÃ‡Ã•ES SPLASH ---
    const splashLogoScale = useRef(new Animated.Value(0.5)).current;
    const splashLogoOpacity = useRef(new Animated.Value(0)).current;
    const splashTextOpacity = useRef(new Animated.Value(0)).current;
    const splashBadgeOpacity = useRef(new Animated.Value(0)).current;
    const splashTaglineOpacity = useRef(new Animated.Value(0)).current;
    const loadingBarWidth = useRef(new Animated.Value(0)).current;
    const splashFadeOut = useRef(new Animated.Value(1)).current;

    // --- ANIMAÃ‡Ã•ES LOGIN FORM ---
    const formSlideUp = useRef(new Animated.Value(80)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const logoSlideDown = useRef(new Animated.Value(-40)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkBiometrics();
        runSplashSequence();
    }, []);

    const checkBiometrics = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(compatible && enrolled);
        } catch { }
    };

    // --- HANDLER: 7 cliques na logo = login admin ---
    const handleLogoSecretTap = () => {
        logoTapCount.current += 1;
        const count = logoTapCount.current;

        // Mostra dica visual a partir do 3Âº toque
        if (count >= 3) setSecretTapHint(count);

        // Feedback de vibraÃ§Ã£o leve em cada toque apÃ³s o 3Âº
        if (count >= 3 && count < 7) Vibration.vibrate(40);

        // Reset do timer a cada toque
        if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
        logoTapTimer.current = setTimeout(() => {
            logoTapCount.current = 0;
            setSecretTapHint(0);
        }, 3000); // janela de 3 segundos

        // 7 toques: login admin!
        if (count >= 7) {
            logoTapCount.current = 0;
            setSecretTapHint(0);
            clearTimeout(logoTapTimer.current);
            Vibration.vibrate([0, 80, 60, 80]); // vibraÃ§Ã£o dupla de confirmaÃ§Ã£o
            handleAdminShortcut();
        }
    };

    const handleAdminShortcut = async () => {
        setLoading(true);
        try {
            const res = await AuthService.login('admin', 'admin');
            if (res.success) {
                if (onLoginSuccess) onLoginSuccess(res.user);
            } else {
                Alert.alert('âš ï¸ Atalho Admin', 'Conta admin nÃ£o encontrada no banco local.');
            }
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setLoading(false);
        }
    };

    const runSplashSequence = () => {
        // Fase 1: Logo aparece (scale + fade)
        Animated.parallel([
            Animated.spring(splashLogoScale, {
                toValue: 1,
                tension: 60,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(splashLogoOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Fase 2: Textos surgem em sequÃªncia
            Animated.stagger(200, [
                Animated.timing(splashTextOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(splashBadgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(splashTaglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]).start(() => {
                // Fase 3: Barra de loading anima
                Animated.timing(loadingBarWidth, {
                    toValue: width * 0.6,
                    duration: 1400,
                    useNativeDriver: false,
                }).start(() => {
                    // Fase 4: Fade out da splash, revela o login
                    Animated.timing(splashFadeOut, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }).start(() => {
                        setShowSplash(false);
                        revealLoginForm();
                    });
                });
            });
        });
    };

    const revealLoginForm = () => {
        Animated.parallel([
            Animated.spring(formSlideUp, {
                toValue: 0,
                tension: 70,
                friction: 10,
                useNativeDriver: true,
            }),
            Animated.timing(formOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(logoSlideDown, {
                toValue: 0,
                tension: 70,
                friction: 10,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // --- HANDLERS ---
    const handleLogin = async () => {
        const u = usuario.trim();
        const p = senha.trim();
        if (!u || !p) return Alert.alert('Campos Vazios', 'Por favor, informe suas credenciais.');
        setLoading(true);
        try {
            const res = await AuthService.login(u, p);
            if (res.success) {
                if (onLoginSuccess) onLoginSuccess(res.user);
            } else {
                Alert.alert('Acesso Negado', res.message || 'Credenciais invÃ¡lidas. Verifique seu e-mail e senha.');
            }
        } catch (e) {
            Alert.alert('Erro de ConexÃ£o', 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique sua internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometric = async () => {
        const res = await AuthService.loginWithBiometrics();
        if (res.success) {
            if (onLoginSuccess) onLoginSuccess(res.user);
        } else {
            Alert.alert('Biometria', res.message || 'Falha na autenticaÃ§Ã£o biomÃ©trica.');
        }
    };

    // --- RENDER SPLASH ---
    if (showSplash) {
        return (
            <Animated.View style={[styles.splashContainer, { opacity: splashFadeOut }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Image
                    source={require('../../assets/farm_bg.png')}
                    style={styles.splashBg}
                    resizeMode="cover"
                />
                {/* Overlay escuro cinematogrÃ¡fico */}
                

                {/* Logo Circle Glassmorphism */}
                <Animated.View style={[
                    styles.splashLogoCircle,
                    {
                        opacity: splashLogoOpacity,
                        transform: [{ scale: splashLogoScale }]
                    }
                ]}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.splashLogoImg}
                        resizeMode="contain"
                    />
                    <Text style={styles.splashLogoText}>AgroGB</Text>
                </Animated.View>

                {/* Textos centrais */}
                <Animated.Text style={[styles.splashTitle, { opacity: splashTextOpacity }]}>
                    AgroGB
                </Animated.Text>
                <Animated.Text style={[styles.splashSubtitle, { opacity: splashTextOpacity }]}>
                    ENTERPRISE DIAMOND PRO
                </Animated.Text>
                <Animated.View style={[styles.splashBadge, { opacity: splashBadgeOpacity }]}>
                    <Text style={styles.splashBadgeText}>v7.0 STABLE</Text>
                </Animated.View>

                {/* Tagline + Loading Bar no rodapÃ© */}
                <Animated.View style={[styles.splashFooter, { opacity: splashTaglineOpacity }]}>
                    <Text style={styles.splashTagline}>SISTEMA DE GESTÃƒO RURAL INTELIGENTE</Text>
                    <View style={styles.loadingBarTrack}>
                        <Animated.View style={[styles.loadingBarFill, { width: loadingBarWidth }]} />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }

    // --- RENDER LOGIN FORM ---
    return (
        <View style={styles.loginContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Fundo com imagem da fazenda */}
            <Image
                source={require('../../assets/farm_bg.png')}
                style={styles.loginBg}
                resizeMode="cover"
            />
            {/* Overlay dark elegante */}
            

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.loginScroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo compacta no topo */}
                        <Animated.View style={[
                            styles.loginBrand,
                            { opacity: logoOpacity, transform: [{ translateY: logoSlideDown }] }
                        ]}>
                            <TouchableOpacity
                                onPress={handleLogoSecretTap}
                                activeOpacity={0.85}
                                style={styles.loginLogoCircle}
                            >
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={styles.loginLogoImg}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            {/* Contador secreto â€” sÃ³ aparece apÃ³s 3 toques */}
                            {secretTapHint >= 3 && (
                                <View style={styles.secretCounter}>
                                    <Text style={styles.secretCounterText}>
                                        {'â—'.repeat(secretTapHint)}{'â—¦'.repeat(7 - secretTapHint)}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.loginTitle}>
                                Agro<Text style={{ color: '#4ADE80' }}>GB</Text>
                            </Text>
                            <Text style={styles.loginSlogan}>INTELIGÃŠNCIA NO CAMPO</Text>
                        </Animated.View>

                        {/* Card de Login */}
                        <Animated.View style={[
                            styles.loginCard,
                            { opacity: formOpacity, transform: [{ translateY: formSlideUp }] }
                        ]}>
                            {/* Campo E-mail / UsuÃ¡rio */}
                            <View style={styles.inputBox}>
                                <Text style={styles.inputLabel}>E-MAIL OU USUÃRIO</Text>
                                <View style={[
                                    styles.inputRow,
                                    focusedField === 'user' && styles.inputRowFocused
                                ]}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={focusedField === 'user' ? '#4ADE80' : '#6B7280'}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="seu@email.com"
                                        placeholderTextColor="#6B7280"
                                        value={usuario}
                                        onChangeText={setUsuario}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onFocus={() => setFocusedField('user')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Campo Senha */}
                            <View style={styles.inputBox}>
                                <Text style={styles.inputLabel}>SENHA DE ACESSO</Text>
                                <View style={[
                                    styles.inputRow,
                                    focusedField === 'pass' && styles.inputRowFocused
                                ]}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={focusedField === 'pass' ? '#4ADE80' : '#6B7280'}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        placeholderTextColor="#6B7280"
                                        value={senha}
                                        onChangeText={setSenha}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setFocusedField('pass')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* BotÃ£o Entrar */}
                            <TouchableOpacity
                                style={styles.btnEntrar}
                                onPress={handleLogin}
                                activeOpacity={0.85}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#16A34A', '#15803D', '#166534']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.btnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="log-in-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.btnEntrarText}>ENTRAR NO SISTEMA</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Biometria */}
                            {biometricAvailable && (
                                <View style={styles.bioSection}>
                                    <View style={styles.bioSeparator}>
                                        <View style={styles.bioLine} />
                                        <Text style={styles.bioOrText}>OU</Text>
                                        <View style={styles.bioLine} />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.bioBtn}
                                        onPress={handleBiometric}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons name="fingerprint" size={32} color="#4ADE80" />
                                        <Text style={styles.bioText}>Entrar com Biometria</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Links do rodapÃ© */}
                            <View style={styles.footerLinks}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.footerLink}>ðŸ”‘ Recuperar Senha</Text>
                                </TouchableOpacity>
                                <View style={styles.footerDivider} />
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Register')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.footerLink}>âœ¨ Primeiro Acesso</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* VersÃ£o */}
                        <Text style={styles.versionText}>
                            AgroGB v7.0 â€¢ Enterprise Diamond Pro
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    // ===== SPLASH =====
    splashContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    splashBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    splashLogoCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        // Glow verde
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
        elevation: 20,
    },
    splashLogoImg: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    splashLogoText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 4,
    },
    splashTitle: {
        fontSize: 44,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    splashSubtitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#4ADE80',
        letterSpacing: 3,
        marginTop: 6,
    },
    splashBadge: {
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    splashBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    splashFooter: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
        width: '100%',
    },
    splashTagline: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 16,
    },
    loadingBarTrack: {
        width: width * 0.6,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: 3,
        backgroundColor: '#4ADE80',
        borderRadius: 2,
        shadowColor: '#4ADE80',
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },

    // ===== LOGIN FORM =====
    loginContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    loginBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    loginScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    loginBrand: {
        alignItems: 'center',
        marginBottom: 32,
    },
    loginLogoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(74,222,128,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    loginLogoImg: {
        width: 55,
        height: 55,
        borderRadius: 28,
    },
    loginTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    loginSlogan: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 3,
        marginTop: 4,
    },

    // Contador secreto (7 toques)
    secretCounter: {
        marginTop: 8,
        marginBottom: 2,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(74,222,128,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.25)',
    },
    secretCounterText: {
        color: '#4ADE80',
        fontSize: 10,
        letterSpacing: 4,
        fontWeight: '700',
    },

    // Card de formulÃ¡rio
    loginCard: {
        backgroundColor: 'rgba(10,20,12,0.82)',
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    inputBox: {
        marginBottom: 22,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 14,
        height: 52,
    },
    inputRowFocused: {
        borderColor: '#4ADE80',
        backgroundColor: 'rgba(74,222,128,0.06)',
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#FFF',
        height: '100%',
    },

    // BotÃ£o Entrar
    btnEntrar: {
        marginTop: 8,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    btnGradient: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnEntrarText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1.5,
    },

    // Biometria
    bioSection: {
        marginTop: 24,
    },
    bioSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    bioLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    bioOrText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '700',
        marginHorizontal: 12,
        letterSpacing: 1,
    },
    bioBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(74,222,128,0.3)',
        borderRadius: 14,
        paddingVertical: 14,
        backgroundColor: 'rgba(74,222,128,0.06)',
        gap: 10,
    },
    bioText: {
        color: '#4ADE80',
        fontWeight: '700',
        fontSize: 14,
    },

    // Links rodapÃ©
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
        gap: 16,
    },
    footerLink: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '700',
    },
    footerDivider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // VersÃ£o
    versionText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        marginTop: 32,
        fontWeight: '600',
        letterSpacing: 1,
    },
});

