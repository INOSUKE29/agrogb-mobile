import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, getClientes, deleteCliente } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import GlowFAB from '../ui/GlowFAB';
import { DARK, MODAL_OVERLAY } from '../styles/darkTheme';

export default function ClientesScreen({ navigation }) {
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
        try {
            const data = await getClientes();
            const uniqueData = [...new Map(data.map(item => [item.cpf_cnpj ? item.cpf_cnpj.trim() : item.nome.trim().toUpperCase(), item])).values()];
            setItems(uniqueData);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Erro', 'Nome do cliente é obrigatório.');
        try {
            await insertCliente({ uuid: uuidv4(), nome, telefone, endereco, cpf_cnpj: cpf, observacao: '' });
            setModalVisible(false); setNome(''); setTelefone(''); setEndereco(''); setCpf(''); loadData();
        } catch (e) { Alert.alert('Erro', e.message || 'Falha ao salvar cliente.'); }
    };

    const handleDelete = (id) => {
        Alert.alert('Excluir Contato', 'Remover este parceiro da base de dados?', [
            { text: 'Cancelar' }, { text: 'Remover', style: 'destructive', onPress: async () => { await deleteCliente(id); loadData(); } }
        ]);
    };

    return (
        <AppContainer>
            <ScreenHeader title="Clientes e Parceiros" onBack={navigation?.goBack ? () => navigation.goBack() : null} />

            {loading ? <ActivityIndicator size="large" color={DARK.glow} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <GlowCard style={styles.card}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarTxt}>{item.nome.charAt(0)}</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.nome}</Text>
                                <Text style={styles.cardSub}>{item.telefone || 'SEM TELEFONE'}</Text>
                                {item.cpf_cnpj ? <Text style={styles.cardMeta}>{item.cpf_cnpj}</Text> : null}
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={18} color={DARK.danger} />
                            </TouchableOpacity>
                        </GlowCard>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={60} color={DARK.glowBorder} />
                            <Text style={styles.emptyText}>Nenhum cliente cadastrado.</Text>
                            <Text style={styles.emptySub}>Toque no + para adicionar.</Text>
                        </View>
                    }
                />
            }

            <GlowFAB onPress={() => setModalVisible(true)} />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVO PARCEIRO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={DARK.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>NOME COMPLETO / EMPRESA</Text>
                        <GlowInput value={nome} onChangeText={t => up(t, setNome)} placeholder="Ex: JOÃO SILVA" />
                        <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
                        <GlowInput value={telefone} onChangeText={setTelefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
                        <Text style={styles.label}>ENDEREÇO</Text>
                        <GlowInput value={endereco} onChangeText={t => up(t, setEndereco)} placeholder="Rua, Bairro, Cidade" />
                        <Text style={styles.label}>CPF / CNPJ</Text>
                        <GlowInput value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <PrimaryButton label="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 16 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,255,156,0.15)', borderWidth: 1, borderColor: DARK.glowBorder, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarTxt: { fontSize: 18, fontWeight: '900', color: DARK.glow },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: DARK.textPrimary },
    cardSub: { fontSize: 11, color: DARK.textSecondary, marginTop: 2 },
    cardMeta: { fontSize: 10, color: DARK.textMuted, marginTop: 2 },
    deleteBtn: { padding: 8 },

    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: 'bold', color: DARK.textSecondary },
    emptySub: { marginTop: 5, fontSize: 13, color: DARK.textMuted },

    overlay: { flex: 1, backgroundColor: MODAL_OVERLAY, justifyContent: 'flex-end' },
    modal: { backgroundColor: DARK.modal, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DARK.glowBorder },
});
