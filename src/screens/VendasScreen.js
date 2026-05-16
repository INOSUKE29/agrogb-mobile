import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getCadastro, getClientes, insertCliente, getVendasRecentes, deleteVenda, updateVenda } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function VendasScreen({ navigation }) {
    const { theme } = useTheme();
    const [cliente, setCliente] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [editingUuid, setEditingUuid] = useState(null);

    // Data State
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({ total: 0, count: 0 });
    const [loading, setLoading] = useState(true);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [newClientModal, setNewClientModal] = useState(false);

    // Lists
    const [items, setItems] = useState([]);
    const [clients, setClients] = useState([]);

    // Search
    const [searchText, setSearchText] = useState('');
    const [clientSearchText, setClientSearchText] = useState('');

    // New Client Form State
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            setItems(allItems.filter(i => i.vendavel == 1));
            
            const allClients = await getClientes();
            setClients(allClients);

            const data = await getVendasRecentes();
            setHistory(data);

            // Calcular resumo do dia
            const today = new Date().toISOString().split('T')[0];
            const todaySales = data.filter(v => v.data === today);
            const total = todaySales.reduce((acc, curr) => acc + (curr.valor * curr.quantidade), 0);
            setSummary({ total, count: todaySales.length });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const salvar = async () => {
        if (!produto || !quantidade || !valor) {
            Alert.alert('Atenção', 'Produto, Qtd e Valor são obrigatórios.');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            cliente: (cliente || 'BALCÃO').toUpperCase(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            valor: parseFloat(valor),
            observacao: observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0]
        };

        try {
            if (editingUuid) {
                await updateVenda(editingUuid, dados);
                Alert.alert('Sucesso', 'Venda atualizada!');
                setEditingUuid(null);
            } else {
                await insertVenda(dados);
                
                // Automação: Gerar Conta a Receber
                await executeQuery(
                    'INSERT INTO financeiro_transacoes (uuid, tipo, descricao, valor, vencimento, entidade_nome, categoria, origem_uuid, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'RECEBER', `VENDA: ${dados.produto}`, dados.valor * dados.quantidade, dados.data, dados.cliente, 'VENDAS', dados.uuid, new Date().toISOString()]
                );

                Alert.alert('Sucesso', 'Venda registrada e gerada no Contas a Receber!');
            }

            setProduto('');
            setQuantidade('');
            setValor('');
            setObservacao('');
            setCliente('');
            loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao processar venda.');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Deseja excluir esta venda?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    await deleteVenda(item.uuid);
                    loadData();
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#10B981'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', theme?.colors?.primaryDeep || '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>FLUXO DE VENDAS</Text>
                    <View style={{ width: 24 }} />
                </View>
                
                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Vendas Hoje" 
                        value={summary.count.toString()} 
                        icon="cart" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                    <MetricCard 
                        title="Total R$" 
                        value={summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                        icon="cash" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>{editingUuid ? 'EDITAR REGISTRO' : 'NOVA VENDA'}</Text>
                    
                    <AgroInput 
                        label="Cliente / Parceiro"
                        value={cliente}
                        placeholder="SELECIONAR OU BALCÃO"
                        icon="people"
                        style={{ marginBottom: 10 }}
                        editable={false}
                        onPressIn={() => setClientModalVisible(true)}
                    />

                    <AgroInput 
                        label="Produto Sold *"
                        value={produto}
                        placeholder="SELECIONAR PRODUTO..."
                        icon="cube"
                        style={{ marginBottom: 10 }}
                        editable={false}
                        onPressIn={() => setModalVisible(true)}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="Qtd *"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="Valor Unit. R$ *"
                                value={valor}
                                onChangeText={setValor}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <AgroInput 
                        label="Observação"
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        placeholder="DETALHES ADICIONAIS..."
                        icon="document-text"
                        style={{ marginBottom: 20 }}
                    />

                    <AgroButton 
                        title={editingUuid ? "SALVAR ALTERAÇÕES" : "REGISTRAR VENDA"}
                        onPress={salvar}
                        variant={editingUuid ? 'secondary' : 'primary'}
                    />
                </Card>

                <Text style={styles.historyTitle}>HISTÓRICO RECENTE</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.historyCard} noPadding>
                        <View style={styles.historyContent}>
                            <View style={styles.historyIcon}>
                                <Ionicons name="receipt" size={20} color={theme?.colors?.primary || '#10B981'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.hProd}>{item.produto}</Text>
                                <Text style={styles.hSub}>{item.cliente} • {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                                <Text style={styles.hVal}>{item.quantidade} x R$ {item.valor.toFixed(2)}</Text>
                            </View>
                            <View style={styles.historyActions}>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            {/* MODALS (Product and Client) kept as they are functional */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." value={searchText} onChangeText={t => up(t, setSearchText)} />
                        <FlatList
                            data={items.filter(i => i.nome.includes(searchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setProduto(item.nome); setModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.unidade}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={clientModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR CLIENTE</Text>
                            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar cliente..." value={clientSearchText} onChangeText={t => up(t, setClientSearchText)} />
                        <FlatList
                            data={clients.filter(c => c.nome.includes(clientSearchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.telefone || 'Sem telefone'}</Text>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}>
                                    <Text style={styles.itemText}>BALCÃO / AVULSO</Text>
                                    <Text style={styles.itemSub}>Sem cadastro prévio</Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 },
    formCard: { padding: 20 },
    row: { flexDirection: 'row' },
    historyTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    historyCard: { marginBottom: 12 },
    historyContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    historyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    hProd: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    hSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: '#10B981', marginTop: 4 },
    historyActions: { marginLeft: 10 },
    actionBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    searchBar: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    itemSub: { fontSize: 10, color: '#9CA3AF' }
});
