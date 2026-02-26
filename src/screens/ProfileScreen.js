import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { COLORS } from '../styles/theme'; // NEW THEME
import { AppButton } from '../ui/components/AppButton';
import { AppInput } from '../ui/components/AppInput';

export default function ProfileScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // User Data State
    const [user, setUser] = useState({
        id: null,
        nome: '',
        usuario: '',
        telefone: '',
        endereco: '',
        nivel: '',
        provider: 'local'
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
                        telefone: u.telefone || '',
                        endereco: u.endereco || '',
                        nivel: u.nivel || 'USUARIO',
                        provider: u.provider || 'local'
                    });
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadProfile(); }, []));

    const handleSave = async () => {
        if (!user.nome || user.nome.trim() === '') {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        setSaving(true);
        try {
            await executeQuery(
                `UPDATE usuarios SET nome_completo = ?, telefone = ?, endereco = ?, last_updated = ? WHERE id = ?`,
                [user.nome.toUpperCase(), user.telefone, user.endereco?.toUpperCase() || '', new Date().toISOString(), user.id]
            );

            const jsonUser = await AsyncStorage.getItem('user_session');
            if (jsonUser) {
                const session = JSON.parse(jsonUser);
                const newSession = { ...session, nome_completo: user.nome.toUpperCase() };
                await AsyncStorage.setItem('user_session', JSON.stringify(newSession));
            }

            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            setIsEditing(false);
            loadProfile();
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sair do Aplicativo',
            'Tem certeza que deseja desconectar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'SAIR AGORA',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove(['user_session', 'remember_me']);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (e) {
                            console.error('Logout failed', e);
                            navigation.replace('Login');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user.nome?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{user.nome}</Text>
                <Text style={styles.role}>{user.nivel === 'ADM' ? 'ADMINISTRADOR' : 'COLABORADOR'}</Text>

                <View style={styles.badge}>
                    <Ionicons name="diamond" size={12} color={COLORS.primaryLight} />
                    <Text style={styles.badgeText}>PLANO ULTRAPRO</Text>
                </View>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
                        {!isEditing && (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Ionicons name="pencil" size={14} color={COLORS.primaryLight} />
                                <Text style={styles.editText}>EDITAR PERFIL</Text>
                            </TouchableOpacity>
                        )}
                        {isEditing && (
                            <TouchableOpacity style={styles.editBtn} onPress={() => {
                                setIsEditing(false);
                                loadProfile();
                            }}>
                                <Text style={[styles.editText, { color: COLORS.destructive, marginLeft: 10 }]}>CANCELAR</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* NOME */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>NOME COMPLETO</Text>
                        {isEditing ? (
                            <AppInput
                                value={user.nome}
                                onChangeText={t => setUser({ ...user, nome: t })}
                                placeholder="Seu nome completo"
                                variant="glass"
                                style={{ marginBottom: 0 }}
                            />
                        ) : (
                            <Text style={styles.value}>{user.nome || '-'}</Text>
                        )}
                    </View>

                    {/* TELEFONE */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
                        {isEditing ? (
                            <AppInput
                                value={user.telefone}
                                onChangeText={t => setUser({ ...user, telefone: t })}
                                keyboardType="phone-pad"
                                placeholder="(XX) XXXXX-XXXX"
                                variant="glass"
                                style={{ marginBottom: 0 }}
                            />
                        ) : (
                            <Text style={styles.value}>{user.telefone || '-'}</Text>
                        )}
                    </View>

                    {/* ENDEREÇO */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>LOCALIZAÇÃO / FAZENDA</Text>
                        {isEditing ? (
                            <AppInput
                                value={user.endereco}
                                onChangeText={t => setUser({ ...user, endereco: t })}
                                placeholder="Nome da Fazenda ou Cidade"
                                variant="glass"
                                style={{ marginBottom: 0 }}
                            />
                        ) : (
                            <Text style={styles.value}>{user.endereco || '-'}</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* READ ONLY FIELDS */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={styles.label}>USUÁRIO</Text>
                            <Text style={styles.value}>{user.usuario}</Text>
                        </View>
                        <View>
                            <Text style={[styles.label, { textAlign: 'right' }]}>LOGIN VIA</Text>
                            <Text style={[styles.value, { textAlign: 'right', fontSize: 14 }]}>
                                {user.provider === 'google' ? 'GOOGLE' : 'SENHA LOCAL'}
                            </Text>
                        </View>
                    </View>

                    {/* BOTÃO SALVAR */}
                    {isEditing && (
                        <AppButton
                            title="SALVAR ALTERAÇÕES"
                            onPress={handleSave}
                            loading={saving}
                            style={{ marginTop: 20 }}
                        />
                    )}
                </View>

                <View style={{ marginTop: 10, paddingBottom: 50 }}>
                    <AppButton
                        title="SAIR DO APLICATIVO"
                        onPress={handleLogout}
                        variant="danger"
                        style={{ borderWidth: 1, borderColor: COLORS.destructive }}
                        textStyle={{ color: COLORS.white }}
                    />
                    <Text style={styles.version}>AgroGB Mobile v7.3 (Dark Theme)</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },

    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.primaryLight },
    name: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
    role: { fontSize: 12, color: COLORS.gray500, fontWeight: 'bold', letterSpacing: 1, marginTop: 5 },

    badge: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
    badgeText: { color: COLORS.primaryLight, fontSize: 11, fontWeight: 'bold' },

    body: { flex: 1, padding: 20, marginTop: -30 },
    section: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.gray500, letterSpacing: 1 },

    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    editText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primaryLight },

    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 8, textTransform: 'uppercase' },
    value: { fontSize: 16, fontWeight: '600', color: COLORS.white },

    divider: { height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 15 },

    version: { textAlign: 'center', marginTop: 30, color: COLORS.gray500, fontSize: 10, fontWeight: 'bold' }
});
