import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Image, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthService } from '../services/authService';

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }, []);

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
                 Alert.alert('Erro', res.message || 'Credenciais inválidas.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha na conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="dark-content" />
            
            {/* ATMOSPHERIC GRADIENT TOP (COESO COM A HOME) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', 'transparent']}
                style={styles.atmosphere}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <SafeAreaView style={{flex: 1}}>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        
                        <Animated.View style={[styles.brandArea, { opacity: fadeAnim }]}>
                            <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
                            <Text style={styles.brandTitle}>Agro<Text style={{color: '#4CAF50'}}>GB</Text></Text>
                            <Text style={styles.slogan}>INTELIGÊNCIA NO CAMPO</Text>
                        </Animated.View>

                        <Animated.View style={[styles.loginCard, { opacity: fadeAnim }]}>
                            <View style={styles.inputBox}>
                                <Text style={styles.label}>NOME DE USUÁRIO</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#1B5E20" style={styles.icon} />
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="Seu usuário" 
                                        value={usuario} 
                                        onChangeText={setUsuario} 
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <Text style={styles.label}>SENHA DE ACESSO</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#1B5E20" style={styles.icon} />
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="••••••••" 
                                        value={senha} 
                                        onChangeText={setSenha} 
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.btnAction} 
                                onPress={handleLogin}
                                activeOpacity={0.9}
                            >
                                <LinearGradient colors={['#1B5E20', '#166534']} style={styles.btnGrad}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>ENTRAR NO SISTEMA</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.bioArea}>
                                <Text style={styles.bioTxt}>Acesso Biométrico</Text>
                                <TouchableOpacity style={styles.bioCircle}>
                                    <MaterialCommunityIcons name="fingerprint" size={35} color="#1B5E20" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.footerLinks}>
                                <TouchableOpacity><Text style={styles.link}>Recuperar Senha</Text></TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity><Text style={styles.link}>Primeiro Acesso</Text></TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Text style={styles.version}>AgroGB v1.2.1 • Professional Edition</Text>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

// Para o RNStatusBar funcionar dentro do componente se importado do react-native
import { StatusBar as RNStatusBar } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    atmosphere: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 25 },
    brandArea: { alignItems: 'center', marginBottom: 40 },
    logoImg: { width: 100, height: 100, borderRadius: 25, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    brandTitle: { fontSize: 36, fontWeight: '900', color: '#FFF' },
    slogan: { color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 2, fontWeight: '700' },

    loginCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    inputBox: { marginBottom: 25 },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238', height: 40 },

    btnAction: { marginTop: 10, borderRadius: 15, overflow: 'hidden', shadowColor: '#1B5E20', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },

    bioArea: { alignItems: 'center', marginTop: 30 },
    bioTxt: { fontSize: 11, color: '#90A4AE', fontWeight: 'bold', marginBottom: 15 },
    bioCircle: { width: 66, height: 66, borderRadius: 33, borderSize: 1, borderColor: '#1B5E20', backgroundColor: 'rgba(27, 94, 32, 0.05)', justifyContent: 'center', alignItems: 'center' },

    footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, gap: 15 },
    link: { fontSize: 13, color: '#1B5E20', fontWeight: '800' },
    divider: { width: 1, height: 15, backgroundColor: '#ECEFF1' },
    version: { textAlign: 'center', color: '#B0BEC5', fontSize: 10, marginTop: 40, fontWeight: 'bold' }
});
