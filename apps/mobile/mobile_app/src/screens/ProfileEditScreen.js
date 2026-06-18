import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../components/ui/AppContainer';
import ScreenHeader from '../components/ui/ScreenHeader';
import { showToast } from '../components/ui/Toast';
import { AuthService } from '../services/authService';
import { executeQuery } from '../database/database';

export default function ProfileEditScreen({ navigation }) {
    const { colors, theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({
        id: null,
        nome: '',
        usuario: '',
        email: '',
        telefone: '',
        endereco: '',
        nivel: '',
        avatar: null,
        nova_senha: ''
    });

    const loadProfile = async () => {
        try {
            const session = await AuthService.checkSession();
            if (session) {
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ? OR uuid = ?', [session.userId, session.userId]);
                if (res.rows.length > 0) {
                    const u = res.rows.item(0);
                    setUser({
                        id: u.id,
                        nome: u.nome_completo || u.usuario,
                        usuario: u.usuario,
                        email: u.email || '',
                        telefone: u.telefone || '',
                        endereco: u.endereco || '',
                        nivel: u.nivel || 'USUARIO',
                        avatar: u.avatar || null,
                        nova_senha: ''
                    });
                }
            }
        } catch (e) {
            console.error('[ProfileEdit] Erro:', e);
        }
    };

    useFocusEffect(useCallback(() => { loadProfile(); }, []));

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('PermissÃ£o', 'Acesso Ã  galeria Ã© necessÃ¡rio para mudar a foto.');

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setUser(prev => ({ ...prev, avatar: result.assets[0].uri }));
        }
    };

    const handleSave = async () => {
        if (!user.nome || user.nome.length < 3) return Alert.alert('Aviso', 'Nome muito curto.');
        
        setLoading(true);
        try {
            const now = new Date().toISOString();
            if (user.nova_senha) {
                await executeQuery(
                    `UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ?, endereco = ?, senha = ?, avatar = ?, last_updated = ? WHERE id = ?`,
                    [user.nome.toUpperCase(), user.email.toLowerCase(), user.telefone, user.endereco.toUpperCase(), user.nova_senha, user.avatar, now, user.id]
                );
            } else {
                await executeQuery(
                    `UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ?, endereco = ?, avatar = ?, last_updated = ? WHERE id = ?`,
                    [user.nome.toUpperCase(), user.email.toLowerCase(), user.telefone, user.endereco.toUpperCase(), user.avatar, now, user.id]
                );
            }
            showToast('Perfil atualizado com sucesso!');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Erro', 'NÃ£o foi possÃ­vel salvar as alteraÃ§Ãµes.');
        } finally {
            setLoading(false);
        }
    };

    const InputBlock = ({ label, icon, value, onChange, placeholder, keyboardType, secureTextEntry, autoCapitalize = "words" }) => (
        <View style={styles.inputBlock}>
            <View style={styles.inputLabelRow}>
                <Ionicons name={icon} size={14} color="#10B981" />
                <Text style={styles.inputLabel}>{label}</Text>
            </View>
            <TextInput 
                style={styles.textInput} 
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.1)"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                selectionColor="#10B981"
            />
        </View>
    );

    const SectionCard = ({ title, children, style }) => (
        <View style={[styles.sectionCard, style]}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    return (
        <AppContainer>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* Background Color Solid #050914 as seen in mockup */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050914' }]} />
            
            <ScreenHeader title="Minha Conta" onBack={() => navigation.goBack()} transparent />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    
                    {/* AVATAR CENTERED (Fiel ao Mockup Image 1) */}
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
                            <View style={styles.avatarBox}>
                                {user.avatar ? (
                                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarLetter}>{user.nome?.charAt(0).toUpperCase() || 'P'}</Text>
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    <Ionicons name="camera" size={12} color="#FFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.roleText}>
                            {user.nivel === 'ADM' ? 'GESTOR MASTER' : 'COLABORADOR'}
                        </Text>
                    </View>

                    {/* DADOS DE CONTATO */}
                    <SectionCard title="INFORMAÃ‡Ã•ES DE CONTATO">
                        <InputBlock 
                            label="NOME COMPLETO" icon="person-outline"
                            value={user.nome} onChange={v => setUser({ ...user, nome: v })}
                        />
                        <InputBlock 
                            label="TELEFONE" icon="call-outline"
                            value={user.telefone} onChange={v => setUser({ ...user, telefone: v })}
                            keyboardType="phone-pad"
                        />
                        <InputBlock 
                            label="ENDEREÃ‡O / BASE" icon="location-outline"
                            value={user.endereco} onChange={v => setUser({ ...user, endereco: v })}
                        />
                    </SectionCard>

                    {/* SEGURANÃ‡A */}
                    <SectionCard title="SEGURANÃ‡A" style={{ marginTop: 16 }}>
                        <InputBlock 
                            label="NOVA SENHA" icon="lock-closed-outline"
                            value={user.nova_senha} onChange={v => setUser({ ...user, nova_senha: v })}
                            placeholder="Deixe em branco para manter"
                            secureTextEntry={true} autoCapitalize="none"
                        />
                        <Text style={styles.infoNote}>
                            A senha deve ser mantida em sigilo. Se alterar, sua sessÃ£o serÃ¡ mantida no aparelho local.
                        </Text>
                    </SectionCard>

                    {/* APARÃŠNCIA */}
                    <SectionCard title="APARÃŠNCIA DO APLICATIVO" style={{ marginTop: 16 }}>
                        <View style={styles.appearanceGrid}>
                            {[
                                { id: 'system', label: 'Auto', icon: 'settings-outline' },
                                { id: 'light', label: 'Claro', icon: 'sunny-outline' },
                                { id: 'dark', label: 'Escuro', icon: 'moon-outline' },
                            ].map(t => (
                                <TouchableOpacity 
                                    key={t.id}
                                    style={[
                                        styles.themeBtn, 
                                        theme === t.id && styles.themeBtnActive
                                    ]}
                                    onPress={() => setTheme(t.id)}
                                >
                                    <View style={[
                                        styles.themeIconBox,
                                        theme === t.id ? { backgroundColor: '#042F2E' } : { backgroundColor: 'transparent' }
                                    ]}>
                                        <Ionicons 
                                            name={t.icon} 
                                            size={20} 
                                            color={theme === t.id ? '#10B981' : 'rgba(255,255,255,0.3)'} 
                                        />
                                    </View>
                                    <Text style={[
                                        styles.themeBtnText, 
                                        theme === t.id && { color: '#FFF' }
                                    ]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SectionCard>

                    {/* SAVE BUTTON (Fiel ao Mockup Image 2) */}
                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <View style={styles.saveSolid}>
                            <Text style={styles.saveBtnText}>
                                {loading ? 'AGUARDE...' : 'SALVAR ALTERAÃ‡Ã•ES'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 60 },
    
    avatarContainer: { alignItems: 'center', marginBottom: 28, marginTop: 10 },
    avatarWrapper: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'transparent',
        borderWidth: 1, borderColor: '#0f4c39', // Dark greenish border
        justifyContent: 'center', alignItems: 'center',
    },
    avatarBox: { 
        width: 86, height: 86, borderRadius: 43, 
        overflow: 'hidden', backgroundColor: '#0B111A' 
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { 
        width: '100%', height: '100%', 
        justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#0B111A' 
    },
    avatarLetter: { color: '#10B981', fontSize: 36, fontWeight: '900' },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#050914'
    },
    roleText: { 
        color: '#10B981', fontSize: 11, fontWeight: '900', 
        letterSpacing: 2, marginTop: 18 
    },

    sectionCard: {
        borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)',
        backgroundColor: '#0A0F1C', 
    },
    sectionTitle: { color: '#10B981', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20 },
    
    inputBlock: { marginBottom: 18 },
    inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    textInput: {
        height: 54, borderRadius: 12, backgroundColor: '#03050B', // Very dark deep blue
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)',
        paddingHorizontal: 16, color: '#FFF', fontSize: 15, fontWeight: '600'
    },
    infoNote: { color: '#475569', fontSize: 11, marginTop: 4, lineHeight: 16 },

    appearanceGrid: { flexDirection: 'row', gap: 12 },
    themeBtn: {
        flex: 1, height: 86, borderRadius: 18,
        backgroundColor: '#0A0F1C', 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    themeBtnActive: { 
        backgroundColor: '#061A15', // Dark deep emerald tint
        borderColor: '#10B981',
        borderWidth: 1.5
    },
    themeIconBox: { 
        width: 32, height: 32, borderRadius: 8, 
        justifyContent: 'center', alignItems: 'center' 
    },
    themeBtnText: { color: '#64748B', fontSize: 12, fontWeight: '700' },

    saveBtn: { 
        marginTop: 24, borderRadius: 16, overflow: 'hidden'
    },
    saveSolid: { 
        height: 56, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#10B981'
    },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 }
});

