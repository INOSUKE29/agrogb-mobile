import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getVendasRecentes, deleteVenda, updateVenda, executeQuery, atualizarEstoque, inserirAlerta } from '../database/database';
import { SyncWorker } from '../services/SyncWorker';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { ClientLibraryService, ProductLibraryService } from '../services/LibraryServices';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

// Design System
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




    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
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
                
                const finUuid = uuidv4();
                await executeQuery(
                    'INSERT INTO financeiro_transacoes (uuid, tipo, descricao, valor, vencimento, entidade_nome, categoria, origem_uuid, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)',
                    [finUuid, 'RECEBER', `VENDA: ${dados.produto}`, dados.valor * dados.quantidade, dados.data, dados.cliente, 'VENDAS', dados.uuid, new Date().toISOString()]
                );

                SyncWorker.enqueue('financeiro_transacoes', 'INSERT', finUuid, {
                    uuid: finUuid,
                    tipo: 'RECEBER',
                    descricao: `VENDA: ${dados.produto}`,
                    valor: dados.valor * dados.quantidade,
                    vencimento: dados.data,
                    entidade_nome: dados.cliente,
                    categoria: 'VENDAS',
                    origem_uuid: dados.uuid,
                    last_updated: new Date().toISOString(),
                    is_deleted: 0
                });

                // Baixa não-bloqueante no estoque de produção
                const resEstoque = await atualizarEstoque(dados.produto, -dados.quantidade, dados.data);
                
                if (resEstoque?.ficouNegativo) {
                    await inserirAlerta('ESTOQUE_NEGATIVO', `O saldo de "${dados.produto}" ficou negativo após a venda de ${dados.quantidade} unidades para ${dados.cliente}. Lembre-se de registrar a colheita.`);
                    Alert.alert('⚠️ Estoque Insuficiente', `Venda registrada e Contas a Receber gerado! No entanto, o saldo do produto "${dados.produto}" ficou negativo. Lembre-se de dar entrada na colheita.`);
                } else {
                    Alert.alert('✅ Sucesso', 'Venda registrada, estoque atualizado e gerado no Contas a Receber!');
                }
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

    const isDark = true;
    const textColor = '#FFF';
    const textMutedColor = '#9CA3AF';
    const cardBg = '#1F2937';
    const borderCol = 'rgba(255,255,255,0.05)';

    if (loading) {
        return (
            <View style={[styles.loading, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
                <ActivityIndicator size="large" color={activeColors.primary || '#10B981'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
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
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.formCard}>
                    <Text style={[styles.sectionTitle, { color: textMutedColor }]}>{editingUuid ? 'EDITAR REGISTRO' : 'NOVA VENDA'}</Text>
                    
                                        <SmartAutocomplete
                        label="Cliente / Parceiro"
                        value={cliente}
                        onSelect={item => setCliente(item ? item.nome : 'BALCÃO')}
                        service={ClientLibraryService}
                        title="SELECIONAR CLIENTE"
                        placeholder="SELECIONAR OU BALCÃO..."
                        icon="people-outline"
                        quickAddFields={[
                            { key: 'nome', label: 'NOME DO CLIENTE', placeholder: 'Ex: Bruno Santos' },
                            { key: 'telefone', label: 'TELEFONE', placeholder: 'Ex: (11) 99999-9999' }
                        ]}
                    />

                    <SmartAutocomplete
                        label="Produto Sold *"
                        value={produto}
                        onSelect={item => {
                            setProduto(item ? item.nome : '');
                            if (item?.preco_venda) setValor(String(item.preco_venda));
                        }}
                        service={ProductLibraryService}
                        filterType="PRODUTO"
                        title="SELECIONAR PRODUTO"
                        placeholder="SELECIONAR PRODUTO..."
                        icon="cube-outline"
                        quickAddFields={[
                            { key: 'nome', label: 'NOME DO PRODUTO', placeholder: 'Ex: Café Moído' },
                            { key: 'tipo', label: 'TIPO', placeholder: 'Ex: PRODUTO', defaultValue: 'PRODUTO' },
                            { key: 'unidade', label: 'UNIDADE DO PRODUTO', placeholder: 'Ex: KG', defaultValue: 'KG' }
                        ]}
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
                </LinearGradient>

                <Text style={[styles.historyTitle, { color: textColor }]}>HISTÓRICO RECENTE</Text>
                {history.map(item => (
                    <LinearGradient colors={['#1F2937', '#111827']} key={item.uuid} style={styles.historyCard}>
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
                    </LinearGradient>
                ))}
            </ScrollView>

            
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
    formCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    row: { flexDirection: 'row' },
    historyTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    historyCard: { marginBottom: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
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
