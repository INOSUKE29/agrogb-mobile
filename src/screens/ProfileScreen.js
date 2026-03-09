import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        } catch { }
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
            showToast('Perfil atualizado!');
            setIsEditing(false);
            loadProfile();
        } catch {
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
        if (!result.canceled) { setUser({ ...user, avatar: result.assets[0].uri }); }
    };

    const handleLogout = async () => {
        Alert.alert('Sair', 'Deseja realmente sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sim, Sair', onPress: async () => { await AsyncStorage.removeItem('user_session'); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }
        ]);
    };

    const InfoRow = ({ label, value, icon, editing, onChange, keyboardType, autoCapitalize, secureTextEntry }) => (
        <View style={styles.infoRowContainer}>
            <View style={[styles.iconBox, { backgroundColor: (colors.primary) + '10' }]}><Ionicons name={icon} size={18} color={colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
                {editing ? <TextInput style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.glassBorder }]} value={value} onChangeText={onChange} keyboardType={keyboardType} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry} placeholderTextColor={colors.placeholder} /> : <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value || '-'}</Text>}
            </View>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Meu Perfil" onBack={() => navigation.goBack()} rightElement={<TouchableOpacity onPress={() => setIsEditing(!isEditing)}><Text style={[styles.editBtnText, { color: colors.primary }]}>{isEditing ? 'CANCELAR' : 'EDITAR'}</Text></TouchableOpacity>} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <TouchableOpacity onPress={isEditing ? pickAvatar : null} activeOpacity={0.8}>
                        <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
                            {user.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatarImage} /> : <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}><Text style={styles.avatarLetter}>{user.nome?.charAt(0).toUpperCase()}</Text></View>}
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.nome}</Text>
                    <View style={[styles.levelBadge, { backgroundColor: (colors.primary) + '20' }]}><MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} /><Text style={[styles.levelText, { color: colors.primary }]}>{user.nivel === 'ADM' ? 'ADMINISTRADOR' : 'COLABORADOR'}</Text></View>
                    <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.planBadge}><Ionicons name="diamond" size={12} color="#FFF" /><Text style={styles.planText}>PLANO ULTRAPRO</Text></LinearGradient>
                </View>
                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS DA CONTA</Text>
                    <InfoRow label="NOME COMPLETO" value={user.nome} icon="person-outline" editing={isEditing} onChange={t => setUser({ ...user, nome: t })} />
                    <InfoRow label="E-MAIL" value={user.email} icon="mail-outline" editing={isEditing} onChange={t => setUser({ ...user, email: t })} keyboardType="email-address" />
                </GlowCard>
                <GlowCard style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>TEMA</Text>
                    <View style={styles.themeSelectorContainer}>
                        <TouchableOpacity onPress={() => setTheme('light')} style={[styles.themeOption, theme === 'light' && { backgroundColor: colors.primary + '10' }]}><Text style={{ color: colors.textPrimary }}>CLARO</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeOption, theme === 'dark' && { backgroundColor: colors.primary + '10' }]}><Text style={{ color: colors.textPrimary }}>ESCURO</Text></TouchableOpacity>
                    </View>
                </GlowCard>
                <View style={styles.actionsContainer}>
                    {isEditing ? <PrimaryButton title={saving ? 'SALVANDO...' : 'CONFIRMAR'} onPress={handleSave} /> : <DangerButton label="SAIR DA CONTA" onPress={handleLogout} />}
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 60 },
    headerSection: { alignItems: 'center', marginBottom: 25 },
    avatarWrapper: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, padding: 2, marginBottom: 10 },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { fontSize: 40, fontWeight: 'bold', color: '#FFF' },
    userName: { fontSize: 20, fontWeight: 'bold' },
    levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5, borderRadius: 10 },
    levelText: { fontSize: 10, fontWeight: 'bold' },
    planBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 10, borderRadius: 20, marginTop: 10 },
    planText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    card: { padding: 20, borderRadius: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
    infoRowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 10, fontWeight: 'bold' },
    infoValue: { fontSize: 14 },
    input: { borderBottomWidth: 1, padding: 2 },
    themeSelectorContainer: { flexDirection: 'row', gap: 10 },
    themeOption: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    actionsContainer: { marginTop: 20 },
    editBtnText: { fontWeight: 'bold' }
});
