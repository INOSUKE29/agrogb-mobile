import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCusto, getCadastro, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../ui/theme/colors';
import { Spacing } from '../ui/theme/spacing';
import { Radius } from '../ui/theme/radius';
import { AppCard } from '../ui/components/AppCard';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function CustosScreen({ navigation }) {
    const [produto, setProduto] = useState('');
    const [tipo, setTipo] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [observacao, setObservacao] = useState('');
    const [cultura, setCultura] = useState('');
    const [frotaId, setFrotaId] = useState('');

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('DESPESA'); // DESPESA | CULTURA | FROTA
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadItems(); }, []);

    const loadItems = async (type) => {
        setLoading(true);
        setModalType(type);
        try {
            if (type === 'DESPESA') {
                const all = await getCadastro();
                setItems(all.filter(i => i.tipo === 'SERVICO' || i.tipo === 'OUTRO'));
            } else if (type === 'CULTURA') {
                const res = await executeQuery('SELECT id, nome as desc FROM culturas WHERE is_deleted=0');
                setItems(res.rows._array || Array.from({ length: res.rows.length }, (_, i) => res.rows.item(i)));
            } else if (type === 'FROTA') {
                const res = await executeQuery('SELECT id, placa || " - " || modelo as desc FROM frota WHERE is_deleted=0');
                setItems(res.rows._array || Array.from({ length: res.rows.length }, (_, i) => res.rows.item(i)));
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const openModal = (type) => {
        setSearchText('');
        loadItems(type);
        setModalVisible(true);
    };

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i =>
            (i.nome && i.nome.toUpperCase().includes(searchText.toUpperCase())) ||
            (i.desc && i.desc.toUpperCase().includes(searchText.toUpperCase()))
        );
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const salvar = async () => {
        if (!produto || !quantidade || !valorTotal) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios (*)');
            return;
        }

        const dados = {
            uuid: uuidv4(),
            produto: produto.toUpperCase(),
            tipo: (tipo || 'GERAL').toUpperCase(),
            quantidade: parseFloat(quantidade) || 0,
            valor_total: parseFloat(valorTotal) || 0,
            cultura: cultura.toUpperCase(),
            frota_id: frotaId,
            observacao: observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0]
        };

        try {
            await insertCusto(dados);
            Alert.alert('Sucesso', 'Custo operacional registrado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar o custo.');
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="dark-content" backgroundColor={Colors.primaryLight} />
            <LinearGradient colors={[Colors.primaryLight, Colors.background]} style={StyleSheet.absoluteFill} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* 1. HEADER SIMPLIFICADO C/ VOLTAR */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>REGISTRAR CUSTO</Text>
                        <Text style={styles.screenSub}>Lançamento de despesas</Text>
                    </View>
                </View>

                {/* 2. CARD IDENTIFICAÇÃO DESPESA */}
                <AppCard>
                    <Text style={styles.sectionLabel}>🏷️ IDENTIFICAÇÃO DA DESPESA *</Text>
                    <TouchableOpacity style={styles.inputTrigger} onPress={() => setModalVisible(true)}>
                        <Text style={[styles.inputText, !produto && styles.placeholder]}>
                            {produto || "Selecionar serviço/despesa..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </AppCard>

                {/* 3. CARD VÍNCULOS (CULTURA E FROTA) */}
                <AppCard>
                    <Text style={styles.sectionLabel}>🔗 VINCULAÇÕES (OPCIONAL)</Text>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity style={styles.inputTrigger} onPress={() => openModal('CULTURA')}>
                                <Text style={[styles.inputText, !cultura && styles.placeholder]} numberOfLines={1}>
                                    {cultura || "Cultura..."}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity style={styles.inputTrigger} onPress={() => openModal('FROTA')}>
                                <Text style={[styles.inputText, !frotaId && styles.placeholder]} numberOfLines={1}>
                                    {frotaId || "Máquina..."}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ marginTop: 15 }}>
                        <AppInput
                            label="📂 CATEGORIA / TIPO"
                            placeholder="Tipo (Insumo, Combustível, Extra...)"
                            value={tipo}
                            onChangeText={(t) => up(t, setTipo)}
                            autoCapitalize="characters"
                            style={{ marginBottom: 0 }}
                        />
                    </View>
                </AppCard>

                {/* 4. CARD VALORES (DIVIDIDO) */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: Spacing.md }}>
                        <AppCard>
                            <AppInput
                                label="🔢 QUANTIDADE *"
                                placeholder="0"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="decimal-pad"
                                style={{ marginBottom: 0 }}
                            />
                        </AppCard>
                    </View>

                    <View style={{ flex: 1.5 }}>
                        <AppCard>
                            <AppInput
                                label="💰 VALOR TOTAL (R$) *"
                                placeholder="0,00"
                                value={valorTotal}
                                onChangeText={setValorTotal}
                                keyboardType="decimal-pad"
                                style={{ color: Colors.danger, fontWeight: 'bold', marginBottom: 0 }}
                            />
                        </AppCard>
                    </View>
                </View>

                {/* 5. CARD OBSERVAÇÕES */}
                <AppCard>
                    <AppInput
                        label="📝 OBSERVAÇÕES"
                        placeholder="Detalhes do custo..."
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        multiline
                        style={{ height: 100, textAlignVertical: 'top', marginBottom: 0 }}
                    />
                </AppCard>

            </ScrollView>

            {/* BOTÃO FLUTUANTE DE AÇÃO */}
            <View style={styles.footerContainer}>
                <AppButton
                    title="REGISTRAR CUSTO"
                    onPress={salvar}
                    style={{ marginTop: 0, backgroundColor: '#DC2626' }} // Custom red for cost
                />
            </View>

            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR DESPESA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar item..."
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                            autoCapitalize="characters"
                            placeholderTextColor={Colors.placeholder}
                        />

                        {loading ? <ActivityIndicator color={Colors.primary} /> :
                            <FlatList
                                data={getFilteredItems()}
                                keyExtractor={i => i.uuid || i.id ? i.id.toString() : Math.random().toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemRow} onPress={() => {
                                        if (modalType === 'DESPESA') setProduto(item.nome);
                                        else if (modalType === 'CULTURA') setCultura(item.desc);
                                        else if (modalType === 'FROTA') setFrotaId(item.desc);
                                        setModalVisible(false);
                                    }}>
                                        <View style={[styles.miniIcon, { backgroundColor: '#FEE2E2' }]}>
                                            <Ionicons name={modalType === 'FROTA' ? "tractor" : "pricetag-outline"} size={16} color="#DC2626" />
                                        </View>
                                        <View>
                                            <Text style={styles.itemText}>{item.nome || item.desc}</Text>
                                            <Text style={styles.itemSub}>{item.tipo || modalType}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.empty}>Nenhum item encontrado.</Text>}
                            />
                        }
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // HEADER
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    backButton: { marginRight: 15, padding: 5 },
    screenTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
    screenSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },

    // INPUTS
    inputTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: 'transparent' }, // Simplified trigger matching AppInput look
    inputText: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    placeholder: { color: Colors.placeholder },

    row: { flexDirection: 'row', paddingHorizontal: 20 }, // Added padding back since we use AppCard with built-in margin

    // FOOTER
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: '#FFF', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, elevation: 20 },

    // MODAL
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '80%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
    searchBar: { backgroundColor: Colors.inputBg, padding: 12, borderRadius: Radius.md, marginBottom: 15, fontSize: 16, color: Colors.textPrimary },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder, flexDirection: 'row', alignItems: 'center' },
    miniIcon: { width: 32, height: 32, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemText: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary },
    itemSub: { fontSize: 11, color: Colors.textSecondary },
    empty: { textAlign: 'center', marginTop: 20, color: Colors.textSecondary }
});
