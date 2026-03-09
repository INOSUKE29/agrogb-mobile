import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { getCategoriasDespesa, insertCategoriaDespesa, deleteCategoriaDespesa } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

export default function CategoriasDespesaScreen() {
    const { colors } = useTheme();
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('FIXA');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCategoriasDespesa();
            setCategorias(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar as categorias.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nome) {
            Alert.alert('Atenção', 'Informe o nome da categoria.');
            return;
        }

        try {
            const id = uuidv4();
            await insertCategoriaDespesa({ id, nome: nome.trim(), tipo });
            setModalVisible(false);
            setNome('');
            setTipo('FIXA');
            loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível registrar a categoria.');
        }
    };

    const handleDelete = (id, nomeCategoria) => {
        Alert.alert(
            'Excluir Categoria',
            `Deseja realmente remover a categoria "${nomeCategoria}"?\nIsso não afetará os custos já registrados com ela.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategoriaDespesa(id);
                            loadData();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Erro', 'Não foi possível remover.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={{ padding: 20 }}
                    data={categorias}
                    keyExtractor={i => i.id}
                    ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Nenhuma categoria cadastrada.</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                <View style={[styles.badge, item.tipo === 'FIXA' ? styles.badgeYellow : styles.badgeBlue]}>
                                    <Text style={[styles.badgeText, item.tipo === 'FIXA' ? styles.badgeTextYellow : styles.badgeTextBlue]}>
                                        {item.tipo}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.nome)} style={styles.delBtn}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={28} color={colors.textOnPrimary} />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { backgroundColor: colors.modal }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>NOVA CATEGORIA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>NOME DA CATEGORIA</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                                placeholderTextColor={colors.textMuted}
                                placeholder="Ex: ENERGIA ELÉTRICA"
                                value={nome}
                                onChangeText={t => setNome(t.toUpperCase())}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>TIPO DA DESPESA</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[styles.radioBtn, { backgroundColor: colors.bg, borderColor: colors.glassBorder }, tipo === 'FIXA' && { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }]}
                                    onPress={() => setTipo('FIXA')}>
                                    <Text style={[styles.radioText, tipo === 'FIXA' && styles.radioTextActive]}>CUSTO FIXO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.radioBtn, { backgroundColor: colors.bg, borderColor: colors.glassBorder }, tipo === 'VARIÁVEL' && { borderColor: '#3B82F6', backgroundColor: '#DBEAFE' }]}
                                    onPress={() => setTipo('VARIÁVEL')}>
                                    <Text style={[styles.radioText, tipo === 'VARIÁVEL' && styles.radioTextActive]}>CUSTO VARIÁVEL</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                            <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>SALVAR CATEGORIA</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    empty: { textAlign: 'center', marginTop: 40 },
    card: { padding: 20, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    badgeYellow: { backgroundColor: '#FEF3C7' },
    badgeTextYellow: { color: '#D97706' },
    badgeBlue: { backgroundColor: '#DBEAFE' },
    badgeTextBlue: { color: '#2563EB' },
    delBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOpacity: 0.3, shadowRadius: 10 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    field: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 15 },

    radioGroup: { flexDirection: 'row', gap: 10 },
    radioBtn: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 16 },
    radioText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    radioTextActive: { color: '#111827' },

    saveBtn: { paddingVertical: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
    saveBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
