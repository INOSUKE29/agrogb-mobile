import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import AgroButton from '../components/common/AgroButton';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#059669' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    role: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1, marginTop: 5 },

    badge: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

    body: { flex: 1, padding: 20, marginTop: -30 },
    section: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, elevation: 3, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },

    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    editText: { fontSize: 12, fontWeight: 'bold', color: '#059669' },

    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
    value: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937' },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },

    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    version: { textAlign: 'center', marginTop: 30, color: '#D1D5DB', fontSize: 10, fontWeight: 'bold' }
});

export default function ProfileScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // User Data State
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
                // Force reload from DB to be sure
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [session.id]);
                if (res.rows.length > 0) {
                    const u = res.rows.item(0);
                    setUser({
                        id: u.id,
                        nome: u.nome_completo || u.usuario, // Fallback
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
        } catch (e) { console.error(e); } finally { setLoading(false); }
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

                // Verificar senha atual primeiro
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
                        return Alert.alert('Acesso Negado', 'A senha atual está incorreta. Não é possível alterar a senha.');
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
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            setIsEditing(false);
            // Reload to sync state perfectly
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
        Alert.alert('Sair', 'Deseja realmente sair?', [
            { text: 'Cancelar' },
            {
                text: 'Sair', style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('user_session');
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        ]);
    };

    const canEdit = user.nivel === 'ADM';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064E3B', '#059669']} style={styles.header}>
                <TouchableOpacity onPress={isEditing ? pickAvatar : null} style={styles.avatarContainer} activeOpacity={isEditing ? 0.7 : 1}>
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                    ) : (
                        <Text style={styles.avatarText}>{user.nome?.charAt(0).toUpperCase()}</Text>
                    )}
                    {isEditing && (
                        <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#059669', borderRadius: 15, padding: 6, borderWidth: 2, borderColor: '#FFF' }}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={styles.name}>{user.nome}</Text>
                <Text style={styles.role}>{user.nivel === 'ADM' ? 'ADMINISTRADOR' : 'COLABORADOR'}</Text>

                <View style={styles.badge}>
                    <Ionicons name="diamond" size={12} color="#A7F3D0" />
                    <Text style={styles.badgeText}>PLANO ULTRAPRO</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.body}>
                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
                        {canEdit && !isEditing && (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Ionicons name="pencil" size={14} color="#059669" />
                                <Text style={styles.editText}>EDITAR PERFIL</Text>
                            </TouchableOpacity>
                        )}
                        {isEditing && (
                            <TouchableOpacity style={styles.editBtn} onPress={() => { setIsEditing(false); loadProfile(); }}>
                                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                                <Text style={[styles.editText, { color: '#EF4444' }]}>CANCELAR</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>NOME COMPLETO</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={user.nome}
                                onChangeText={t => setUser({ ...user, nome: t })}
                            />
                        ) : (
                            <Text style={styles.value}>{user.nome || '-'}</Text>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={styles.label}>NÍVEL DE ACESSO</Text>
                            <Text style={styles.value}>{user.nivel}</Text>
                        </View>
                    </View>
                </View>

                {/* SEÇÃO 2: CONTATO E LOCALIZAÇÃO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>CONTATO E LOCAL</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>E-MAIL PROFISSIONAL</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={user.email}
                                onChangeText={t => setUser({ ...user, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        ) : (
                            <Text style={styles.value}>{user.email || 'Não informado'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={user.telefone}
                                onChangeText={t => setUser({ ...user, telefone: t })}
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.value}>{user.telefone || 'Não informado'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>LOCALIZAÇÃO / FAZENDA</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={user.endereco}
                                onChangeText={t => setUser({ ...user, endereco: t })}
                            />
                        ) : (
                            <Text style={styles.value}>{user.endereco || 'Não informada'}</Text>
                        )}
                    </View>
                </View>

                {/* SEÇÃO 3: SEGURANÇA DA CONTA */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SEGURANÇA DA CONTA</Text>
                        <Ionicons name="shield-checkmark" size={18} color="#059669" />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View>
                            <Text style={styles.label}>USUÁRIO DE LOGIN</Text>
                            <Text style={styles.value}>{user.usuario}</Text>
                        </View>
                        <View>
                            <Text style={[styles.label, { textAlign: 'right' }]}>AUTENTICAÇÃO VIA</Text>
                            <Text style={[styles.value, { textAlign: 'right', fontSize: 14 }]}>
                                {user.provider === 'google' ? 'GOOGLE' : 'SENHA LOCAL'}
                            </Text>
                        </View>
                    </View>

                    {isEditing && user.provider === 'local' && (
                        <View>
                            <View style={styles.divider} />
                            <Text style={[styles.label, { color: '#B45309', marginBottom: 15 }]}>
                                <Ionicons name="key" size={12} /> ALTERAR SENHA (OPCIONAL)
                            </Text>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>SENHA ATUAL</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Necessário para alterar"
                                    secureTextEntry
                                    value={user.senha_atual}
                                    onChangeText={t => setUser({ ...user, senha_atual: t })}
                                />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>NOVA SENHA</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Deixe em branco p/ não alterar"
                                    secureTextEntry
                                    value={user.nova_senha}
                                    onChangeText={t => setUser({ ...user, nova_senha: t })}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* BOTÃO SALVAR GLOBAL */}
                {isEditing && (
                    <TouchableOpacity style={[styles.saveBtn, { marginBottom: 20 }]} onPress={handleSave} disabled={saving}>
                        <Ionicons name="save" size={20} color="#FFF" style={{ marginBottom: 4 }} />
                        <Text style={styles.saveText}>{saving ? 'VALIDANDO DADOS...' : 'CONFIRMAR E SALVAR'}</Text>
                    </TouchableOpacity>
                )}

                <View style={{ marginTop: 10, paddingBottom: 50 }}>
                    <AgroButton
                        title="SAIR DO APLICATIVO"
                        onPress={handleLogout}
                        variant="danger"
                        style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
                        textStyle={{ color: '#DC2626' }}
                    />
                    <Text style={styles.version}>AgroGB Mobile v6.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}
