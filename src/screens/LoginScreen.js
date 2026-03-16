import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, KeyboardAvoidingView,
    Platform, Alert, StatusBar, TouchableOpacity,
    TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Acesso Restrito', 'Por favor, informe suas credenciais.');
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else {
                Alert.alert('Acesso Negado', res.message || 'Credenciais inválidas.');
            }
        } catch {
            setLoading(false);
            Alert.alert('Erro', 'Falha ao autenticar.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0F3D2E" />
            <LinearGradient
                colors={['#0F3D2E', '#1F7A55', '#4CAF7A']}
                style={styles.background}
            >
                <View style={styles.content}>
                    
                    {/* 1 HEADER COM LOGO */}
                    <View style={styles.headerContainer}>
                        <Image
                            source={{ uri: 'https://i.ibb.co/L6HhLp0/logo-agrogb.png' }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>AgroGB</Text>
                        <Text style={styles.subtitle}>Gestão Inteligente Rural</Text>
                    </View>

                    {/* 2 FORMULÁRIO DE LOGIN (CARD BRANCO) */}
                    <View style={styles.card}>
                        
                        {/* Campo Telefone ou E-mail */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Telefone ou E-mail"
                                placeholderTextColor="#95A5A6"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Campo Senha com Toggle */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Senha"
                                placeholderTextColor="#95A5A6"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                            />
                            <TouchableOpacity 
                                onPress={() => setSecureText(!secureText)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={secureText ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#7F8C8D" 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Botão Entrar */}
                        <TouchableOpacity 
                            style={styles.loginBtn}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginBtnText}>
                                {loading ? 'Acessando...' : 'ENTRAR'}
                            </Text>
                        </TouchableOpacity>

                        {/* 3 LINKS AUXILIARES */}
                        <View style={styles.linksContainer}>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.linkText}>Esqueci minha senha</Text>
                            </TouchableOpacity>
                            <Text style={styles.linkSeparator}>|</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.linkText}>Criar conta</Text>
                            </TouchableOpacity>
                        </View>
                        
                    </View>
                    
                    {/* 4 RODAPÉ DO APP */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>AgroGB Mobile</Text>
                        <Text style={styles.footerText}>Feito para gestão rural</Text>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 24,
        elevation: 6, // Android
        shadowColor: '#000', // iOS
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6F7',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2C3E50',
    },
    eyeIcon: {
        padding: 4,
    },
    loginBtn: {
        backgroundColor: '#27AE60',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    linkText: {
        fontSize: 14,
        color: '#2C3E50',
    },
    linkSeparator: {
        fontSize: 14,
        color: '#BDC3C7',
        marginHorizontal: 12,
    },
    footerContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    }
});
