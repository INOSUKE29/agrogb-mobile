import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, KeyboardAvoidingView, Platform, Alert, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '../services/supabase';
import { executeQuery } from '../database/database';
import { useAuth } from '../context/AuthContext';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';
import Card from '../components/common/Card';
import FriendlyModal from '../components/common/FriendlyModal';

const { width } = Dimensions.get('window');
const RURAL_BG = require('../../assets/farm_bg.png');

export default function OnboardingProfileScreen({ navigation }) {
    const { login } = useAuth();
    const [step, setStep] = useState(1); // 1 = Escolha, 2 = Formulário
    const [role, setRole] = useState(''); // 'CLIENTE' ou 'AGRONOMO'
    const [loading, setLoading] = useState(false);
    
    // Formulário Cliente
    const [clientForm, setClientForm] = useState({
        nomeCompleto: '',
        cpfCnpj: '',
        nomeFazenda: '',
        cidadeUf: ''
    });

    // Formulário Agrônomo
    const [agroForm, setAgroForm] = useState({
        nomeCompleto: '',
        cpf: '',
        crea: '',
        telefone: ''
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        emoji: '🧐',
        title: 'Atenção',
        message: '',
        buttonText: 'Entendi 👍'
    });

    const showAlert = (emoji, title, message) => {
        setAlertConfig({
            visible: true,
            emoji,
            title,
            message,
            buttonText: 'Entendi 👍'
        });
    };

    const handleSelectRole = (selectedRole) => {
        setRole(selectedRole);
        setStep(2);
    };

    const handleFinishOnboarding = async () => {
        const currentForm = role === 'CLIENTE' ? clientForm : agroForm;
        
        // Validação simples
        if (!currentForm.nomeCompleto || currentForm.nomeCompleto.trim().length < 3) {
            showAlert('✍️', 'Nome Obrigatório', 'Por favor, insira o seu nome completo com pelo menos 3 letras. 😉');
            return;
        }

        if (role === 'CLIENTE') {
            if (!clientForm.cpfCnpj) {
                showAlert('✍️', 'CPF/CNPJ', 'Por favor, insira o seu CPF ou CNPJ para registro da propriedade.');
                return;
            }
            if (!clientForm.nomeFazenda) {
                showAlert('✍️', 'Fazenda', 'Por favor, dê um nome bem bonito para a sua propriedade rústica!');
                return;
            }
        } else {
            if (!agroForm.crea) {
                showAlert('✍️', 'Registro CREA', 'O número do seu CREA profissional é indispensável para validação técnica.');
                return;
            }
            if (!agroForm.telefone) {
                showAlert('✍️', 'WhatsApp / Contato', 'Precisamos do seu telefone para que os produtores possam contatá-lo.');
                return;
            }
        }

        setLoading(true);
        try {
            const supabase = getSupabase();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Sessão expirada. Faça login novamente.');

            const finalNome = currentForm.nomeCompleto.trim().toUpperCase();
            const finalUsername = user.email.split('@')[0];

            // 1. Atualizar Tabela profiles remota
            const profilePayload = {
                id: user.id,
                nome_completo: finalNome,
                role: role,
                username: finalUsername,
                email: user.email,
                updated_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase.from('profiles').upsert([profilePayload]);
            if (profileError) throw profileError;

            // 2. Se for Agrônomo, salvar o CREA/Código na tabela agronomist_codes ou metadados
            if (role === 'AGRONOMO') {
                const { error: codeError } = await supabase.from('agronomist_codes').upsert([{
                    agronomist_id: user.id,
                    code: agroForm.crea,
                    is_active: 1,
                    last_updated: new Date().toISOString()
                }]);
                if (codeError) console.log('Erro ao salvar código de agrônomo remoto:', codeError);
            }

            // 3. Atualizar localmente no SQLite
            const userPayload = {
                uuid: user.id,
                usuario: finalUsername,
                senha: '', // Mantém em branco no update local de onboarding
                nivel: role === 'AGRONOMO' ? 'AGRONOMO' : 'USUARIO',
                role: role,
                nome_completo: finalNome,
                email: user.email,
                telefone: role === 'AGRONOMO' ? agroForm.telefone : '',
                endereco: role === 'CLIENTE' ? clientForm.nomeFazenda : ''
            };

            await executeQuery(
                `UPDATE usuarios SET nivel = ?, role = ?, nome_completo = ?, telefone = ?, endereco = ?, last_updated = ? WHERE uuid = ?`,
                [userPayload.nivel, userPayload.role, userPayload.nome_completo, userPayload.telefone, userPayload.endereco, new Date().toISOString(), userPayload.uuid]
            );

            // 4. Salvar sessão local ativa
            const sessionData = {
                id: user.id, // ID temporário ou recuperado
                usuario: finalUsername,
                nome: finalNome,
                nivel: userPayload.nivel,
                role: role,
                timestamp: new Date().getTime()
            };

            await login(sessionData);

            showAlert('🎉', 'Tudo Pronto!', 'Seu cadastro de perfil foi concluído com absoluto sucesso! Bem-vindo ao ecossistema do AgroGB. 🍓');
        } catch (error) {
            console.log('Erro no onboarding:', error);
            showAlert('🧐', 'Falha Técnica', 'Ocorreu um erro ao salvar o seu perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>BEM-VINDO AO AGROGB</Text>
                        <Text style={styles.subtitle}>Vamos configurar o seu perfil técnico ou produtivo.</Text>
                    </View>

                    {step === 1 ? (
                        <View style={styles.cardsContainer}>
                            <Text style={styles.sectionTitle}>QUEM É VOCÊ NO CAMPO? 🤔</Text>
                            
                            <TouchableOpacity 
                                activeOpacity={0.85}
                                style={styles.roleCard}
                                onPress={() => handleSelectRole('CLIENTE')}
                            >
                                <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(240,253,244,0.95)']} style={styles.cardGradient}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={styles.cardEmoji}>🧑‍🌾</Text>
                                        <Ionicons name="chevron-forward-circle-outline" size={24} color="#10B981" />
                                    </View>
                                    <Text style={styles.cardTitle}>PRODUTOR / CLIENTE</Text>
                                    <Text style={styles.cardDesc}>Gerencie sua propriedade rural, acompanhe estoques, faça lançamentos financeiros rápidos e envie notas técnicas ao seu caderno de campo.</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                activeOpacity={0.85}
                                style={styles.roleCard}
                                onPress={() => handleSelectRole('AGRONOMO')}
                            >
                                <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(239,246,255,0.95)']} style={styles.cardGradient}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={styles.cardEmoji}>🎓</Text>
                                        <Ionicons name="chevron-forward-circle-outline" size={24} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.cardTitle}>AGRÔNOMO / CONSULTOR</Text>
                                    <Text style={styles.cardDesc}>Crie planos de nutrição NPK personalizados para seus clientes rurais, prescreva dosagens via WhatsApp e controle laudos e diagnósticos de lavouras.</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Card style={styles.formCard}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                <Ionicons name="arrow-back" size={20} color="#10B981" />
                                <Text style={styles.backBtnText}>Voltar e trocar tipo</Text>
                            </TouchableOpacity>

                            <View style={styles.formTitleRow}>
                                <Ionicons name={role === 'CLIENTE' ? "leaf" : "ribbon"} size={22} color="#10B981" />
                                <Text style={styles.formTitle}>
                                    {role === 'CLIENTE' ? 'CADASTRO DE PRODUTOR' : 'CADASTRO DE AGRÔNOMO'}
                                </Text>
                            </View>

                            {role === 'CLIENTE' ? (
                                <View>
                                    <AgroInput 
                                        label="NOME COMPLETO DO PRODUTOR"
                                        placeholder="Ex: Bruno Pedro"
                                        value={clientForm.nomeCompleto}
                                        onChangeText={t => setClientForm({ ...clientForm, nomeCompleto: t })}
                                        icon="person-outline"
                                    />
                                    <AgroInput 
                                        label="CPF OU CNPJ DO TITULAR"
                                        placeholder="Digite apenas os números"
                                        value={clientForm.cpfCnpj}
                                        onChangeText={t => setClientForm({ ...clientForm, cpfCnpj: t })}
                                        keyboardType="numeric"
                                        icon="document-text-outline"
                                    />
                                    <AgroInput 
                                        label="NOME DA PROPRIEDADE (FAZENDA)"
                                        placeholder="Ex: Sítio Agro Morango"
                                        value={clientForm.nomeFazenda}
                                        onChangeText={t => setClientForm({ ...clientForm, nomeFazenda: t })}
                                        icon="home-outline"
                                    />
                                    <AgroInput 
                                        label="CIDADE E ESTADO (UF)"
                                        placeholder="Ex: Campinas / SP"
                                        value={clientForm.cidadeUf}
                                        onChangeText={t => setClientForm({ ...clientForm, cidadeUf: t })}
                                        icon="map-outline"
                                    />
                                </View>
                            ) : (
                                <View>
                                    <AgroInput 
                                        label="NOME COMPLETO DO PROFISSIONAL"
                                        placeholder="Ex: Engenheiro Agrônomo João"
                                        value={agroForm.nomeCompleto}
                                        onChangeText={t => setAgroForm({ ...agroForm, nomeCompleto: t })}
                                        icon="person-outline"
                                    />
                                    <AgroInput 
                                        label="CPF DO AGRÔNOMO"
                                        placeholder="Digite apenas os números"
                                        value={agroForm.cpf}
                                        onChangeText={t => setAgroForm({ ...agroForm, cpf: t })}
                                        keyboardType="numeric"
                                        icon="document-text-outline"
                                    />
                                    <AgroInput 
                                        label="CARTEIRA PROFISSIONAL / CREA"
                                        placeholder="Ex: CREA 12345-D / SP"
                                        value={agroForm.crea}
                                        onChangeText={t => setAgroForm({ ...agroForm, crea: t })}
                                        icon="medal-outline"
                                    />
                                    <AgroInput 
                                        label="WHATSAPP / TELEFONE DE SUPORTE"
                                        placeholder="Ex: (11) 99999-9999"
                                        value={agroForm.telefone}
                                        onChangeText={t => setAgroForm({ ...agroForm, telefone: t })}
                                        keyboardType="phone-pad"
                                        icon="logo-whatsapp"
                                    />
                                </View>
                            )}

                            <AgroButton 
                                title="CONCLUIR MEU CADASTRO 🌾"
                                onPress={handleFinishOnboarding}
                                loading={loading}
                            />
                        </Card>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            <FriendlyModal
                visible={alertConfig.visible}
                emoji={alertConfig.emoji}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                onClose={() => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.emoji === '🎉') {
                        navigation.replace('Home');
                    }
                }}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,31,53,0.75)' },
    inner: { flex: 1 },
    scroll: { padding: 20, paddingTop: 60, paddingBottom: 60 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 2, textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#D1FAE5', textAlign: 'center', marginTop: 8, opacity: 0.9, paddingHorizontal: 20 },
    cardsContainer: { gap: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#10B981', letterSpacing: 1.5, alignSelf: 'center', marginBottom: 5 },
    roleCard: { borderRadius: 25, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardGradient: { padding: 25 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardEmoji: { fontSize: 36 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#0B1F35', letterSpacing: 0.5 },
    cardDesc: { fontSize: 12, color: '#4B5563', marginTop: 10, lineHeight: 18 },
    formCard: { padding: 25, borderRadius: 30, elevation: 12 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backBtnText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    formTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 25 },
    formTitle: { fontSize: 14, fontWeight: '900', color: '#0B1F35', letterSpacing: 1 }
});
