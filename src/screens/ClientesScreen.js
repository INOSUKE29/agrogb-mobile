import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, getClientes, deleteCliente } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import GlowFAB from '../ui/GlowFAB';
import { MODAL_OVERLAY } from '../styles/themes';
import { useTheme } from '../theme/ThemeContext';
import ConfirmModal from '../ui/ConfirmModal';
import { showToast } from '../ui/Toast';

export default function ClientesScreen({ navigation }) {
    const { colors } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cpf, setCpf] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [obs, setObs] = useState('');

    useEffect(() => { loadData(); }, []);

    const up = (t, setter) => setter(t.toUpperCase());

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            const uniqueData = [...new Map(data.map(item => [item.cpf_cnpj ? item.cpf_cnpj.trim() : item.nome.trim().toUpperCase(), item])).values()];
            setItems(uniqueData);
        } catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Erro', 'Nome do cliente é obrigatório.');
        try {
            await insertCliente({
                uuid: uuidv4(),
                nome,
                telefone,
                endereco,
                cpf_cnpj: cpf,
                cidade,
                estado,
                observacao: obs
            });
            setModalVisible(false);
            resetForm();
            loadData();
            showToast('Cliente cadastrado!');
        } catch (e) { Alert.alert('Erro', e?.message || 'Falha ao salvar cliente.'); }
    };

    const resetForm = () => {
        setNome(''); setTelefone(''); setEndereco(''); setCpf(''); setCidade(''); setEstado(''); setObs('');
    };

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteCliente(itemToDelete);
            setConfirmVisible(false);
            setItemToDelete(null);
            loadData();
        }
    };

    return (
        <AppContainer>
            <ScreenHeader title="Clientes e Parceiros" onBack={navigation?.goBack ? () => navigation.goBack() : null} />

            {loading ? <ActivityIndicator size="large" color={colors.glow} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <GlowCard style={styles.card}>
                            <View style={[styles.avatar, { borderColor: colors.glassBorder, backgroundColor: colors.cardAlt }]}>
                                <Text style={[styles.avatarTxt, { color: colors.primary }]}>{item.nome.charAt(0)}</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.telefone || 'SEM TELEFONE'}</Text>
                                {item.cpf_cnpj ? <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.cpf_cnpj}</Text> : null}
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            </TouchableOpacity>
                        </GlowCard>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={60} color={colors.glassBorder || '#94A3B8'} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum cliente cadastrado.</Text>
                            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Toque no + para adicionar.</Text>
                        </View>
                    }
                />
            }

            <GlowFAB onPress={() => setModalVisible(true)} />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={[styles.overlay, { backgroundColor: MODAL_OVERLAY }]}>
                    <View style={[styles.modal, { backgroundColor: colors.modal, borderColor: colors.glassBorder }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>NOVO PARCEIRO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.label, { color: colors.textMuted }]}>NOME COMPLETO / EMPRESA</Text>
                        <GlowInput value={nome} onChangeText={t => up(t, setNome)} placeholder="Ex: JOÃO SILVA" />
                        <Text style={[styles.label, { color: colors.textMuted }]}>TELEFONE / WHATSAPP</Text>
                        <GlowInput value={telefone} onChangeText={setTelefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" />

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>CIDADE</Text>
                                <GlowInput value={cidade} onChangeText={t => up(t, setCidade)} placeholder="Ex: ITATIBA" />
                            </View>
                            <View style={{ width: 80 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>UF</Text>
                                <GlowInput value={estado} onChangeText={t => up(t, setEstado)} placeholder="SP" maxLength={2} />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: colors.textMuted }]}>ENDEREÇO COMPLETO</Text>
                        <GlowInput value={endereco} onChangeText={t => up(t, setEndereco)} placeholder="Rua, Bairro..." />

                        <Text style={[styles.label, { color: colors.textMuted }]}>CPF / CNPJ (OPCIONAL)</Text>
                        <GlowInput value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />

                        <Text style={[styles.label, { color: colors.textMuted }]}>OBSERVAÇÕES</Text>
                        <GlowInput value={obs} onChangeText={t => up(t, setObs)} placeholder="Detalhes do cliente..." multiline style={{ height: 60 }} />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder, backgroundColor: colors.cardAlt }]} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <PrimaryButton label="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>

            <ConfirmModal
                visible={confirmVisible}
                title="Excluir Contato"
                message={`Tem certeza que deseja remover este parceiro da base de dados? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                isDestructive={true}
                onCancel={() => { setConfirmVisible(false); setItemToDelete(null); }}
                onConfirm={confirmDelete}
            />

        </AppContainer >
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 16 },
    avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarTxt: { fontSize: 18, fontWeight: '900' },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    cardSub: { fontSize: 11, marginTop: 2 },
    cardMeta: { fontSize: 10, marginTop: 2 },
    deleteBtn: { padding: 8 },

    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: 'bold' },
    emptySub: { marginTop: 5, fontSize: 13 },

    overlay: { flex: 1, justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900' },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
