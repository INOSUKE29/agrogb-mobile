import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Alert, 
    TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import PrimaryButton from '../ui/PrimaryButton';
import { showToast } from '../ui/Toast';
import { AuthService } from '../services/authService';
import { executeQuery } from '../database/database';

export default function ProfileEditScreen({ navigation }) {
    const { colors } = useTheme();
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
            console.error('[ProfileEdit] Erro ao carregar dados:', e);
        }
    };

    useFocusEffect(useCallback(() => { loadProfile(); }, []));

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permissão', 'Precisamos acessar sua galeria para mudar a foto.');

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
            showToast('Dados atualizados com sucesso!');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível salvar as alterações.');
        } finally {
            setLoading(true);
        }
    };

    const InputField = ({ label, icon, value, onChange, placeholder, keyboardType, secureTextEntry, autoCapitalize = "words" }) => (
        <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
                <Ionicons name={icon} size={14} color={colors.primary} />
                <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            </View>
            <TextInput 
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.cardAlt }]} 
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted + '80'}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Minha Conta" onBack={() => navigation.goBack()} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* AVATAR UPLOADER */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                            <View style={[styles.avatarBox, { borderColor: colors.primary }]}>
                                {user.avatar ? (
                                    <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.avatarLetter}>{user.nome?.charAt(0).toUpperCase() || 'P'}</Text>
                                    </View>
                                )}
                                <LinearGradient 
                                    colors={[colors.primary, colors.primaryDark]} 
                                    style={styles.editIconBadge}
                                >
                                    <Ionicons name="camera" size={14} color="#FFF" />
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.nome || user.usuario}</Text>
                        <Text style={[styles.userLevel, { color: colors.primary }]}>
                            {user.nivel === 'ADM' ? 'GESTOR DIAMOND' : 'COLABORADOR'}
                        </Text>
                    </View>

                    {/* FORM CARDS */}
                    <GlowCard style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS PESSOAIS</Text>
                        
                        <InputField 
                            label="NOME COMPLETO" 
                            icon="person-outline"
                            value={user.nome}
                            onChange={v => setUser({ ...user, nome: v })}
                        />

                        <InputField 
                            label="E-MAIL DE CONTATO" 
                            icon="mail-outline"
                            value={user.email}
                            onChange={v => setUser({ ...user, email: v })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <InputField 
                            label="TELEFONE" 
                            icon="call-outline"
                            value={user.telefone}
                            onChange={v => setUser({ ...user, telefone: v })}
                            keyboardType="phone-pad"
                        />

                        <InputField 
                            label="ENDEREÇO / BASE" 
                            icon="location-outline"
                            value={user.endereco}
                            onChange={v => setUser({ ...user, endereco: v })}
                        />
                    </GlowCard>

                    <GlowCard style={[styles.card, { marginTop: 20 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>SEGURANÇA</Text>
                        <InputField 
                            label="NOVA SENHA" 
                            icon="lock-closed-outline"
                            value={user.nova_senha}
                            onChange={v => setUser({ ...user, nova_senha: v })}
                            placeholder="Deixe em branco para não alterar"
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />
                        <Text style={[styles.securityTip, { color: colors.textMuted }]}>
                            A senha deve ser mantida em sigilo. Se alterar, sua sessão será mantida no aparelho local.
                        </Text>
                    </GlowCard>

                    <View style={styles.actionBox}>
                        <PrimaryButton 
                            title={loading ? "PROCESSANDO..." : "SALVAR ALTERAÇÕES"} 
                            onPress={handleSave} 
                            disabled={loading}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarBox: {
        width: 100,
        height: 100,
        borderRadius: 35,
        borderWidth: 2.5,
        padding: 4,
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#FFF',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 30,
        height: 30,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: '900',
    },
    userLevel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 2,
    },
    card: {
        padding: 20,
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    input: {
        height: 50,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 15,
        fontWeight: '600',
    },
    securityTip: {
        fontSize: 11,
        lineHeight: 16,
        paddingHorizontal: 5,
    },
    actionBox: {
        marginTop: 30,
        paddingBottom: 20,
    }
});
