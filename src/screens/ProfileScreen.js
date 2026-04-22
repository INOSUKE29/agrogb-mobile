import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { executeQuery } from '../database/database';

const THEME = {
    bg: '#0B1115', // Fundo super escuro estilo Dark Mode
    card: '#161F27', // Fundo dos agrupamentos
    textMain: '#F9FAFB', // Branco forte
    textSub: '#9CA3AF', // Cinza texto secundário
    accent: '#10B981', // Verde Esmeralda 
    border: '#232F3A',
    danger: '#EF4444'
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
    
    // Header Style Premium
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    headerIconWrap: { width: 40, height: 40, justifyContent: 'center' },
    mainTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: THEME.textMain, textAlign: 'center', marginRight: 40 }, // margem p compensar seta
    
    // Profile Box
    profileBox: { backgroundColor: THEME.card, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: THEME.border },
    avatarContainer: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarImg: { width: 66, height: 66, borderRadius: 33 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: THEME.textMain },
    profileInfo: { flex: 1, justifyContent: 'center' },
    name: { fontSize: 18, fontWeight: '700', color: THEME.textMain, marginBottom: 2 },
    email: { fontSize: 13, color: THEME.textSub, marginBottom: 2 },
    company: { fontSize: 12, color: THEME.textSub },
    editProfileBtn: { backgroundColor: '#1F2B36', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.border },
    editProfileTxt: { color: THEME.textMain, fontSize: 12, fontWeight: '600' },
    
    // Edit Form Expandido (Apenas mostrado ao clicar em editar)
    editBox: { backgroundColor: THEME.card, borderRadius: 16, padding: 18, marginBottom: 30, borderWidth: 1, borderColor: THEME.border },
    inputView: { marginBottom: 15 },
    inputLabel: { color: THEME.textSub, fontSize: 11, marginBottom: 5, textTransform: 'uppercase', fontWeight: 'bold' },
    input: { backgroundColor: '#11181F', borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, color: THEME.textMain, fontSize: 15 },
    saveBtn: { backgroundColor: THEME.accent, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    
    // Group Sections
    sectionWrap: { marginBottom: 25 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.accent, marginBottom: 8, marginLeft: 10, textTransform: 'capitalize' },
    listGroup: { backgroundColor: THEME.card, borderRadius: 16, overflow: 'hidden' },
    
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.border },
    listItemIconBox: { width: 34, alignItems: 'center' },
    listItemTitle: { flex: 1, fontSize: 15, color: THEME.textMain, fontWeight: '500' },
    listItemSub: { fontSize: 13, color: THEME.textSub, marginRight: 5 },
    arrowIcon: { opacity: 0.5 },
    
    version: { textAlign: 'center', marginVertical: 30, color: THEME.textSub, fontSize: 11, fontWeight: '600' }
});

export default function ProfileScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    const [user, setUser] = useState({ id: null, nome: '', usuario: '', email: '', telefone: '', endereco: '', nivel: '', provider: 'local', senha_atual: '', nova_senha: '', avatar: null });
    const [biometria, setBiometria] = useState(false);
    const [twoFA, setTwoFA] = useState(false);

    const loadProfile = async () => {
        try {
            const jsonUser = await AsyncStorage.getItem('user_session');
            if (jsonUser) {
                const session = JSON.parse(jsonUser);
                const res = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [session.id]);
                if (res.rows.length > 0) {
                    const u = res.rows.item(0);
                    setUser({ id: u.id, nome: u.nome_completo || u.usuario, usuario: u.usuario, email: u.email || '', telefone: u.telefone || '', endereco: u.endereco || '', nivel: u.nivel || 'USUARIO', provider: u.provider || 'local', senha_atual: '', nova_senha: '', avatar: u.avatar || null });
                }
            }
            const bioSettings = await AsyncStorage.getItem(`bio_${session?.id}`);
            if(bioSettings) setBiometria(bioSettings === 'true');
            const twoFASettings = await AsyncStorage.getItem(`twofa_${session?.id}`);
            if(twoFASettings) setTwoFA(twoFASettings === 'true');
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadProfile(); }, []));

    const handleBiometricToggle = async (value) => {
        if(value) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return Alert.alert('Erro', 'Este dispositivo não suporta biometria.');
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Ativar digital', disableDeviceFallback: false });
            if (result.success) { setBiometria(true); AsyncStorage.setItem(`bio_${user.id}`, 'true'); }
        } else {
            setBiometria(false); AsyncStorage.setItem(`bio_${user.id}`, 'false');
        }
    };

    const handleTwoFAToggle = (value) => {
        setTwoFA(value); AsyncStorage.setItem(`twofa_${user.id}`, value ? 'true' : 'false');
    };

    const handleSave = async () => {
        try {
            await executeQuery(`UPDATE usuarios SET nome_completo=?, email=?, telefone=?, avatar=? WHERE id=?`, [user.nome.toUpperCase(), user.email.toLowerCase(), user.telefone, user.avatar, user.id]);
            Alert.alert('Sucesso', 'Perfil salvo!'); setIsEditing(false); loadProfile();
        } catch(e) { Alert.alert('Erro', 'Falha ao salvar'); }
    };

    const pickAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!result.canceled) setUser({ ...user, avatar: result.assets[0].uri });
    };

    const handleLogout = async () => {
        Alert.alert('Encerrar Sessões', 'Deseja realmente sair da sua conta?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: async () => {
                await supabase.auth.signOut();
                await AsyncStorage.removeItem('user_session');
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
        ]);
    };

    const ListItem = ({ icon, color, title, isSwitch, value, onChange, subValue, noBorder, highlightRed, onPress }) => (
        <TouchableOpacity style={[styles.listItem, noBorder && { borderBottomWidth: 0 }]} activeOpacity={isSwitch ? 1 : 0.6} onPress={onPress}>
            <View style={styles.listItemIconBox}>
                <MaterialCommunityIcons name={icon} size={22} color={color || THEME.textSub} />
            </View>
            <Text style={[styles.listItemTitle, highlightRed && { color: THEME.danger }]}>{title}</Text>
            {subValue && <Text style={styles.listItemSub}>{subValue}</Text>}
            {isSwitch ? (
                <Switch value={value} onValueChange={onChange} trackColor={{ false: '#374151', true: THEME.accent }} thumbColor="#FFF" />
            ) : (
                <Ionicons name="chevron-forward" size={18} color={THEME.textSub} style={styles.arrowIcon} />
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* Header Navbar */}
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity style={styles.headerIconWrap} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color={THEME.accent} />
                    </TouchableOpacity>
                    <Text style={styles.mainTitle}>Configurações</Text>
                </View>

                {/* Card Perfil Compacto (Reprodução Fiel ao Dribbble) */}
                <View style={styles.profileBox}>
                    <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
                        {user.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{user.nome?.charAt(0) || '?'}</Text>}
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{user.nome || user.usuario || 'Usuário'}</Text>
                        <Text style={styles.email} numberOfLines={1}>{user.email || 'Não configurado'}</Text>
                        <Text style={styles.company}>Empresa AgroGB</Text>
                    </View>
                    <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(!isEditing)}>
                        <Text style={styles.editProfileTxt}>{isEditing ? 'Cancelar' : 'Editar Perfil'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bloco de Edição Oculto Dropdown */}
                {isEditing && (
                    <View style={styles.editBox}>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>Nome Completo</Text><TextInput style={styles.input} value={user.nome} onChangeText={t=>setUser({...user, nome:t})} placeholderTextColor={THEME.textSub} /></View>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>E-mail</Text><TextInput style={styles.input} value={user.email} onChangeText={t=>setUser({...user, email:t})} keyboardType="email-address" placeholderTextColor={THEME.textSub}/></View>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>WhatsApp</Text><TextInput style={styles.input} value={user.telefone} onChangeText={t=>setUser({...user, telefone:t})} keyboardType="phone-pad" placeholderTextColor={THEME.textSub}/></View>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color:'#FFF', fontWeight:'bold'}}>SALVAR DADOS</Text></TouchableOpacity>
                    </View>
                )}

                {/* Seção 1: Segurança */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Segurança</Text>
                    <View style={styles.listGroup}>
                        <ListItem icon="fingerprint" color="#A0AEC0" title="Login com Biometria" isSwitch value={biometria} onChange={handleBiometricToggle} />
                        <ListItem icon="shield-lock-outline" color="#A0AEC0" title="Autenticação em 2 Fatores" isSwitch value={twoFA} onChange={handleTwoFAToggle} />
                        <ListItem icon="lock-outline" color="#A0AEC0" title="Alterar Senha" onPress={() => setIsEditing(true)} />
                        <ListItem icon="cellphone-link" color="#A0AEC0" title="Dispositivos Conectados" />
                        <ListItem icon="logout-variant" color={THEME.danger} highlightRed title="Encerrar Todas Sessões" subValue="Hoje 08:30" noBorder onPress={handleLogout} />
                    </View>
                </View>

                {/* Seção 2: Equipe */}
                {user.nivel === 'ADM' && (
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionTitle}>Equipe</Text>
                        <View style={styles.listGroup}>
                            <ListItem icon="account-group-outline" color="#A0AEC0" title="Gerenciar Usuários" />
                            <ListItem icon="shield-check-outline" color="#A0AEC0" title="Permissões & Acessos" noBorder />
                        </View>
                    </View>
                )}

                {/* Seção 3: Preferências */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Preferências</Text>
                    <View style={styles.listGroup}>
                        <ListItem icon="theme-light-dark" color="#A0AEC0" title="Tema do Aplicativo" subValue="Escuro" />
                        <ListItem icon="web" color="#A0AEC0" title="Idioma" subValue="Português" />
                        <ListItem icon="bell-ring-outline" color="#A0AEC0" title="Notificações" isSwitch value={true} onChange={()=>{}} noBorder />
                    </View>
                </View>

                {/* Seção 4: Dados */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Dados</Text>
                    <View style={styles.listGroup}>
                        <ListItem icon="cloud-sync-outline" color="#A0AEC0" title="Sincronização" subValue="Tempo Real" />
                        <ListItem icon="cloud-upload-outline" color="#A0AEC0" title="Backup Automático" subValue={`Último: ${new Date().getHours()}:00`} />
                        <ListItem icon="cloud-download-outline" color="#A0AEC0" title="Restaurar Dados" noBorder />
                    </View>
                </View>

                <View style={styles.sectionWrap}>
                    <View style={styles.listGroup}>
                        <ListItem icon="information-outline" color="#A0AEC0" title="Ajuda" subValue="1.0.0.0" />
                        <ListItem icon="help-circle-outline" color="#A0AEC0" title="Sobre o Sistema" noBorder />
                    </View>
                </View>

                <Text style={styles.version}>powered by AgroGB System 6.0</Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
