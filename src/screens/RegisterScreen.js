import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getSupabase } from '../services/supabase';
import { validateRegister, getPasswordStrength } from '../utils/validation';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';
import Card from '../components/common/Card';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const { theme } = useTheme();
    const [form, setForm] = useState({
        fullName: '', birthYear: '', email: '', phone: '',
        password: '', confirmPassword: '', farmName: '', username: '',
        acceptTerms: false
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const { isValid, errors } = validateRegister(form);
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            return Alert.alert('Validação', firstError);
        }

        setLoading(true);
        try {
            const supabase = getSupabase();
            
            // 1. Criar Usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: { full_name: form.fullName }
                }
            });

            if (authError) throw authError;

            // 2. Criar Perfil na Tabela profiles
            const { error: profileError } = await supabase.from('profiles').insert([{
                id: authData.user.id,
                full_name: form.fullName,
                birth_year: parseInt(form.birthYear),
                email: form.email,
                phone: form.phone,
                username: form.username || null,
                farm_name: form.farmName || null
            }]);

            if (profileError) throw profileError;

            Alert.alert('🚀 Sucesso!', 'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.', [
                { text: 'FAZER LOGIN', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert('Erro no Cadastro', error.message);
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(form.password);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>NOVA CONTA AGROGB</Text>
                <Text style={styles.subtitle}>Junte-se à elite da gestão agrícola digital.</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Card style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
                    </View>
                    
                    <AgroInput 
                        label="NOME COMPLETO" 
                        placeholder="Como deseja ser chamado?"
                        value={form.fullName} 
                        onChangeText={t => setForm({...form, fullName: t})} 
                        icon="person-outline" 
                    />
                    
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="ANO NASC." 
                                placeholder="1990"
                                value={form.birthYear} 
                                keyboardType="numeric" 
                                maxLength={4} 
                                onChangeText={t => setForm({...form, birthYear: t})} 
                            />
                        </View>
                        <View style={{ flex: 2 }}>
                            <AgroInput 
                                label="WHATSAPP / CELULAR" 
                                placeholder="(00) 00000-0000"
                                value={form.phone} 
                                keyboardType="phone-pad" 
                                onChangeText={t => setForm({...form, phone: t})} 
                                icon="logo-whatsapp" 
                            />
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Ionicons name="leaf-outline" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>IDENTIDADE RURAL (OPCIONAL)</Text>
                    </View>
                    
                    <AgroInput 
                        label="NOME DA FAZENDA" 
                        placeholder="Ex: Fazenda Santa Maria"
                        value={form.farmName} 
                        onChangeText={t => setForm({...form, farmName: t})} 
                        icon="business-outline" 
                    />
                    
                    <AgroInput 
                        label="NOME DE USUÁRIO (@)" 
                        placeholder="Ex: bruno_agro"
                        value={form.username} 
                        autoCapitalize="none" 
                        onChangeText={t => setForm({...form, username: t})} 
                        icon="at-outline" 
                    />

                    <View style={styles.sectionHeader}>
                        <Ionicons name="lock-closed-outline" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>SEGURANÇA DA CONTA</Text>
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
                        placeholder="Mínimo 8 caracteres"
                        value={form.password} 
                        secureTextEntry 
                        onChangeText={t => setForm({...form, password: t})} 
                        icon="key-outline" 
                    />
                    
                    {/* Indicador de Força */}
                    <View style={styles.strengthContainer}>
                        <View style={[styles.strengthBar, { width: `${strength * 100}%`, backgroundColor: strength > 0.7 ? '#10B981' : (strength > 0.4 ? '#F59E0B' : '#EF4444') }]} />
                    </View>

                    <AgroInput 
                        label="CONFIRMAR SENHA" 
                        placeholder="Repita sua senha"
                        value={form.confirmPassword} 
                        secureTextEntry 
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
                        title="CRIAR MINHA CONTA AGORA" 
                        onPress={handleRegister} 
                        loading={loading} 
                    />

                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>Já tem uma conta? <Text style={{ fontWeight: '900', color: '#10B981' }}>Fazer Login</Text></Text>
                    </TouchableOpacity>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 25, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    backBtn: { marginBottom: 20 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 5, fontWeight: '600' },
    scroll: { padding: 20, paddingBottom: 100 },
    card: { padding: 25, marginTop: -30, borderRadius: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25, marginBottom: 15 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5 },
    row: { flexDirection: 'row' },
    strengthContainer: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 15, marginTop: -10 },
    strengthBar: { height: '100%', borderRadius: 2 },
    termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    termsText: { marginLeft: 10, fontSize: 12, color: '#6B7280', fontWeight: '600', flex: 1 },
    loginLink: { alignSelf: 'center', marginTop: 20, padding: 10 },
    loginLinkText: { fontSize: 14, color: '#4B5563', fontWeight: '600' }
});
