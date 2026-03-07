import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import PrimaryButton from '../ui/PrimaryButton';
import DangerButton from '../ui/DangerButton';
import { showToast } from '../ui/Toast';

export default function ProfileScreen({ navigation }) {
    const { colors, theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [user, setUser] = useState({
        id: null,
        nome: '',
        usuario: '',
        email: '',
        telefone: '',
        endereco: '',
        nivel: '',
        provider: 'local',
        senha_atual: '',
        nova_senha: '',
        avatar: null
    });

    const loadProfile = async () => {
        setLoading(true);
        try {
            const jsonUser = await AsyncStorage.getItem('user_session');
            if (jsonUser) {
                const session = JSON.parse(jsonUser);
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [session.id]);
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
                        provider: u.provider || 'local',
                        senha_atual: '',
                        nova_senha: '',
                        avatar: u.avatar || null
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadProfile(); }, []));

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user.nova_senha && user.nova_senha.length > 0) {
                if (user.nova_senha.length < 3) {
                    setSaving(false);
                    return Alert.alert('Atenção', 'A nova senha deve ter pelo menos 3 caracteres.');
                }

                const res = await executeQuery('SELECT senha FROM usuarios WHERE id = ?', [user.id]);
                if (res.rows.length > 0) {
                    const hash = res.rows.item(0).senha;
                    let isValid = false;
                    if (hash && hash.startsWith('$2')) {
                        const bcrypt = require('react-native-bcrypt');
                        isValid = bcrypt.compareSync(user.senha_atual, hash);
                    } else {
                        isValid = (hash === user.senha_atual);
                    }
                    if (!isValid) {
                        setSaving(false);
                        return Alert.alert('Acesso Negado', 'A senha atual está incorreta.');
                    }
                }

                await executeQuery(
                    `UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ?, endereco = ?, senha = ?, avatar = ?, last_updated = ? WHERE id = ?`,
                    [user.nome.toUpperCase(), user.email.toLowerCase(), user.telefone, user.endereco.toUpperCase(), user.nova_senha, user.avatar, new Date().toISOString(), user.id]
                );
            } else {
                await executeQuery(
                    `UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ?, endereco = ?, avatar = ?, last_updated = ? WHERE id = ?`,
                    [user.nome.toUpperCase(), user.email.toLowerCase(), user.telefone, user.endereco.toUpperCase(), user.avatar, new Date().toISOString(), user.id]
                );
            }
            showToast('Perfil atualizado com sucesso!');
            setIsEditing(false);
            loadProfile();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar perfil.');
        } finally { setSaving(false); }
    };

    const pickAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setUser({ ...user, avatar: result.assets[0].uri });
        }
    };

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sim, Sair', style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('user_session');
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        ]);
    };

    const InfoRow = ({ label, value, icon, editing, onChange, keyboardType, autoCapitalize, secureTextEntry }) => (
        <View style={styles.infoRowContainer}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
                {editing ? (
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.glassBorder }]}
                        value={value}
                        onChangeText={onChange}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        secureTextEntry={secureTextEntry}
                        placeholderTextColor={colors.placeholder}
                    />
                ) : (
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value || '-'}</Text>
                )}
            </View>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader
                title="Meu Perfil"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={() => isEditing ? setIsEditing(false) : setIsEditing(true)}>
                        <Text style={[styles.editBtnText, { color: colors.primary }]}>
                            {isEditing ? 'CANCELAR' : 'EDITAR'}
                        </Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* HEAD CARD */}
                <View style={styles.headerSection}>
                    <TouchableOpacity onPress={isEditing ? pickAvatar : null} activeOpacity={0.8}>
                        <View style={[styles.avatarWrapper, { borderColor: colors.primary, shadowColor: colors.primary }]}>
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarLetter}>{user.nome?.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            {isEditing && (
                                <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="camera" size={12} color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.nome}</Text>
                    <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
                        <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
                        <Text style={[styles.levelText, { color: colors.primary }]}>
                            {user.nivel === 'ADM' ? 'ADMINISTRADOR' : 'COLABORADOR'}
                        </Text>
                    </View>

                    <View style={styles.planContainer}>
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.planBadge}
                        >
                            <Ionicons name="diamond" size={12} color="#FFF" />
                            <Text style={styles.planText}>PLANO ULTRAPRO</Text>
                        </LinearGradient>
                    </View>
                </View>

                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS DA CONTA</Text>

                    <InfoRow
                        label="NOME COMPLETO"
                        value={user.nome}
                        icon="person-outline"
                        editing={isEditing}
                        onChange={t => setUser({ ...user, nome: t })}
                    />

                    <InfoRow
                        label="E-MAIL PROFISSIONAL"
                        value={user.email}
                        icon="mail-outline"
                        editing={isEditing}
                        onChange={t => setUser({ ...user, email: t })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <InfoRow
                        label="TELEFONE / WHATSAPP"
                        value={user.telefone}
                        icon="call-outline"
                        editing={isEditing}
                        onChange={t => setUser({ ...user, telefone: t })}
                        keyboardType="phone-pad"
                    />

                    <InfoRow
                        label="LOCALIZAÇÃO / FAZENDA"
                        value={user.endereco}
                        icon="location-outline"
                        editing={isEditing}
                        onChange={t => setUser({ ...user, endereco: t })}
                    />
                </GlowCard>

                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>PREFERÊNCIAS VISUAIS</Text>

                    <View style={styles.themeSelectorContainer}>
                        <TouchableOpacity
                            onPress={() => setTheme('light')}
                            style={[styles.themeOption, { borderColor: theme === 'light' ? colors.primary : colors.glassBorder }, theme === 'light' && { backgroundColor: colors.primary + '10' }]}
                        >
                            <Ionicons name="sunny-outline" size={20} color={theme === 'light' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.themeOptionText, { color: theme === 'light' ? colors.primary : colors.textPrimary }]}>CLARO</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTheme('dark')}
                            style={[styles.themeOption, { borderColor: theme === 'dark' ? colors.primary : colors.glassBorder }, theme === 'dark' && { backgroundColor: colors.primary + '10' }]}
                        >
                            <Ionicons name="moon-outline" size={20} color={theme === 'dark' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.themeOptionText, { color: theme === 'dark' ? colors.primary : colors.textPrimary }]}>ESCURO</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTheme('system')}
                            style={[styles.themeOption, { borderColor: theme === 'system' ? colors.primary : colors.glassBorder }, theme === 'system' && { backgroundColor: colors.primary + '10' }]}
                        >
                            <Ionicons name="settings-outline" size={20} color={theme === 'system' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.themeOptionText, { color: theme === 'system' ? colors.primary : colors.textPrimary }]}>SISTEMA</Text>
                        </TouchableOpacity>
                    </View>
                </GlowCard>

                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>ACESSO & SEGURANÇA</Text>

                    <View style={styles.authInfo}>
                        <View>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>USUÁRIO</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.usuario}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>PROVEDOR</Text>
                            <Text style={[styles.infoValue, { color: colors.primary, fontSize: 13, fontWeight: '900' }]}>
                                {user.provider?.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {isEditing && user.provider === 'local' && (
                        <View style={{ marginTop: 25 }}>
                            <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                            <Text style={[styles.passwordHint, { color: colors.warning }]}>
                                PARA ALTERAR A SENHA, PREENCHA OS CAMPOS ABAIXO:
                            </Text>

                            <InfoRow
                                label="SENHA ATUAL"
                                value={user.senha_atual}
                                icon="key-outline"
                                editing={true}
                                secureTextEntry
                                onChange={t => setUser({ ...user, senha_atual: t })}
                            />

                            <InfoRow
                                label="NOVA SENHA"
                                value={user.nova_senha}
                                icon="lock-closed-outline"
                                editing={true}
                                secureTextEntry
                                onChange={t => setUser({ ...user, nova_senha: t })}
                            />
                        </View>
                    )}
                </GlowCard>

                <View style={styles.actionsContainer}>
                    {isEditing ? (
                        <PrimaryButton
                            label={saving ? 'SALVANDO...' : 'CONFIRMAR MUDANÇAS'}
                            icon="checkmark-circle"
                            onPress={handleSave}
                            disabled={saving}
                        />
                    ) : (
                        <DangerButton
                            label="SAIR DA CONTA"
                            icon="log-out-outline"
                            onPress={handleLogout}
                        />
                    )}
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>AgroGB Mobile v8.5 • Secure Access</Text>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 60 },
    headerSection: { alignItems: 'center', marginBottom: 25 },
    avatarWrapper: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        padding: 4,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { fontSize: 44, fontWeight: '900', color: '#FFF' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 5, width: 28, height: 28, borderRadius: 14, borderSize: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    userName: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
    levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    levelText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    planContainer: { marginTop: 15 },
    planBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    planText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    card: { padding: 22, borderRadius: 28, borderWidth: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },

    infoRowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    infoValue: { fontSize: 15, fontWeight: '600' },
    input: { fontSize: 15, fontWeight: '600', borderBottomWidth: 1, paddingVertical: 4 },

    authInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    divider: { height: 1, marginVertical: 20 },
    passwordHint: { fontSize: 10, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

    actionsContainer: { marginTop: 30, gap: 15 },
    editBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    versionText: { fontSize: 10, textAlign: 'center', marginTop: 5, fontWeight: 'bold' },

    themeSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
    themeOptionText: { fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 0.5 }
});
