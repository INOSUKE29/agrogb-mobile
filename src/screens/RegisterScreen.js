/**
 * RegisterScreen.js â€” AgroGB OS
 * RÃ©plica exata do LoginScreen com fundo Azul Marinho Escuro limpo.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, KeyboardAvoidingView,
    Platform, Alert, StatusBar, TouchableOpacity,
    TextInput, ActivityIndicator, ScrollView,
    Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { register } from '../services/authService';

const { width } = Dimensions.get('window');

// â”€â”€ FORÃ‡A DA SENHA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '#374151' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;

    if (score <= 1) return { level: 1, label: 'Fraca', color: '#EF4444' };
    if (score === 2) return { level: 2, label: 'Regular', color: '#F59E0B' };
    if (score === 3) return { level: 3, label: 'Boa', color: '#3B82F6' };
    return { level: 4, label: 'Forte', color: '#10B981' };
};

export default function RegisterScreen() {
    const navigation = useNavigation();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securePass, setSecurePass] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const pwStrength = getPasswordStrength(password);

    const handleRegister = async () => {
        if (!nome.trim() || !email.trim()) return Alert.alert('AtenÃ§Ã£o', 'Preencha todos os campos.');
        if (!password || password.length < 8) return Alert.alert('Senha fraca', 'Use no mÃ­nimo 8 caracteres.');
        if (password !== confirmPassword) return Alert.alert('Senhas diferentes', 'A confirmaÃ§Ã£o falhou.');

        setLoading(true);
        try {
            const res = await register(nome.trim(), email.trim(), password);
            if (res.success) {
                Alert.alert(
                    'âœ… Conta criada!',
                    'Bem-vindo ao AgroGB. FaÃ§a login para acessar sua fazenda.',
                    [{ text: 'Fazer Login', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Erro no Cadastro', res.message || 'Tente novamente.');
            }
        } catch {
            Alert.alert('Erro', 'Falha na conexÃ£o com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* â”€â”€ BACKGROUND NAVY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <View style={StyleSheet.absoluteFill}>
                
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }]}>
                    
                    {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Image source={require('../../assets/logo_agrogb_premium.jpg')} style={styles.logoImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.brandTitle}>Criar Conta</Text>
                    <Text style={styles.brandSubtitle}>INFORMAÃ‡Ã•ES DE ACESSO</Text>

                    {/* â”€â”€ FORM CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <View style={styles.formSection}>

                        {step === 1 ? (
                            <>
                                <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex: JoÃ£o da Silva"
                                        placeholderTextColor="#4B5563"
                                        value={nome}
                                        onChangeText={setNome}
                                    />
                                </View>

                                <Text style={[styles.fieldLabel, { marginTop: 24 }]}>E-MAIL OU TELEFONE</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex: joao@agrogb.com"
                                        placeholderTextColor="#4B5563"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <TouchableOpacity style={styles.enterBtn} onPress={() => {
                                    if (!nome.trim() || !email.trim()) return Alert.alert('AtenÃ§Ã£o', 'Preencha os dados.');
                                    setStep(2);
                                }} activeOpacity={0.87}>
                                    <LinearGradient colors={['#178243', '#25508D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.enterBtnGradient}>
                                        <Text style={styles.enterBtnText}>AVANÃ‡AR</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.fieldLabel}>CRIE UMA SENHA</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        placeholderTextColor="#4B5563"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={securePass}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setSecurePass(!securePass)}>
                                        <Ionicons name={securePass ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {password.length > 0 && (
                                    <View style={styles.strengthWrap}>
                                        <View style={styles.strengthBars}>
                                            {[1, 2, 3, 4].map(i => (
                                                <View key={i} style={[styles.strengthBar, { backgroundColor: i <= pwStrength.level ? pwStrength.color : '#1E293B' }]} />
                                            ))}
                                        </View>
                                        <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                                    </View>
                                )}

                                <Text style={[styles.fieldLabel, { marginTop: 24 }]}>CONFIRMAR SENHA</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        placeholderTextColor="#4B5563"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={secureConfirm}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                                        <Ionicons name={secureConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 35 }}>
                                    <TouchableOpacity style={styles.backFormBtn} onPress={() => setStep(1)}>
                                        <Ionicons name="arrow-back" size={22} color="#9CA3AF" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.enterBtn, { flex: 1, marginTop: 0 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.87}>
                                        <LinearGradient colors={['#178243', '#25508D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.enterBtnGradient}>
                                            {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.enterBtnText}>CRIAR CONTA</Text>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Voltar para o </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}>LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: Platform.OS === 'ios' ? 70 : 60,
        paddingBottom: 30,
    },

    /* L O G O  &  H E A D E R */
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
    logoImage: { width: 150, height: 150 },

    brandTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5, marginBottom: 6 },
    brandSubtitle: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 40 },

    /* F O R M */
    formSection: { width: '100%', marginBottom: 30, flex: 1 },
    fieldLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginLeft: 2
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 14,
        paddingHorizontal: 18,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#1E293B',
        gap: 12,
    },
    input: { flex: 1, color: '#FFF', fontSize: 16 },

    /* B O T T O N */
    enterBtn: {
        marginTop: 35,
        borderRadius: 14,
        overflow: 'hidden',
    },
    enterBtnGradient: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    enterBtnText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    backFormBtn: {
        height: 60, width: 60,
        borderRadius: 14,
        borderWidth: 1.5, borderColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center'
    },

    /* FORÃ‡A DA SENHA */
    strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginLeft: 2 },
    strengthBars: { flexDirection: 'row', gap: 6, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: 'bold', minWidth: 50 },

    /* F O O T E R */
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    footerText: { color: '#6B7280', fontSize: 12 },
    footerLink: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
});

