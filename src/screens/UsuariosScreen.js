import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { insertUsuario, getUsuarios, deleteUsuario, updateUsuario } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function UsuariosScreen({ navigation }) {
    const { theme } = useTheme();
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

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getUsuarios();
            setItems(data);
        } catch (error) {
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
                Alert.alert('Sucesso', 'Perfil de usuário atualizado!');
            } else {
                await insertUsuario(dados);
                Alert.alert('Sucesso', 'Novo usuário criado com sucesso!');
            }
            setModalVisible(false);
            loadData();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar dados. Tente outro nome de login.');
        }
    };

    const handleDelete = async (item) => {
        if (item.usuario === 'ADMIN') return Alert.alert('Acesso Negado', 'O usuário mestre (ADMIN) não pode ser excluído.');
        Alert.alert('Excluir Usuário', `Deseja realmente revogar o acesso de ${item.usuario}?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir Agora', style: 'destructive', onPress: async () => {
                    await deleteUsuario(item.id);
                    loadData();
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#064E3B']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTROLE DE ACESSOS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Gerencie operadores e permissões do sistema</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme?.colors?.primary} /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <Card style={styles.userCard} onPress={() => handleOpenModal(item)} noPadding>
                            <View style={styles.cardInner}>
                                <View style={[styles.avatarBox, { backgroundColor: (theme?.colors?.primary || '#10B981') + '15' }]}>
                                    <Text style={[styles.avatarTxt, { color: theme?.colors?.primary }]}>{item.usuario.charAt(0)}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.userName}>{item.nome_completo || item.usuario}</Text>
                                    <Text style={styles.userEmail}>{item.email || 'Nenhum e-mail cadastrado'}</Text>
                                    <View style={styles.roleRow}>
                                        <View style={[styles.roleBadge, { backgroundColor: item.nivel === 'ADM' ? '#FEF2F2' : '#F0F9FF' }]}>
                                            <View style={[styles.roleDot, { backgroundColor: item.nivel === 'ADM' ? '#EF4444' : '#3B82F6' }]} />
                                            <Text style={[styles.roleText, { color: item.nivel === 'ADM' ? '#EF4444' : '#3B82F6' }]}>
                                                {item.nivel === 'ADM' ? 'ADMINISTRADOR' : 'OPERADOR'} • {item.usuario}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="account-group-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyTxt}>Nenhum usuário encontrado no sistema.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={() => handleOpenModal(null)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{id ? 'EDITAR PERFIL' : 'NOVO USUÁRIO'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Card style={{ marginBottom: 15 }}>
                                <Text style={styles.sectionTitle}>ACESSO E SEGURANÇA</Text>
                                <AgroInput label="LOGIN DO USUÁRIO" value={usuario} onChangeText={t => setUsuario(t.toUpperCase())} autoCapitalize="characters" icon="at-outline" />
                                <AgroInput label="SENHA DE ACESSO" value={senha} onChangeText={setSenha} icon="key-outline" secureTextEntry={false} />
                                
                                <Text style={styles.roleLabel}>NÍVEL DE PERMISSÃO</Text>
                                <View style={styles.roleSelector}>
                                    <TouchableOpacity style={[styles.roleOption, nivel === 'USUARIO' && { backgroundColor: '#111827' }]} onPress={() => setNivel('USUARIO')}>
                                        <Text style={[styles.roleOptTxt, nivel === 'USUARIO' && { color: '#FFF' }]}>OPERADOR</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.roleOption, nivel === 'ADM' && { backgroundColor: '#111827' }]} onPress={() => setNivel('ADM')}>
                                        <Text style={[styles.roleOptTxt, nivel === 'ADM' && { color: '#FFF' }]}>ADMIN</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>

                            <Card>
                                <Text style={styles.sectionTitle}>DADOS PROFISSIONAIS</Text>
                                <AgroInput label="NOME COMPLETO" value={nomeCompleto} onChangeText={t => setNomeCompleto(t.toUpperCase())} icon="person-outline" />
                                <AgroInput label="E-MAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />
                                <AgroInput label="WHATSAPP / TELEFONE" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" icon="call-outline" />
                                <AgroInput label="LOCALIZAÇÃO" value={endereco} onChangeText={t => setEndereco(t.toUpperCase())} icon="location-outline" />
                            </Card>

                            <AgroButton title={id ? "ATUALIZAR USUÁRIO" : "CRIAR ACESSO AGORA"} onPress={handleSave} style={{ marginTop: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    list: { padding: 20, paddingBottom: 100 },
    userCard: { marginBottom: 12 },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    avatarBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarTxt: { fontSize: 22, fontWeight: '900' },
    cardInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    userEmail: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
    roleRow: { flexDirection: 'row' },
    roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    roleText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12, marginLeft: 10 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: 1.5 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#4F46E5', letterSpacing: 1, marginBottom: 15 },
    roleLabel: { fontSize: 10, fontWeight: '800', color: '#374151', marginBottom: 8, marginTop: 10 },
    roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    roleOption: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
    roleOptTxt: { fontSize: 11, fontWeight: '900', color: '#6B7280' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.4 },
    emptyTxt: { color: '#6B7280', marginTop: 15, fontWeight: '700', fontSize: 14 }
});
