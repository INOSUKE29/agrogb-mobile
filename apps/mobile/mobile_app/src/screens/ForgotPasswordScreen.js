import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import { executeQuery } from '../database/database';
import { getSupabase } from '../services/supabase';

export default function ForgotPasswordScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('RECOVER'); // 'RECOVER' ou 'DISCOVER'
    
    // Aba: Recuperar
    const [email, setEmail] = useState('');
    const [loadingRecover, setLoadingRecover] = useState(false);

    // Aba: Descobrir
    const [searchDoc, setSearchDoc] = useState('');
    const [loadingDiscover, setLoadingDiscover] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState(null);

    const handleRecover = async () => {
        const cleanedEmail = (email || '').trim().replace(/\s/g, '').toLowerCase();
        if (!cleanedEmail) return Alert.alert('Ops', 'Informe seu e-mail de cadastro.');
        
        setLoadingRecover(true);
        try {
            const res = await AuthService.requestPasswordReset(cleanedEmail);
            if (res.success || res.error === undefined) {
                Alert.alert('Sucesso', 'Um código de recuperação de 6 dígitos foi enviado para o seu e-mail.', [
                    { text: 'OK', onPress: () => navigation.navigate('VerifyCode', { identifier: cleanedEmail }) }
                ]);
            } else {
                Alert.alert('Erro', res.message || 'Não foi possível solicitar a recuperação.');
            }
        } catch {
            Alert.alert('Erro', 'Ocorreu uma falha inesperada.');
        } finally {
            setLoadingRecover(false);
        }
    };

    const maskEmailString = (em) => {
        if (!em || !em.includes('@')) return em;
        const [user, domain] = em.split('@');
        if (user.length <= 2) return `${user}****@${domain}`;
        return `${user.substring(0, 2)}****${user.substring(user.length - 1)}@${domain}`;
    };

    const handleDiscover = async () => {
        const cleanedDoc = (searchDoc || '').replace(/\D/g, ''); // Extrair apenas números
        if (!cleanedDoc || cleanedDoc.length < 8) {
            return Alert.alert('Ops', 'Informe um número de telefone com DDD ou CPF válido (apenas números).');
        }

        setLoadingDiscover(true);
        setMaskedEmail(null);
        try {
            // 1. Tentar buscar no SQLite Local
            const localUser = await executeQuery(
                `SELECT email FROM usuarios WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, ' ', ''), '(', ''), ')', ''), '-', '') = ? OR REPLACE(REPLACE(REPLACE(usuario, '.', ''), '-', ''), '/', '') = ?`,
                [cleanedDoc, cleanedDoc]
            );
            
            if (localUser.rows.length > 0 && localUser.rows.item(0).email) {
                setMaskedEmail(maskEmailString(localUser.rows.item(0).email));
                setLoadingDiscover(false);
                return;
            }

            // 2. Tentar buscar no Supabase Remote (RPC ou Match genérico)
            // Assumimos aqui uma tentativa de query básica em profiles pelo telefone ou username como CPF
            const supabase = getSupabase();
            let remoteEmail = null;
            
            try {
                // Como não estamos logados, essa query só funciona se RLS permitir leitura pública (não recomendado)
                // Ou se houver uma edge function. Tentaremos de qualquer forma.
                const { data } = await supabase
                    .from('profiles')
                    .select('email')
                    .or(`phone.eq.${cleanedDoc},username.eq.${cleanedDoc},cpf.eq.${cleanedDoc}`)
                    .maybeSingle();

                if (data && data.email) {
                    remoteEmail = data.email;
                }
            } catch (err) {
                // Ignore remote errors if offline or blocked by RLS
            }

            if (remoteEmail) {
                setMaskedEmail(maskEmailString(remoteEmail));
            } else {
                Alert.alert('Não Encontrado', 'Não encontramos este número de CPF ou WhatsApp em nossos registros ativos. Verifique se os dados estão corretos ou se a conta foi registrada em outro aparelho sem sincronização.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha ao buscar as informações.');
        } finally {
            setLoadingDiscover(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#0F3D2E', '#1F7A55']}
                style={styles.background}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <TouchableOpacity 
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Ionicons name="shield-checkmark" size={60} color="#FFF" />
                        <Text style={styles.title}>Centro de Acesso</Text>
                        <Text style={styles.subtitle}>Recupere sua senha ou descubra qual e-mail você usou no cadastro.</Text>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tabBtn, activeTab === 'RECOVER' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('RECOVER')}
                        >
                            <Text style={[styles.tabText, activeTab === 'RECOVER' && styles.tabTextActive]}>Recuperar Senha</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.tabBtn, activeTab === 'DISCOVER' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('DISCOVER')}
                        >
                            <Text style={[styles.tabText, activeTab === 'DISCOVER' && styles.tabTextActive]}>Descobrir E-mail</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {activeTab === 'RECOVER' ? (
                            <View>
                                <Text style={styles.instructionText}>Digite o e-mail da sua conta para enviarmos um link seguro de redefinição de senha.</Text>
                                
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="seu@email.cadastrado.com"
                                        placeholderTextColor="#95A5A6"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={styles.actionBtn}
                                    onPress={handleRecover}
                                    disabled={loadingRecover}
                                >
                                    {loadingRecover ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.actionBtnText}>ENVIAR LINK DE ACESSO</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.instructionText}>Esqueceu seu e-mail? Digite o seu CPF ou o WhatsApp (apenas números) usado no seu perfil.</Text>

                                <View style={styles.inputWrapper}>
                                    <Ionicons name="search-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: 11999999999 ou 12345678909"
                                        placeholderTextColor="#95A5A6"
                                        value={searchDoc}
                                        onChangeText={setSearchDoc}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={styles.actionBtn}
                                    onPress={handleDiscover}
                                    disabled={loadingDiscover}
                                >
                                    {loadingDiscover ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.actionBtnText}>BUSCAR MEU E-MAIL</Text>
                                    )}
                                </TouchableOpacity>

                                {maskedEmail && (
                                    <View style={styles.resultBox}>
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={styles.resultTitle}>Conta Localizada!</Text>
                                            <Text style={styles.resultEmail}>{maskedEmail}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    scroll: { padding: 24, paddingVertical: 50, minHeight: '100%', justifyContent: 'center' },
    backBtn: { position: 'absolute', top: 50, left: 24, zIndex: 10 },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
    title: { fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 16, letterSpacing: 1 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 4, marginBottom: 20 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: '#FFF' },
    tabText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    tabTextActive: { color: '#1F7A55', fontWeight: 'bold', fontSize: 13 },
    card: { backgroundColor: '#FFF', borderRadius: 25, padding: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
    instructionText: { fontSize: 13, color: '#4B5563', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#1F2937' },
    actionBtn: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        elevation: 4
    },
    actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    resultBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 14,
        padding: 16,
        marginTop: 20
    },
    resultTitle: { fontSize: 12, color: '#065F46', fontWeight: 'bold', textTransform: 'uppercase' },
    resultEmail: { fontSize: 15, color: '#047857', fontWeight: '900', marginTop: 2 }
});
