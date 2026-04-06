import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, 
    Alert, SafeAreaView, Platform, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function NovaEncomendaScreen({ route }) {
    const navigation = useNavigation();

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

    const [activeField, setActiveField] = useState(null);

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
                    [clienteId, produtoId, unidade, qtdTotal, novaRestante, valUnit, dataPrevista, novoStatus, observacao, now, editingId]
                );
            } else {
                const novoId = uuidv4();
                await executeQuery(
                    `INSERT INTO orders (id, cliente_id, produto_id, unidade, quantidade_total, quantidade_restante, valor_unitario, data_prevista, status, observacao, created_at, is_deleted, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, 0, 0)`,
                    [novoId, clienteId, produtoId, unidade, qtdTotal, qtdTotal, valUnit, dataPrevista, observacao, now]
                );
            }
            navigation.goBack();
        } catch (error) {
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
                    await executeQuery(`UPDATE orders SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE id = ?`, [new Date().toISOString(), editingId]);
                    navigation.goBack();
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            
            {/* Minimalist Neo-Brutal Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{editingId ? 'Editar Encomenda' : 'Nova Encomenda'}</Text>
                    <Text style={styles.headerSubtitle}>Setup de Operação Logística</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                    {/* Linha de brilho no topo do card */}
                    <LinearGradient colors={['rgba(52, 211, 153, 0.4)', 'transparent']} style={styles.cardTopGlow} />

                    <View style={styles.cardInner}>
                        
                        {/* CLIENTE */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="person-circle-outline" size={16} color="#34D399" />
                                <Text style={styles.label}>Cliente Destino <Text style={{color: '#F87171'}}>*</Text></Text>
                            </View>
                            <View style={[styles.inputContainer, activeField === 'cliente' && styles.inputContainerActive]}>
                                <Picker
                                    selectedValue={clienteId}
                                    onValueChange={(val) => setClienteId(val)}
                                    style={styles.picker}
                                    onFocus={() => setActiveField('cliente')}
                                    onBlur={() => setActiveField(null)}
                                >
                                    <Picker.Item label="Selecione o cliente da rota..." value="" color="#94A3B8" />
                                    {clientes.map(c => <Picker.Item key={c.uuid} label={c.nome} value={c.uuid} color="#FFF" />)}
                                </Picker>
                            </View>
                        </View>

                        {/* PRODUTO */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="cube-outline" size={16} color="#3B82F6" />
                                <Text style={styles.label}>Produto/Carga <Text style={{color: '#F87171'}}>*</Text></Text>
                            </View>
                            <View style={[styles.inputContainer, activeField === 'produto' && styles.inputContainerActive]}>
                                <Picker
                                    selectedValue={produtoId}
                                    onValueChange={(val) => setProdutoId(val)}
                                    style={styles.picker}
                                    onFocus={() => setActiveField('produto')}
                                    onBlur={() => setActiveField(null)}
                                >
                                    <Picker.Item label="O que vamos entregar?..." value="" color="#94A3B8" />
                                    {produtos.map(p => <Picker.Item key={p.uuid} label={p.nome} value={p.uuid} color="#FFF" />)}
                                </Picker>
                            </View>
                        </View>

                        {/* UNIDADE E QUANTIDADE */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="scale-outline" size={16} color="#A78BFA" />
                                    <Text style={styles.label}>Unidade</Text>
                                </View>
                                <View style={[styles.inputContainer, activeField === 'unidade' && styles.inputContainerActive]}>
                                    <Picker
                                        selectedValue={unidade}
                                        onValueChange={(val) => setUnidade(val)}
                                        style={styles.picker}
                                        onFocus={() => setActiveField('unidade')}
                                        onBlur={() => setActiveField(null)}
                                    >
                                        <Picker.Item label="CAIXA (CX)" value="CAIXA" color="#FFF" />
                                        <Picker.Item label="QUILO (KG)" value="KG" color="#FFF"/>
                                        <Picker.Item label="LITRO (LT)" value="LITRO" color="#FFF"/>
                                        <Picker.Item label="METROS (M)" value="METRO" color="#FFF"/>
                                        <Picker.Item label="UNIDADE (UN)" value="UNIDADE" color="#FFF"/>
                                        <Picker.Item label="SACO (SC)" value="SACO" color="#FFF"/>
                                        <Picker.Item label="GRAMAS (G)" value="GRAMAS" color="#FFF"/>
                                        <Picker.Item label="TONELADA (TON)" value="TONELADA" color="#FFF"/>
                                    </Picker>
                                </View>
                            </View>
                            <View style={styles.col}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="bar-chart-outline" size={16} color="#FBBF24" />
                                    <Text style={styles.label}>Quantidade <Text style={{color: '#F87171'}}>*</Text></Text>
                                </View>
                                <View style={[styles.inputContainer, activeField === 'qtd' && styles.inputContainerActive]}>
                                    <TextInput
                                        style={styles.textInputFull}
                                        placeholder="0"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                        value={quantidade}
                                        onChangeText={setQuantidade}
                                        onFocus={() => setActiveField('qtd')}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    <Text style={styles.unitSuffix}>{unidade === 'CAIXA' ? 'CX' : unidade}</Text>
                                </View>
                            </View>
                        </View>

                        {/* VALOR E DATA */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="cash-outline" size={16} color="#10B981" />
                                    <Text style={styles.label}>Valor Unit. (R$)</Text>
                                </View>
                                <View style={[styles.inputContainer, activeField === 'valor' && styles.inputContainerActive]}>
                                    <Text style={styles.currencyPrefix}>R$</Text>
                                    <TextInput
                                        style={[styles.textInputFull, { paddingLeft: 0 }]}
                                        placeholder="0,00"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                        value={valorUnitario}
                                        onChangeText={setValorUnitario}
                                        onFocus={() => setActiveField('valor')}
                                        onBlur={() => setActiveField(null)}
                                    />
                                </View>
                            </View>
                            <View style={styles.col}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#F472B6" />
                                    <Text style={styles.label}>Previsto para</Text>
                                </View>
                                <View style={[styles.inputContainer, activeField === 'data' && styles.inputContainerActive]}>
                                    <TextInput
                                        style={styles.textInputFull}
                                        placeholder="DD/MM/AAAA"
                                        placeholderTextColor="#475569"
                                        value={dataPrevista}
                                        onChangeText={setDataPrevista}
                                        onFocus={() => setActiveField('data')}
                                        onBlur={() => setActiveField(null)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* OBSERVACOES */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="document-text-outline" size={16} color="#94A3B8" />
                                <Text style={styles.label}>Instruções Relevantes</Text>
                            </View>
                            <View style={[styles.inputContainer, styles.textAreaContainer, activeField === 'obs' && styles.inputContainerActive]}>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Informações para a transportadora ou motorista..."
                                    placeholderTextColor="#475569"
                                    multiline
                                    numberOfLines={4}
                                    value={observacao}
                                    onChangeText={setObservacao}
                                    onFocus={() => setActiveField('obs')}
                                    onBlur={() => setActiveField(null)}
                                />
                            </View>
                        </View>

                        {/* BOTOES */}
                        <TouchableOpacity style={styles.saveBtnOuter} activeOpacity={0.8} onPress={handleSalvar}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.saveBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                                <Ionicons name="rocket-outline" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>{editingId ? 'ATUALIZAR DADOS' : 'LANÇAR ENCOMENDA'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {editingId && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleExcluir}>
                                <Ionicons name="trash-outline" size={18} color="#F87171" />
                                <Text style={styles.deleteBtnText}>Cancelar e Apagar Resgistro</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </BlurView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#040914' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
        paddingBottom: 25,
        zIndex: 10
    },
    backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
    headerSubtitle: { color: '#34D399', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
    
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    glassCard: { 
        borderRadius: 24, 
        overflow: 'hidden', 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)', // Base escura translúcida
    },
    cardTopGlow: { height: 1.5, width: '100%', position: 'absolute', top: 0 },
    cardInner: { padding: 24 },
    
    fieldGroup: { marginBottom: 22 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 22 },
    col: { flex: 1 },
    
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    label: { color: '#E2E8F0', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    // Inputs (Fake Web <select> bugfix logic applied here)
    inputContainer: {
        backgroundColor: '#0B111A',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    inputContainerActive: {
        borderColor: '#34D399',
        backgroundColor: '#0B151F',
        shadowColor: '#34D399',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    
    picker: {
        height: 56,
        width: '100%',
        color: '#FFF',
        backgroundColor: 'transparent',
        // Resets standard web select styles:
        ...Platform.select({
            web: { 
                borderWidth: 0, 
                outlineStyle: 'none',
                paddingHorizontal: 16,
                cursor: 'pointer'
            }
        })
    },
    
    textInputFull: {
        flex: 1,
        height: 56,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 16,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    
    unitSuffix: { color: '#64748B', fontWeight: '800', marginRight: 16, fontSize: 12 },
    currencyPrefix: { color: '#10B981', fontWeight: '800', marginLeft: 16, marginRight: 4, opacity: 0.8 },
    
    textAreaContainer: { height: 'auto', minHeight: 120, alignItems: 'flex-start' },
    textArea: {
        flex: 1,
        width: '100%',
        color: '#FFF',
        fontSize: 15,
        padding: 16,
        textAlignVertical: 'top',
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },

    saveBtnOuter: { marginTop: 10, shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
    saveBtnGradient: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    
    deleteBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        backgroundColor: 'transparent',
    },
    deleteBtnText: { color: '#F87171', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }
});
