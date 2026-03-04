import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { getCategoriasDespesa, insertCategoriaDespesa, deleteCategoriaDespesa } from '../database/database';

export default function CategoriasDespesaScreen({ navigation }) {
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
        <View style={styles.container}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#DC2626" />
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={{ padding: 20 }}
                    data={categorias}
                    keyExtractor={i => i.id}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria cadastrada.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cTitle}>{item.nome}</Text>
                                <View style={[styles.badge, item.tipo === 'FIXA' ? styles.badgeYellow : styles.badgeBlue]}>
                                    <Text style={[styles.badgeText, item.tipo === 'FIXA' ? styles.badgeTextYellow : styles.badgeTextBlue]}>
                                        {item.tipo}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.nome)} style={styles.delBtn}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVA CATEGORIA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>NOME DA CATEGORIA</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: ENERGIA ELÉTRICA"
                                value={nome}
                                onChangeText={t => setNome(t.toUpperCase())}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>TIPO DA DESPESA</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[styles.radioBtn, tipo === 'FIXA' && styles.radioActiveYellow]}
                                    onPress={() => setTipo('FIXA')}>
                                    <Text style={[styles.radioText, tipo === 'FIXA' && styles.radioTextActive]}>CUSTO FIXO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.radioBtn, tipo === 'VARIÁVEL' && styles.radioActiveBlue]}
                                    onPress={() => setTipo('VARIÁVEL')}>
                                    <Text style={[styles.radioText, tipo === 'VARIÁVEL' && styles.radioTextActive]}>CUSTO VARIÁVEL</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>SALVAR CATEGORIA</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    empty: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    badgeYellow: { backgroundColor: '#FEF3C7' },
    badgeTextYellow: { color: '#D97706' },
    badgeBlue: { backgroundColor: '#DBEAFE' },
    badgeTextBlue: { color: '#2563EB' },
    delBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },

    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#DC2626', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#DC2626', shadowOpacity: 0.3, shadowRadius: 10 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    field: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 15, color: '#111827' },

    radioGroup: { flexDirection: 'row', gap: 10 },
    radioBtn: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16 },
    radioActiveYellow: { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' },
    radioActiveBlue: { borderColor: '#3B82F6', backgroundColor: '#DBEAFE' },
    radioText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
    radioTextActive: { color: '#111827' },

    saveBtn: { backgroundColor: '#111827', paddingVertical: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
