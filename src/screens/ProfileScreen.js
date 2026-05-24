import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { theme } = useTheme();
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
        } catch (e) { } finally { setLoading(false); }
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
                        const bcrypt = require('bcryptjs');
                        isValid = bcrypt.compareSync(user.senha_atual, hash);
                    } else {
                        isValid = (hash === user.senha_atual);
                    }
                    if (!isValid) {
                        setSaving(false);
                        return Alert.alert('Senha Incorreta', 'A senha atual não confere.');
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
            Alert.alert('Sucesso', 'Perfil atualizado!');
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
        Alert.alert('Sair', 'Deseja realmente sair da conta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair Agora', style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('user_session');
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        ]);
    };

    const isAdmin = user.nivel === 'ADM';

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#064E3B']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Ionicons name={isEditing ? "close-circle" : "create-outline"} size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={isEditing ? pickAvatar : null} style={styles.avatarWrapper} activeOpacity={0.8}>
                    <View style={styles.avatarBorder}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: (theme?.colors?.primary || '#10B981') + '30' }]}>
                                <Text style={[styles.avatarChar, { color: '#FFF' }]}>{user.nome?.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    {isEditing && (
                        <View style={[styles.cameraBadge, { backgroundColor: theme?.colors?.primary || '#10B981' }]}>
                            <Ionicons name="camera" size={14} color="#FFF" />
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.userName}>{user.nome || user.usuario}</Text>
                <View style={[styles.levelBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <MaterialCommunityIcons name={isAdmin ? "shield-check" : "account-outline"} size={14} color="#FFF" />
                    <Text style={styles.levelText}>{isAdmin ? 'ADMINISTRADOR' : 'COLABORADOR'}</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Card style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>DADOS DA CONTA</Text>
                        <Ionicons name="person-outline" size={16} color={theme?.colors?.primary} />
                    </View>

                    {isEditing ? (
                        <View>
                            <AgroInput label="NOME COMPLETO" value={user.nome} onChangeText={t => setUser({ ...user, nome: t })} />
                            <AgroInput label="E-MAIL" value={user.email} onChangeText={t => setUser({ ...user, email: t })} keyboardType="email-address" autoCapitalize="none" />
                            <AgroInput label="TELEFONE" value={user.telefone} onChangeText={t => setUser({ ...user, telefone: t })} keyboardType="phone-pad" />
                            <AgroInput label="ENDEREÇO / LOCALIDADE" value={user.endereco} onChangeText={t => setUser({ ...user, endereco: t })} />
                        </View>
                    ) : (
                        <View>
                            <InfoRow label="NOME" value={user.nome} icon="chevron-forward-outline" />
                            <InfoRow label="E-MAIL" value={user.email || 'Não informado'} icon="mail-outline" />
                            <InfoRow label="TELEFONE" value={user.telefone || 'Não informado'} icon="call-outline" />
                            <InfoRow label="LOCAL" value={user.endereco || 'Não informado'} icon="location-outline" />
                        </View>
                    )}
                </Card>

                {isEditing && user.provider === 'local' && (
                    <Card style={styles.infoCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: '#D97706' }]}>SEGURANÇA (ALTERAR SENHA)</Text>
                            <Ionicons name="key-outline" size={16} color="#D97706" />
                        </View>
                        <AgroInput label="SENHA ATUAL" value={user.senha_atual} onChangeText={t => setUser({ ...user, senha_atual: t })} secureTextEntry />
                        <AgroInput label="NOVA SENHA" value={user.nova_senha} onChangeText={t => setUser({ ...user, nova_senha: t })} secureTextEntry placeholder="Mínimo 3 caracteres" />
                    </Card>
                )}

                <Card style={styles.infoCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SISTEMA</Text>
                        <Ionicons name="settings-outline" size={16} color={theme?.colors?.primary} />
                    </View>
                    <InfoRow label="USUÁRIO" value={user.usuario} icon="at-outline" />
                    <InfoRow label="PROVEDOR" value={user.provider === 'google' ? 'Google Account' : 'Database Local'} icon="cloud-outline" />
                </Card>

                {isEditing && (
                    <AgroButton 
                        title={saving ? "SALVANDO..." : "CONFIRMAR ALTERAÇÕES"} 
                        onPress={handleSave} 
                        disabled={saving}
                        style={{ marginTop: 10 }}
                    />
                )}

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Encerrar Sessão</Text>
                    </TouchableOpacity>
                    <Text style={styles.version}>AgroGB v6.2.0 • Premium Edition</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
        <Ionicons name={icon} size={16} color="#D1D5DB" />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
    avatarWrapper: { width: 100, height: 100, marginBottom: 15 },
    avatarBorder: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', padding: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 50 },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarChar: { fontSize: 40, fontWeight: '900' },
    cameraBadge: { position: 'absolute', bottom: 5, right: 5, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    userName: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8, gap: 5 },
    levelText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    body: { flex: 1, padding: 20, marginTop: -20 },
    infoCard: { marginBottom: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    footer: { marginTop: 20, alignItems: 'center' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15, backgroundColor: '#FEF2F2', borderRadius: 15, width: '100%', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { color: '#EF4444', fontWeight: '900', fontSize: 14 },
    version: { fontSize: 10, color: '#D1D5DB', fontWeight: 'bold', marginTop: 20 }
});
