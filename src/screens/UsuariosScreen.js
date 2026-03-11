import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { insertUsuario, getUsuarios, deleteUsuario, updateUsuario } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

// UI Components
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import DangerButton from '../ui/DangerButton';
import GlowFAB from '../ui/GlowFAB';

export default function UsuariosScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form States
    const [id, setId] = useState(null);
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [nivel, setNivel] = useState('USUARIO');
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => { loadData(); }, []);

    const up = (t, setter) => setter(t.toUpperCase());

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getUsuarios();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setId(item.id);
            setUsuario(item.usuario);
            setSenha(item.senha);
            setNivel(item.nivel);
            setNomeCompleto(item.nome_completo || '');
            setTelefone(item.telefone || '');
            setEndereco(item.endereco || '');
            setEmail(item.email || '');
        } else {
            setId(null);
            setUsuario('');
            setSenha('');
            setNivel('USUARIO');
            setNomeCompleto('');
            setTelefone('');
            setEndereco('');
            setEmail('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!usuario.trim() || !senha.trim()) return Alert.alert('Erro', 'Preencha login e senha.');

        const dados = {
            id,
            usuario: usuario.toUpperCase(),
            senha,
            nivel,
            nome_completo: nomeCompleto.toUpperCase(),
            telefone,
            endereco: endereco.toUpperCase(),
            email: email.toLowerCase()
        };

        try {
            if (id) {
                await updateUsuario(dados);
                Alert.alert('Sucesso', 'Perfil atualizado!');
            } else {
                await insertUsuario(dados);
                Alert.alert('Sucesso', 'Usuário criado!');
            }
            setModalVisible(false);
            loadData();
        } catch {
            Alert.alert('Erro', 'Falha ao salvar dados. Tente outro login.');
        }
    };

    const handleDelete = (item) => {
        if (item.usuario === 'ADMIN') return Alert.alert('Acesso negado', 'O usuário ADMIN mestre não pode ser removido.');
        Alert.alert('Remover Acesso', 'Deseja remover o acesso de ' + item.usuario + '?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover', style: 'destructive', onPress: async () => {
                    await deleteUsuario(item.id);
                    loadData();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => {
        const isAdm = item.nivel === 'ADM' || item.nivel === 'ADMIN';
        return (
            <GlowCard style={styles.card} onPress={() => handleOpenModal(item)}>
                <View style={[styles.avatarContainer, { backgroundColor: isAdm ? colors.danger + '20' : colors.primary + '20' }]}>
                    <Text style={[styles.avatarText, { color: isAdm ? colors.danger : colors.primary }]}>
                        {item.usuario.charAt(0)}
                    </Text>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.nome_completo || item.usuario}</Text>
                    <Text style={[styles.userSub, { color: colors.textSecondary }]}>{item.email || 'Sem email'}</Text>
                    <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                        <View style={[styles.dot, { backgroundColor: isAdm ? colors.danger : colors.primary }]} />
                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                            {isAdm ? 'ADMINISTRADOR' : 'OPERADOR'} • {item.usuario}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.deleteBtn, { backgroundColor: colors.danger + '10' }]}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
            </GlowCard>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="GESTÃO DE ACESSOS"
                onBack={() => navigation?.goBack()}
            />

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={colors.placeholder} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum usuário cadastrado.</Text>
                        </View>
                    }
                />
            )}

            <GlowFAB icon="add" onPress={() => handleOpenModal(null)} />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <GlowCard style={styles.modalContent} noPadding>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25 }}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{id ? 'EDITAR PERFIL' : 'NOVO USUÁRIO'}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={32} color={colors.placeholder} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>CREDENCIAIS DE ACESSO</Text>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LOGIN (USUÁRIO)</Text>
                            <GlowInput
                                placeholder="EX: JOAO.SILVA"
                                value={usuario}
                                onChangeText={t => up(t, setUsuario)}
                                autoCapitalize="characters"
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SENHA</Text>
                            <GlowInput
                                placeholder="••••••"
                                value={senha}
                                onChangeText={setSenha}
                                secureTextEntry
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NÍVEL DE PERMISSÃO</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, { backgroundColor: colors.background, borderColor: colors.border }, nivel === 'USUARIO' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    onPress={() => setNivel('USUARIO')}
                                >
                                    <Ionicons name="person" size={16} color={nivel === 'USUARIO' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.toggleText, { color: colors.textSecondary }, nivel === 'USUARIO' && { color: '#FFF' }]}>OPERADOR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, { backgroundColor: colors.background, borderColor: colors.border }, nivel === 'ADM' && { backgroundColor: colors.danger, borderColor: colors.danger }]}
                                    onPress={() => setNivel('ADM')}
                                >
                                    <Ionicons name="shield-checkmark" size={16} color={nivel === 'ADM' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.toggleText, { color: colors.textSecondary }, nivel === 'ADM' && { color: '#FFF' }]}>ADMIN</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 20 }]}>DADOS PESSOAIS</Text>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOME COMPLETO</Text>
                            <GlowInput
                                placeholder="NOME COMPLETO"
                                value={nomeCompleto}
                                onChangeText={t => up(t, setNomeCompleto)}
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL</Text>
                            <GlowInput
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TELEFONE</Text>
                            <GlowInput
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onChangeText={setTelefone}
                                keyboardType="phone-pad"
                            />

                            <PrimaryButton
                                label="SALVAR DADOS"
                                icon="save-outline"
                                onPress={handleSave}
                                style={{ marginTop: 20 }}
                            />
                            
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </GlowCard>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    list: { padding: 20, paddingBottom: 100 },
    card: {
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { fontSize: 20, fontWeight: '900' },
    cardInfo: { flex: 1 },
    badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    userName: { fontSize: 16, fontWeight: 'bold' },
    userSub: { fontSize: 11, marginTop: 2 },
    deleteBtn: { padding: 10, borderRadius: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '900', marginBottom: 15, letterSpacing: 1.5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 5 },
    inputLabel: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1, marginLeft: 4 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    toggleBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1.5 },
    toggleText: { fontSize: 11, fontWeight: '900' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { marginTop: 16, fontWeight: 'bold' }
});
