import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../theme/ThemeContext';

export default function NovaEncomendaScreen({ route }) {
    const navigation = useNavigation();
    const { colors } = useTheme();

    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);

    const [clienteId, setClienteId] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [unidade, setUnidade] = useState('CAIXA');
    const [quantidade, setQuantidade] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [dataPrevista, setDataPrevista] = useState('');
    const [observacao, setObservacao] = useState('');

    // Edição
    const [editingId, setEditingId] = useState(null);
    const [oldQuantidadeTotal, setOldQuantidadeTotal] = useState(0);
    const [oldQuantidadeRestante, setOldQuantidadeRestante] = useState(0);

    useEffect(() => {
        loadData().then(() => {
            if (route.params?.encomenda) {
                const enc = route.params.encomenda;
                setEditingId(enc.id);
                setClienteId(enc.cliente_id);
                setProdutoId(enc.produto_id);
                setUnidade(enc.unidade);
                setQuantidade(enc.quantidade_total.toString());
                setValorUnitario(enc.valor_unitario ? enc.valor_unitario.toString() : '');
                setDataPrevista(enc.data_prevista || '');
                setObservacao(enc.observacao || '');

                setOldQuantidadeTotal(enc.quantidade_total);
                setOldQuantidadeRestante(enc.quantidade_restante);
            }
        });
    }, [route.params]);

    const loadData = async () => {
        try {
            const resCli = await executeQuery('SELECT uuid, nome FROM clientes WHERE is_deleted = 0 ORDER BY nome');
            const dataCli = [];
            for (let i = 0; i < resCli.rows.length; i++) dataCli.push(resCli.rows.item(i));
            setClientes(dataCli);

            const resProd = await executeQuery('SELECT uuid, nome FROM cadastro WHERE is_deleted = 0 AND vendavel = 1 ORDER BY nome');
            const dataProd = [];
            for (let i = 0; i < resProd.rows.length; i++) dataProd.push(resProd.rows.item(i));
            setProdutos(dataProd);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar as listas.');
        }
    };

    // Auto-detectar unidade base (Congelado = KG) -> Placeholder simple rule: name includes "congelado" -> KG
    const onProdutoChange = (pid) => {
        setProdutoId(pid);
        const prod = produtos.find(p => p.uuid === pid);
        if (prod && prod.nome.toLowerCase().includes('congelado')) {
            setUnidade('KG');
        } else {
            setUnidade('CAIXA');
        }
    };

    const handleSalvar = async () => {
        if (!clienteId || !produtoId || !quantidade) {
            Alert.alert('Atenção', 'Preencha Cliente, Produto e Quantidade.');
            return;
        }

        const qtdTotal = parseFloat(quantidade.replace(',', '.'));
        if (isNaN(qtdTotal) || qtdTotal <= 0) {
            Alert.alert('Atenção', 'Quantidade inválida.');
            return;
        }

        const valUnit = valorUnitario ? parseFloat(valorUnitario.replace(',', '.')) : 0;

        try {
            const now = new Date().toISOString();

            if (editingId) {
                // Cálculo de nova quantidade restante caso a total tenha mudado
                const diff = qtdTotal - oldQuantidadeTotal;
                let novaRestante = oldQuantidadeRestante + diff;
                if (novaRestante < 0) novaRestante = 0;

                let novoStatus = novaRestante <= 0 ? 'CONCLUIDA' : (novaRestante < qtdTotal ? 'PARCIAL' : 'PENDENTE');

                await executeQuery(
                    `UPDATE orders SET 
                        cliente_id = ?, produto_id = ?, unidade = ?, 
                        quantidade_total = ?, quantidade_restante = ?, 
                        valor_unitario = ?, data_prevista = ?, status = ?, 
                        observacao = ?, last_updated = ?, sync_status = 0
                    WHERE id = ?`,
                    [
                        clienteId,
                        produtoId,
                        unidade,
                        qtdTotal,
                        novaRestante,
                        valUnit,
                        dataPrevista,
                        novoStatus,
                        observacao,
                        now,
                        editingId
                    ]
                );
                Alert.alert('Sucesso', 'Encomenda atualizada com sucesso!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                const novoId = uuidv4();
                await executeQuery(
                    `INSERT INTO orders (
                        id, cliente_id, produto_id, unidade, quantidade_total,
                        quantidade_restante, valor_unitario, data_prevista,
                        status, observacao, created_at, is_deleted, sync_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, 0, 0)`,
                    [
                        novoId,
                        clienteId,
                        produtoId,
                        unidade,
                        qtdTotal,
                        qtdTotal, // restante começa igual a total
                        valUnit,
                        dataPrevista,
                        observacao,
                        now
                    ]
                );
                Alert.alert('Sucesso', 'Encomenda registrada com sucesso!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }

        } catch (error) {
            console.error('Erro salvar encomenda:', error);
            Alert.alert('Erro', 'Não foi possível salvar a encomenda.');
        }
    };

    const handleExcluir = () => {
        Alert.alert('Excluir', 'Deseja realmente apagar esta encomenda?', [
            { text: 'Não', style: 'cancel' },
            {
                text: 'Sim',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await executeQuery(`UPDATE orders SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE id = ?`, [new Date().toISOString(), editingId]);
                        Alert.alert('Sucesso', 'Encomenda apagada!');
                        navigation.goBack();
                    } catch {
                        Alert.alert('Erro', 'Falha ao apagar.');
                    }
                }
            }
        ]);
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={clienteId}
                        onValueChange={(val) => setClienteId(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Selecione um Cliente..." value="" />
                        {clientes.map(c => (
                            <Picker.Item key={c.uuid} label={c.nome} value={c.uuid} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Produto *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={produtoId}
                        onValueChange={(val) => onProdutoChange(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Selecione um Produto..." value="" />
                        {produtos.map(p => (
                            <Picker.Item key={p.uuid} label={p.nome} value={p.uuid} />
                        ))}
                    </Picker>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Unidade *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={unidade}
                                onValueChange={(itemValue) => setUnidade(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="CAIXA" value="CAIXA" />
                                <Picker.Item label="KG" value="KG" />
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Quant. Total *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 50"
                            keyboardType="numeric"
                            value={quantidade}
                            onChangeText={setQuantidade}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Valor Unit. (R$)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 35.00"
                            keyboardType="numeric"
                            value={valorUnitario}
                            onChangeText={setValorUnitario}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Previsto para</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            value={dataPrevista}
                            onChangeText={setDataPrevista}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Observações Extras</Text>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Detalhes específicos para essa encomenda..."
                    multiline
                    numberOfLines={3}
                    value={observacao}
                    onChangeText={setObservacao}
                />

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSalvar}
                >
                    <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>{editingId ? 'Atualizar Encomenda' : 'Salvar Encomenda'}</Text>
                </TouchableOpacity>

                {editingId && (
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: '#EF4444', marginTop: 15 }]}
                        onPress={handleExcluir}
                    >
                        <Ionicons name="trash-outline" size={24} color="#FFF" />
                        <Text style={styles.buttonText}>Apagar Encomenda</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F5', padding: 14 },
    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 24,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
    },
    label: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9',
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#1E1E1E',
    },
    pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, overflow: 'hidden' },
    picker: { height: 50, width: '100%', color: '#1E1E1E' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    col: { flex: 0.48 },
    saveButton: {
        flexDirection: 'row', paddingVertical: 16, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginTop: 22,
    },
    buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 10 },
});
