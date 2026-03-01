import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, getClientes, deleteCliente } from '../database/database';

export default function ClientesScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cpf, setCpf] = useState('');

    useEffect(() => { loadData(); }, []);

    const up = (t, setter) => setter(t.toUpperCase());

    const loadData = async () => {
        setLoading(true);
        try { const data = await getClientes(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Erro', 'Nome do cliente é obrigatório.');
        try {
            await insertCliente({ uuid: uuidv4(), nome, telefone, endereco, cpf_cnpj: cpf, observacao: '' });
            setModalVisible(false); setNome(''); setTelefone(''); setEndereco(''); setCpf(''); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar cliente.'); }
    };

    const handleDelete = (id) => {
        Alert.alert('Excluir Contato', 'Remover este parceiro da base de dados?', [
            { text: 'Cancelar' }, { text: 'Remover', style: 'destructive', onPress: async () => { await deleteCliente(id); loadData(); } }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>CLIENTES E PARCEIROS</Text>
                <Text style={styles.sub}>Gestão de Contatos Comerciais</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color="#EC4899" style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nome.charAt(0)}</Text></View>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.nome}</Text>
                                <Text style={styles.cardSub}>{item.telefone || 'SEM TELEFONE'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Text style={styles.delIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum cliente cadastrado.</Text>}
                />}

            <TouchableOpacity style={[styles.fab, { backgroundColor: '#EC4899' }]} onPress={() => setModalVisible(true)}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>NOVO PARCEIRO</Text>

                        <Text style={styles.label}>NOME COMPLETO / EMPRESA *</Text>
                        <TextInput style={styles.input} value={nome} onChangeText={t => up(t, setNome)} autoCapitalize="characters" />

                        <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
                        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

                        <Text style={styles.label}>ENDEREÇO / LOCALIZAÇÃO</Text>
                        <TextInput style={styles.input} value={endereco} onChangeText={t => up(t, setEndereco)} autoCapitalize="characters" />

                        <Text style={styles.label}>CPF / CNPJ</Text>
                        <TextInput style={styles.input} value={cpf} onChangeText={setCpf} />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={[styles.btn, styles.btnBack]} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>VOLTAR</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#1F8A5B' }]} onPress={handleSave}><Text style={[styles.btnText, { color: '#FFF' }]}>SALVAR</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F5' },
    header: { padding: 22, paddingTop: 48 },
    title: { fontSize: 22, fontWeight: '900', color: '#1E1E1E' },
    sub: { fontSize: 11, color: '#6E6E6E', letterSpacing: 0.5, marginTop: 5 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#D8F0E5', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarTxt: { fontSize: 18, fontWeight: 'bold', color: '#1F8A5B' },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E1E1E' },
    cardSub: { fontSize: 12, color: '#6E6E6E', marginTop: 3 },
    delIcon: { color: '#E74C3C', fontWeight: 'bold', fontSize: 18, padding: 10 },
    fab: { position: 'absolute', bottom: 26, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, backgroundColor: '#1F8A5B', shadowColor: '#176E46', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
    fabText: { fontSize: 32, color: '#FFF', lineHeight: 38 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
    modal: { backgroundColor: '#FFF', borderRadius: 22, padding: 28 },
    modalTitle: { fontSize: 17, fontWeight: '900', marginBottom: 22, color: '#1E1E1E' },
    label: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, fontSize: 15, color: '#1E1E1E' },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
    btn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnBack: { backgroundColor: '#F0F4F1' },
    btnText: { fontWeight: '700', fontSize: 13, color: '#6E6E6E' },
    empty: { textAlign: 'center', marginTop: 100, color: '#6E6E6E' }
});

