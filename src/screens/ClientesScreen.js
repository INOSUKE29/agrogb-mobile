import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, getClientes, deleteCliente } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function ClientesScreen({ navigation }) {
    const { theme } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Form State
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cpf, setCpf] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            setItems(data);
        } catch (e) {
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Atenção', 'O nome do cliente ou empresa é obrigatório.');
        try {
            await insertCliente({
                uuid: uuidv4(),
                nome: nome.toUpperCase(),
                telefone,
                endereco: endereco.toUpperCase(),
                cpf_cnpj: cpf,
                observacao: ''
            });
            setModalVisible(false);
            setNome('');
            setTelefone('');
            setEndereco('');
            setCpf('');
            loadData();
            Alert.alert('Sucesso', 'Parceiro comercial cadastrado!');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar dados do cliente.');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Remover Parceiro', `Deseja realmente excluir ${item.nome} da sua lista de contatos?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Remover Agora', 
                style: 'destructive', 
                onPress: async () => { 
                    await deleteCliente(item.id); 
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
                    <Text style={styles.headerTitle}>CLIENTES E PARCEIROS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Gestão Inteligente de Contatos Comerciais</Text>
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
                        <Card style={styles.itemCard} noPadding onPress={() => Alert.alert('Info', `Detalhes de ${item.nome}`)}>
                            <View style={styles.cardInner}>
                                <View style={[styles.avatarBox, { backgroundColor: (theme?.colors?.primary || '#10B981') + '15' }]}>
                                    <Text style={[styles.avatarTxt, { color: theme?.colors?.primary }]}>{item.nome.charAt(0)}</Text>
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={styles.cardTitle}>{item.nome}</Text>
                                    <View style={styles.cardInfoRow}>
                                        <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                                        <Text style={styles.cardSub}>{item.telefone || 'SEM TELEFONE'}</Text>
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
                            <Text style={styles.emptyTxt}>Nenhum parceiro comercial cadastrado.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVO PARCEIRO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Card style={{ marginBottom: 20 }}>
                                <AgroInput label="NOME COMPLETO / EMPRESA *" value={nome} onChangeText={t => setNome(t.toUpperCase())} autoCapitalize="characters" icon="person-outline" />
                                <AgroInput label="TELEFONE / WHATSAPP" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" icon="call-outline" />
                                <AgroInput label="ENDEREÇO / LOCALIZAÇÃO" value={endereco} onChangeText={t => setEndereco(t.toUpperCase())} autoCapitalize="characters" icon="location-outline" />
                                <AgroInput label="CPF / CNPJ" value={cpf} onChangeText={setCpf} icon="card-outline" />
                            </Card>

                            <AgroButton title="CADASTRAR PARCEIRO" onPress={handleSave} />
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
    itemCard: { marginBottom: 12 },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    avatarBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarTxt: { fontSize: 22, fontWeight: '900' },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    cardSub: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold' },
    deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: 1.5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.4 },
    emptyTxt: { color: '#6B7280', marginTop: 15, fontWeight: '700', fontSize: 14 }
});
