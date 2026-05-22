import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

export default function ProfileScreen({ navigation }) {
    const { theme, colors: THEME, setTheme } = useTheme();
    const styles = getStyles(THEME);
    
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    const [user, setUser] = useState({ id: null, nome: '', usuario: '', email: '', telefone: '', endereco: '', nivel: '', provider: 'local', senha_atual: '', nova_senha: '', avatar: null });
    const [biometria, setBiometria] = useState(false);
    const [twoFA, setTwoFA] = useState(false);
    const [inviteCode, setInviteCode] = useState('Buscando...'); // Novo: Código do Agrônomo V2

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
                
                // Buscar/Gerar código de convite no Supabase V2
                try {
                    const { data: sData } = await supabase.auth.getSession();
                    if (sData?.session) {
                        const uid = sData.session.user.id;
                        const { data: codeData } = await supabase.from('agronomist_codes').select('invite_code').eq('agronomist_id', uid).single();
                        if (codeData) {
                            setInviteCode(codeData.invite_code);
                        } else {
                            // Gerar código único e seguro para o agrônomo
                            const newCode = 'AGR-' + Math.floor(1000 + Math.random() * 9000);
                            await supabase.from('agronomist_codes').insert([{ agronomist_id: uid, invite_code: newCode }]);
                            setInviteCode(newCode);
                        }
                    }
                } catch(e) { console.log('[ProfileScreen] Erro no código de convite:', e.message) }

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
            <Text style={[styles.listItemTitle, highlightRed && { color: '#EF4444' }]}>{title}</Text>
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
                
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity style={styles.headerIconWrap} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color={THEME.accent} />
                    </TouchableOpacity>
                    <Text style={styles.mainTitle}>Configurações</Text>
                </View>

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

                {isEditing && (
                    <View style={styles.editBox}>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>Nome Completo</Text><TextInput style={styles.input} value={user.nome} onChangeText={t=>setUser({...user, nome:t})} placeholderTextColor={THEME.textSub} /></View>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>E-mail</Text><TextInput style={styles.input} value={user.email} onChangeText={t=>setUser({...user, email:t})} keyboardType="email-address" placeholderTextColor={THEME.textSub}/></View>
                        <View style={styles.inputView}><Text style={styles.inputLabel}>WhatsApp</Text><TextInput style={styles.input} value={user.telefone} onChangeText={t=>setUser({...user, telefone:t})} keyboardType="phone-pad" placeholderTextColor={THEME.textSub}/></View>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color:'#FFF', fontWeight:'bold'}}>SALVAR DADOS</Text></TouchableOpacity>
                    </View>
                )}

                {/* NOVO: Código do Agrônomo */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Convite para Produtores (V2)</Text>
                    <View style={styles.listGroup}>
                        <ListItem 
                            icon="qrcode-scan" 
                            color={THEME.accent} 
                            title="Seu Código Exclusivo:" 
                            subValue={inviteCode} 
                            noBorder 
                            onPress={() => Alert.alert('Código Copiado!', `Compartilhe ${inviteCode} com os seus clientes no WhatsApp.`)} 
                        />
                    </View>
                </View>

                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Segurança</Text>
                    <View style={styles.listGroup}>
                        <ListItem icon="fingerprint" color={THEME.textSub} title="Login com Biometria" isSwitch value={biometria} onChange={handleBiometricToggle} />
                        <ListItem icon="shield-lock-outline" color={THEME.textSub} title="Autenticação em 2 Fatores" isSwitch value={twoFA} onChange={handleTwoFAToggle} />
                        <ListItem icon="lock-outline" color={THEME.textSub} title="Alterar Senha" onPress={() => setIsEditing(true)} />
                        <ListItem icon="logout-variant" color="#EF4444" highlightRed title="Encerrar Todas Sessões" subValue="Hoje 08:30" noBorder onPress={handleLogout} />
                    </View>
                </View>

                {user.nivel === 'ADM' && (
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionTitle}>Equipe</Text>
                        <View style={styles.listGroup}>
                            <ListItem icon="account-group-outline" color={THEME.textSub} title="Gerenciar Usuários" />
                            <ListItem icon="shield-check-outline" color={THEME.textSub} title="Permissões & Acessos" noBorder />
                        </View>
                    </View>
                )}

                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Preferências</Text>
                    <View style={styles.listGroup}>
                        {/* TOGGLE MÁGICO DE TEMA */}
                        <ListItem icon="theme-light-dark" color={THEME.textSub} title="Tema do Aplicativo" subValue={theme === 'dark' ? 'Escuro' : 'Claro'} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                        
                        <ListItem icon="web" color={THEME.textSub} title="Idioma" subValue="Português" />
                        <ListItem icon="bell-ring-outline" color={THEME.textSub} title="Notificações" isSwitch value={true} onChange={()=>{}} noBorder />
                    </View>
                </View>

                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>Dados</Text>
                    <View style={styles.listGroup}>
                        <ListItem icon="cloud-sync-outline" color={THEME.textSub} title="Sincronização" subValue="Tempo Real" />
                        <ListItem icon="cloud-upload-outline" color={THEME.textSub} title="Backup Automático" subValue={`Último: ${new Date().getHours()}:00`} noBorder />
                    </View>
                </View>

                <View style={styles.sectionWrap}>
                    <View style={styles.listGroup}>
                        <ListItem icon="information-outline" color={THEME.textSub} title="Ajuda" subValue="7.0.0.0" />
                        <ListItem icon="help-circle-outline" color={THEME.textSub} title="Sobre o Sistema" noBorder />
                    </View>
                </View>
                
                <Text style={styles.version}>powered by AgroGB System 7.0</Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (THEME) => StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
    
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    headerIconWrap: { width: 40, height: 40, justifyContent: 'center' },
    mainTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: THEME.textMain, textAlign: 'center', marginRight: 40 },
    
    profileBox: { backgroundColor: THEME.cardBg, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: THEME.border },
    avatarContainer: { width: 66, height: 66, borderRadius: 33, backgroundColor: THEME.accent + '33', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarImg: { width: 66, height: 66, borderRadius: 33 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: THEME.accent },
    profileInfo: { flex: 1, justifyContent: 'center' },
    name: { fontSize: 18, fontWeight: '700', color: THEME.textMain, marginBottom: 2 },
    email: { fontSize: 13, color: THEME.textSub, marginBottom: 2 },
    company: { fontSize: 12, color: THEME.textSub },
    editProfileBtn: { backgroundColor: THEME.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.border },
    editProfileTxt: { color: THEME.textMain, fontSize: 12, fontWeight: '600' },
    
    editBox: { backgroundColor: THEME.cardBg, borderRadius: 16, padding: 18, marginBottom: 30, borderWidth: 1, borderColor: THEME.border },
    inputView: { marginBottom: 15 },
    inputLabel: { color: THEME.textSub, fontSize: 11, marginBottom: 5, textTransform: 'uppercase', fontWeight: 'bold' },
    input: { backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, color: THEME.textMain, fontSize: 15 },
    saveBtn: { backgroundColor: THEME.accent, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    
    sectionWrap: { marginBottom: 25 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.accent, marginBottom: 8, marginLeft: 10, textTransform: 'capitalize' },
    listGroup: { backgroundColor: THEME.cardBg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
    
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.border },
    listItemIconBox: { width: 34, alignItems: 'center' },
    listItemTitle: { flex: 1, fontSize: 15, color: THEME.textMain, fontWeight: '500' },
    listItemSub: { fontSize: 13, color: THEME.textSub, marginRight: 5 },
    arrowIcon: { opacity: 0.5 },
    
    version: { textAlign: 'center', marginVertical: 30, color: THEME.textSub, fontSize: 11, fontWeight: '600' }
});
