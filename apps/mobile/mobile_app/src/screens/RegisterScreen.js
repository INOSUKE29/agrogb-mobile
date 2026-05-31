import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validateRegisterExpress, getPasswordStrength } from '../utils/validation';
import { translateAuthError } from '../utils/errorHelpers';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';
import FriendlyModal from '../components/common/FriendlyModal';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        emoji: '🧐',
        title: 'Atenção',
        message: '',
        buttonText: 'Entendi 👍'
    });

    const showAlert = (emoji, title, message, buttonText = 'Entendi 👍') => {
        setAlertConfig({
            visible: true,
            emoji,
            title,
            message,
            buttonText
        });
    };

    const handleRegister = async () => {
        const cleanedEmail = (form.email || '').trim().replace(/\s/g, '').toLowerCase();
        const cleanedForm = { ...form, email: cleanedEmail };

        const { isValid, errors } = validateRegisterExpress(cleanedForm);
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            showAlert('✍️', 'Ajuste de Campo', firstError + ' 😊');
            return;
        }

        setLoading(true);
        try {
            // Usa o AuthService para criar a conta. 
            // O perfil será criado automaticamente no backend pela Trigger do Supabase.
            const { AuthService } = require('../services/authService');
            await AuthService.registerWithEmail(cleanedEmail, cleanedForm.password);

            showAlert('🎉', 'Sucesso!', 'Sua conta foi criada com sucesso! Agora, insira seu e-mail e senha na tela de login para completar o cadastro da sua fazenda ou CREA. 😉', 'Fazer Login ➔');
        } catch (error) {
            const friendlyMsg = translateAuthError(error.message || error.toString());
            showAlert('🧐', 'Erro no Cadastro', friendlyMsg + ' Que tal revisar as credenciais com bastante carinho?');
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(form.password);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0B121E', '#111827']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>NOVA CONTA AGROGB</Text>
                <Text style={styles.subtitle}>Crie seu acesso expresso em poucos segundos.</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="mail-outline" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>CREDENCIAS DE ENTRADA</Text>
                    </View>
                    
                    <AgroInput 
                        label="E-MAIL" 
                        placeholder="seu@email.com"
                        value={form.email} 
                        keyboardType="email-address" 
                        autoCapitalize="none" 
                        onChangeText={t => setForm({...form, email: t})} 
                        icon="mail-outline" 
                    />
                    
                    <AgroInput 
                        label="SENHA" 
                        placeholder="Mínimo 8 caracteres, maiúscula e número"
                        value={form.password} 
                        secureTextEntry={true} 
                        onChangeText={t => setForm({...form, password: t})} 
                        icon="key-outline" 
                    />
                    
                    {/* Indicador de Força */}
                    <View style={styles.strengthContainer}>
                        <View style={[styles.strengthBar, { width: `${strength * 100}%`, backgroundColor: strength > 0.7 ? '#10B981' : (strength > 0.4 ? '#F59E0B' : '#EF4444') }]} />
                    </View>
                    <Text style={styles.passwordHint}>Sua senha deve conter: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#).</Text>

                    <AgroInput 
                        label="CONFIRMAR SENHA" 
                        placeholder="Repita sua senha com atenção"
                        value={form.confirmPassword} 
                        secureTextEntry={true} 
                        onChangeText={t => setForm({...form, confirmPassword: t})} 
                        icon="checkmark-shield-outline" 
                    />

                    <TouchableOpacity 
                        style={styles.termsRow} 
                        onPress={() => setForm({...form, acceptTerms: !form.acceptTerms})}
                    >
                        <Ionicons 
                            name={form.acceptTerms ? "checkbox" : "square-outline"} 
                            size={22} 
                            color="#10B981" 
                        />
                        <Text style={styles.termsText}>Li e aceito os <Text style={{ color: '#10B981' }}>Termos de Uso</Text> e <Text style={{ color: '#10B981' }}>Política de Privacidade</Text>.</Text>
                    </TouchableOpacity>

                    <AgroButton 
                        title="CRIAR CONTA EXPRESSA 🚀" 
                        onPress={handleRegister} 
                        loading={loading} 
                    />

                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>Já tem uma conta? <Text style={{ fontWeight: '900', color: '#10B981' }}>Fazer Login</Text></Text>
                    </TouchableOpacity>
                </LinearGradient>
            </ScrollView>

            <FriendlyModal
                visible={alertConfig.visible}
                emoji={alertConfig.emoji}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                onClose={() => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.emoji === '🎉') {
                        navigation.navigate('Login');
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { paddingTop: 60, paddingBottom: 60, paddingHorizontal: 25, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    backBtn: { marginBottom: 20 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 5, fontWeight: '600' },
    scroll: { padding: 20, paddingBottom: 100 },
    card: { padding: 25, marginTop: -30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, marginBottom: 15 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5 },
    strengthContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 5, marginTop: -10 },
    strengthBar: { height: '100%', borderRadius: 2 },
    passwordHint: { fontSize: 10, color: '#6B7280', marginBottom: 15, fontStyle: 'italic' },
    termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    termsText: { marginLeft: 10, fontSize: 12, color: '#9CA3AF', fontWeight: '600', flex: 1 },
    loginLink: { alignSelf: 'center', marginTop: 20, padding: 10 },
    loginLinkText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' }
});
