import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getCadastro, getClientes, insertCliente, getVendasRecentes, deleteVenda, updateVenda, executeQuery } from '../database/database';
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
    const activeColors = theme?.colors || {};
    
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

    // Lists
    const [items, setItems] = useState([]);
    const [clients, setClients] = useState([]);

    // Search
    const [searchText, setSearchText] = useState('');
    const [clientSearchText, setClientSearchText] = useState('');

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

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    if (loading) {
        return (
            <View style={[styles.loading, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
                <ActivityIndicator size="large" color={activeColors.primary || '#10B981'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={[activeColors.primary || '#10B981', activeColors.primaryDeep || '#059669']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>FLUXO DE VENDAS</Text>
                        <View style={{ width: 38 }} />
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
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Card style={styles.formCard}>
                    <Text style={[styles.sectionTitle, { color: textMutedColor }]}>{editingUuid ? 'EDITAR REGISTRO' : 'NOVA VENDA'}</Text>
                    
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

                <Text style={[styles.historyTitle, { color: textColor }]}>HISTÓRICO RECENTE</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.historyCard} noPadding>
                        <View style={styles.historyContent}>
                            <View style={[styles.historyIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F9FAFB' }]}>
                                <Ionicons name="receipt" size={20} color={activeColors.primary || '#10B981'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.hProd, { color: textColor }]}>{item.produto}</Text>
                                <Text style={[styles.hSub, { color: textMutedColor }]}>{item.cliente} • {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                                <Text style={[styles.hVal, { color: activeColors.primary || '#10B981' }]}>{item.quantidade} x R$ {item.valor.toFixed(2)}</Text>
                            </View>
                            <View style={styles.historyActions}>
                                <TouchableOpacity 
                                    onPress={() => handleDelete(item)} 
                                    style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
                                >
                                    <Ionicons name="trash-outline" size={18} color={activeColors.error || '#EF4444'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>SELECIONAR PRODUTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={textMutedColor} />
                            </TouchableOpacity>
                        </View>
                        <TextInput 
                            style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: textColor }]} 
                            placeholder="Buscar..." 
                            placeholderTextColor={textMutedColor} 
                            value={searchText} 
                            onChangeText={t => up(t, setSearchText)} 
                        />
                        <FlatList
                            data={items.filter(i => i.nome.includes(searchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.itemRow, { borderBottomColor: borderCol }]} onPress={() => { setProduto(item.nome); setModalVisible(false); }}>
                                    <Text style={[styles.itemText, { color: textColor }]}>{item.nome}</Text>
                                    <Text style={[styles.itemSub, { color: textMutedColor }]}>{item.unidade}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={clientModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>SELECIONAR CLIENTE</Text>
                            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                                <Ionicons name="close" size={24} color={textMutedColor} />
                            </TouchableOpacity>
                        </View>
                        <TextInput 
                            style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: textColor }]} 
                            placeholder="Buscar cliente..." 
                            placeholderTextColor={textMutedColor} 
                            value={clientSearchText} 
                            onChangeText={t => up(t, setClientSearchText)} 
                        />
                        <FlatList
                            data={clients.filter(c => c.nome.includes(clientSearchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.itemRow, { borderBottomColor: borderCol }]} onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}>
                                    <Text style={[styles.itemText, { color: textColor }]}>{item.nome}</Text>
                                    <Text style={[styles.itemSub, { color: textMutedColor }]}>{item.telefone || 'Sem telefone'}</Text>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <TouchableOpacity style={[styles.itemRow, { borderBottomColor: borderCol }]} onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}>
                                    <Text style={[styles.itemText, { color: textColor }]}>BALCÃO / AVULSO</Text>
                                    <Text style={[styles.itemSub, { color: textMutedColor }]}>Sem cadastro prévio</Text>
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
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
    formCard: { padding: 20 },
    row: { flexDirection: 'row' },
    historyTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    historyCard: { marginBottom: 12 },
    historyContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    historyIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    hProd: { fontSize: 14, fontWeight: 'bold' },
    hSub: { fontSize: 11, marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', marginTop: 4 },
    historyActions: { marginLeft: 10 },
    actionBtn: { padding: 8, borderRadius: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalBg: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900' },
    searchBar: { padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1 },
    itemText: { fontSize: 14, fontWeight: 'bold' },
    itemSub: { fontSize: 10 }
});
