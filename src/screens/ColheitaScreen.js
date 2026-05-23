import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertColheita, getCadastro, getConfig, setConfig, insertDescarte, getColheitasRecentes, updateColheita, deleteColheita, getCulturas, insertCadastro as insertCadastros, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import FriendlyModal from '../components/common/FriendlyModal';

export default function ColheitaScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [activeTab, setActiveTab] = useState('COLHEITA'); // 'COLHEITA' | 'CONGELAMENTO' | 'DESCARTE'

    // State for FriendlyModal
    const [friendlyModal, setFriendlyModal] = useState({
        visible: false,
        title: '',
        message: '',
        emoji: '🧐',
        buttonText: 'Entendido 👍'
    });

    const showFriendlyAlert = (title, message, emoji = '🧐', buttonText = 'Entendido 👍') => {
        setFriendlyModal({ visible: true, title, message, emoji, buttonText });
    };

    // Form States
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [observacao, setObservacao] = useState('');
    const [qtdCaixas, setQtdCaixas] = useState('');
    const [fatorAtual, setFatorAtual] = useState(1);

    // Congelamento Tab State
    const [congTalhao, setCongTalhao] = useState('');
    const [congProduto, setCongProduto] = useState('');
    const [congQtd, setCongQtd] = useState('');
    const [congObs, setCongObs] = useState('');

    // Descarte Tab State
    const [descProduto, setDescProduto] = useState('');
    const [descQtd, setDescQtd] = useState('');
    const [descMotivo, setDescMotivo] = useState('');
    const [descObs, setDescObs] = useState('');

    // Multi-item Temp State for Harvest Tab
    const [harvestItems, setHarvestItems] = useState([]);
    
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({ total: 0, discard: 0 });
    const [loading, setLoading] = useState(true);

    // Modal Trigger Targets
    const [modalTarget, setModalTarget] = useState(''); // 'HARVEST_PROD' | 'HARVEST_AREA' | 'CONG_PROD' | 'CONG_AREA' | 'DESC_PROD'
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemFator, setNewItemFator] = useState('1');

    // Lists
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    const [searchText, setSearchText] = useState('');

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            setProductsDB(allItems.filter(i => i.tipo === 'PRODUTO'));
            const resTalhoes = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
            const areas = [];
            for (let i = 0; i < resTalhoes.rows.length; i++) areas.push(resTalhoes.rows.item(i));
            setAreasDB(areas);
            const hist = await getColheitasRecentes();
            setHistory(hist);

            const today = new Date().toISOString().split('T')[0];
            const todayCol = hist.filter(h => h.data === today);
            const total = todayCol.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
            setSummary({ total, discard: 0 });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const handleCaixasChange = (txt) => {
        setQtdCaixas(txt);
        const boxes = parseFloat(txt) || 0;
        if (boxes > 0) {
            setQuantidade((boxes * fatorAtual).toFixed(2));
        } else {
            setQuantidade('');
        }
    };

    const handleProdutoSelect = (item) => {
        if (modalTarget === 'HARVEST_PROD') {
            setProduto(item.nome);
            setFatorAtual(item.fator_conversao || 1);
            if (qtdCaixas) {
                setQuantidade((parseFloat(qtdCaixas) * (item.fator_conversao || 1)).toFixed(2));
            }
        } else if (modalTarget === 'CONG_PROD') {
            setCongProduto(item.nome);
        } else if (modalTarget === 'DESC_PROD') {
            setDescProduto(item.nome);
        }
        setProductModalVisible(false);
    };

    const handleAreaSelect = (item) => {
        if (modalTarget === 'HARVEST_AREA') {
            setTalhao(item.nome);
        } else if (modalTarget === 'CONG_AREA') {
            setCongTalhao(item.nome);
        }
        setAreaModalVisible(false);
    };

    const addHarvestItem = () => {
        if (!produto) {
            showFriendlyAlert('Atenção', 'Escolha o produto ou a cultura que você está colhendo para adicionar na lista! 🌿', '🧐');
            return;
        }
        if (!quantidade || parseFloat(quantidade) <= 0) {
            showFriendlyAlert('Quantidade Inválida', 'Preencha uma quantidade maior que zero para o produto colhido! ⚖️', '🧐');
            return;
        }

        const newItem = {
            id: uuidv4(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            qtdCaixas: parseFloat(qtdCaixas) || 0,
            fator: fatorAtual
        };

        setHarvestItems([...harvestItems, newItem]);
        
        // Reset Item fields
        setProduto('');
        setQuantidade('');
        setQtdCaixas('');
        setFatorAtual(1);
    };

    const removeHarvestItem = (id) => {
        setHarvestItems(harvestItems.filter(item => item.id !== id));
    };

    const editHarvestItem = (item) => {
        setProduto(item.produto);
        setQuantidade(item.quantidade.toString());
        setQtdCaixas(item.qtdCaixas > 0 ? item.qtdCaixas.toString() : '');
        setFatorAtual(item.fator);
        removeHarvestItem(item.id);
    };

    const updateStock = async (prod, qty, isAddition = true) => {
        try {
            const check = await executeQuery('SELECT * FROM estoque WHERE produto = ?', [prod]);
            if (check.rows.length > 0) {
                const current = check.rows.item(0).quantidade;
                const newQty = isAddition ? (current + qty) : Math.max(0, current - qty);
                await executeQuery('UPDATE estoque SET quantidade = ?, last_updated = ? WHERE produto = ?', 
                    [newQty, new Date().toISOString(), prod]);
            } else if (isAddition) {
                await executeQuery('INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)', 
                    [prod, qty, new Date().toISOString()]);
            }
        } catch (e) {
            console.error('Falha ao atualizar estoque:', e);
        }
    };

    const salvarColheita = async () => {
        if (!talhao) {
            showFriendlyAlert('Localização Faltando', 'Não se esqueça de selecionar a área ou talhão da colheita! 🚜', '📍');
            return;
        }
        if (harvestItems.length === 0) {
            showFriendlyAlert('Lista Vazia', 'Adicione pelo menos um produto colhido à sua lista antes de salvar! 🧺', '🧐');
            return;
        }

        Alert.alert(
            'Enviar para Estoque',
            'Deseja enviar estes itens colhidos diretamente para o controle de estoque do AgroGB?',
            [
                { text: 'Apenas Registrar', onPress: () => processSaveColheita(false) },
                { text: 'Sim, Atualizar Estoque', onPress: () => processSaveColheita(true), style: 'default' }
            ]
        );
    };

    const processSaveColheita = async (sendToStock) => {
        try {
            for (const item of harvestItems) {
                await insertColheita({
                    uuid: uuidv4(),
                    cultura: talhao.toUpperCase(),
                    produto: item.produto,
                    quantidade: item.quantidade,
                    congelado: 0,
                    observacao: observacao.toUpperCase(),
                    data: new Date().toISOString().split('T')[0]
                });

                if (sendToStock) {
                    await updateStock(item.produto, item.quantidade, true);
                }
            }

            showFriendlyAlert('Tudo Certo!', 'Colheita registrada com sucesso! Seus produtos já estão guardados. 🎉', '🍓', 'Que ótimo! 👍');
            setHarvestItems([]);
            setObservacao('');
            setTalhao('');
            loadData();
        } catch (e) {
            showFriendlyAlert('Erro', 'Não conseguimos salvar a colheita agora. Vamos tentar de novo? 🧐', '❌');
        }
    };

    const salvarCongelamento = async () => {
        if (!congTalhao || !congProduto || !congQtd) {
            showFriendlyAlert('Atenção', 'Preencha todos os campos obrigatórios com estrelinha (*)! 📝', '🧐');
            return;
        }

        Alert.alert(
            'Confirmar Congelamento',
            'Deseja abater este valor do seu estoque de produtos frescos e registrar como congelado?',
            [
                { text: 'Registrar Apenas', onPress: () => processSaveCongelamento(false) },
                { text: 'Sim, Abater Estoque', onPress: () => processSaveCongelamento(true), style: 'default' }
            ]
        );
    };

    const processSaveCongelamento = async (deductFromFreshStock) => {
        try {
            const qty = parseFloat(congQtd);
            await insertColheita({
                uuid: uuidv4(),
                cultura: congTalhao.toUpperCase(),
                produto: congProduto.toUpperCase(),
                quantidade: 0,
                congelado: qty,
                observacao: `[CONGELAMENTO] ${congObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            });

            if (deductFromFreshStock) {
                await updateStock(congProduto.toUpperCase(), qty, false); // Abate do fresco
            }

            showFriendlyAlert('Sucesso!', 'Produto congelado registrado com sucesso! ❄️', '🍓', 'Entendido 👍');
            setCongTalhao('');
            setCongProduto('');
            setCongQtd('');
            setCongObs('');
            loadData();
        } catch (e) {
            showFriendlyAlert('Erro', 'Não conseguimos registrar o congelamento agora. Tente de novo! 🧐', '❌');
        }
    };

    const salvarDescarte = async () => {
        if (!descProduto || !descQtd || !descMotivo) {
            showFriendlyAlert('Atenção', 'Preencha os campos obrigatórios (*): Produto, Quantidade e o Motivo! 📝', '🧐');
            return;
        }

        Alert.alert(
            'Confirmar Descarte',
            'Deseja abater a quantidade descartada do seu estoque atual do AgroGB?',
            [
                { text: 'Registrar Apenas', onPress: () => processSaveDescarte(false) },
                { text: 'Sim, Abater Estoque', onPress: () => processSaveDescarte(true), style: 'destructive' }
            ]
        );
    };

    const processSaveDescarte = async (deductFromStock) => {
        try {
            const qty = parseFloat(descQtd);
            await insertDescarte({
                uuid: uuidv4(),
                produto: descProduto.toUpperCase(),
                quantidade_kg: qty,
                motivo: `${descMotivo.toUpperCase()} - ${descObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            });

            if (deductFromStock) {
                await updateStock(descProduto.toUpperCase(), qty, false); // Abate do fresco
            }

            showFriendlyAlert('Descarte Salvo', 'O registro de descarte foi salvo com sucesso. 📉', '🗑️');
            setDescProduto('');
            setDescQtd('');
            setDescMotivo('');
            setDescObs('');
            loadData();
        } catch (e) {
            showFriendlyAlert('Erro', 'Não conseguimos registrar o descarte agora. 🧐', '❌');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não', style: 'cancel' },
            {
                text: 'Sim',
                style: 'destructive',
                onPress: async () => {
                    await deleteColheita(item.uuid);
                    loadData();
                }
            }
        ]);
    };

    const quickSave = async () => {
        if (!newItemName.trim()) return showFriendlyAlert('Aviso', 'Escreva o nome do produto rápido! 📝', '🧐');
        try {
            const uuid = uuidv4();
            await insertCadastros({
                uuid, nome: newItemName.toUpperCase(), tipo: 'PRODUTO', fator_conversao: parseFloat(newItemFator) || 1,
                unidade: 'CX', estocavel: 1, vendavel: 1, observacao: 'QUICK ADD'
            });
            setQuickAddModal(false);
            loadData();
            handleProdutoSelect({ nome: newItemName.toUpperCase(), fator_conversao: parseFloat(newItemFator) || 1 });
        } catch (e) { showFriendlyAlert('Erro', 'Falha ao criar o produto rápido. 🧐', '❌'); }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#10B981'} />
            </View>
        );
    }

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1F2937';
    const textMutedColor = activeColors.textMuted || '#9CA3AF';
    const cardBg = activeColors.card || '#FFF';

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>APONTAMENTOS DE CAMPO</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Culturas')}>
                        <Ionicons name="settings-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Sub-Header Tabs */}
                <View style={styles.tabBar}>
                    <TouchableOpacity 
                        style={[styles.tabItem, activeTab === 'COLHEITA' && styles.tabItemActive]}
                        onPress={() => setActiveTab('COLHEITA')}
                    >
                        <Text style={[styles.tabText, activeTab === 'COLHEITA' && styles.tabTextActive]}>🌾 COLHEITA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabItem, activeTab === 'CONGELAMENTO' && styles.tabItemActive]}
                        onPress={() => setActiveTab('CONGELAMENTO')}
                    >
                        <Text style={[styles.tabText, activeTab === 'CONGELAMENTO' && styles.tabTextActive]}>❄️ CONGELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabItem, activeTab === 'DESCARTE' && styles.tabItemActive]}
                        onPress={() => setActiveTab('DESCARTE')}
                    >
                        <Text style={[styles.tabText, activeTab === 'DESCARTE' && styles.tabTextActive]}>🗑️ DESCARTE</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {activeTab === 'COLHEITA' && (
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>1. ONDE? (LOCALIZAÇÃO)</Text>
                        <AgroInput 
                            label="Local / Área *"
                            value={talhao}
                            placeholder="SELECIONAR TALHÃO..."
                            icon="map"
                            style={{ marginBottom: 15 }}
                            editable={false}
                            onPressIn={() => { setModalTarget('HARVEST_AREA'); setAreaModalVisible(true); }}
                        />

                        <Text style={styles.sectionTitle}>2. O QUE? (PRODUTO E QUANTIDADE)</Text>
                        <AgroInput 
                            label="Variedade / Produto *"
                            value={produto}
                            placeholder="SELECIONAR PRODUTO..."
                            icon="leaf"
                            style={{ marginBottom: 10 }}
                            editable={false}
                            onPressIn={() => { setModalTarget('HARVEST_PROD'); setProductModalVisible(true); }}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput 
                                    label=" volumes (CX) "
                                    value={qtdCaixas}
                                    onChangeText={handleCaixasChange}
                                    placeholder="0"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.fatorText}>Fator: {fatorAtual} Kg</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput 
                                    label="Total Kg *"
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.addItemBtn} onPress={addHarvestItem}>
                            <Ionicons name="add-circle" size={20} color="#10B981" />
                            <Text style={styles.addItemText}>+ ADICIONAR ITEM DE COLHEITA</Text>
                        </TouchableOpacity>

                        {harvestItems.length > 0 && (
                            <View style={styles.tempListContainer}>
                                <Text style={styles.tempListTitle}>ITENS COLHIDOS AGUARDANDO SALVAMENTO ({harvestItems.length})</Text>
                                {harvestItems.map((item) => (
                                    <View key={item.id} style={styles.tempItemCard}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.tempItemName}>{item.produto}</Text>
                                            <Text style={styles.tempItemSub}>
                                                {item.quantidade} kg {item.qtdCaixas > 0 ? `(${item.qtdCaixas} cx)` : ''}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity onPress={() => editHarvestItem(item)}>
                                                <Ionicons name="pencil" size={16} color="#4B5563" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => removeHarvestItem(item.id)}>
                                                <Ionicons name="trash" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>3. OBSERVAÇÕES ADICIONAIS</Text>
                        <AgroInput 
                            label="Observações"
                            value={observacao}
                            onChangeText={(t) => up(t, setObservacao)}
                            placeholder="DETALHES TÉCNICOS..."
                            icon="document-text"
                            style={{ marginBottom: 20 }}
                        />

                        <AgroButton title="SALVAR APONTAMENTO" onPress={salvarColheita} />
                    </Card>
                )}

                {activeTab === 'CONGELAMENTO' && (
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>CONGELAR PRODUTOS FRESCOS</Text>
                        
                        <AgroInput 
                            label="Localização / Talhão *"
                            value={congTalhao}
                            placeholder="SELECIONAR TALHÃO..."
                            icon="map"
                            style={{ marginBottom: 15 }}
                            editable={false}
                            onPressIn={() => { setModalTarget('CONG_AREA'); setAreaModalVisible(true); }}
                        />

                        <AgroInput 
                            label="Produto / Cultura *"
                            value={congProduto}
                            placeholder="SELECIONAR PRODUTO..."
                            icon="leaf"
                            style={{ marginBottom: 15 }}
                            editable={false}
                            onPressIn={() => { setModalTarget('CONG_PROD'); setProductModalVisible(true); }}
                        />

                        <AgroInput 
                            label="Quantidade a Congelar (Kg) *"
                            value={congQtd}
                            onChangeText={setCongQtd}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            style={{ marginBottom: 15 }}
                        />

                        <AgroInput 
                            label="Observações"
                            value={congObs}
                            onChangeText={t => up(t, setCongObs)}
                            placeholder="Ex: Carga para câmara fria 2"
                            icon="document-text"
                            style={{ marginBottom: 20 }}
                        />

                        <AgroButton title="REGISTRAR CONGELAMENTO" onPress={salvarCongelamento} />
                    </Card>
                )}

                {activeTab === 'DESCARTE' && (
                    <Card style={styles.formCard}>
                        <Text style={styles.sectionTitle}>LANÇAR PERDA / DESCARTE DE PRODUTO</Text>

                        <AgroInput 
                            label="Produto / Cultura *"
                            value={descProduto}
                            placeholder="SELECIONAR PRODUTO..."
                            icon="leaf"
                            style={{ marginBottom: 15 }}
                            editable={false}
                            onPressIn={() => { setModalTarget('DESC_PROD'); setProductModalVisible(true); }}
                        />

                        <AgroInput 
                            label="Quantidade Descartada (Kg) *"
                            value={descQtd}
                            onChangeText={setDescQtd}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            style={{ marginBottom: 15 }}
                        />

                        <AgroInput 
                            label="Motivo do Descarte *"
                            value={descMotivo}
                            onChangeText={t => up(t, setDescMotivo)}
                            placeholder="Ex: Fruto passado, podridão, pragas..."
                            icon="alert-circle-outline"
                            style={{ marginBottom: 15 }}
                        />

                        <AgroInput 
                            label="Observações"
                            value={descObs}
                            onChangeText={t => up(t, setDescObs)}
                            placeholder="Detalhes adicionais sobre o descarte"
                            icon="document-text"
                            style={{ marginBottom: 20 }}
                        />

                        <AgroButton title="REGISTRAR DESCARTE" onPress={salvarDescarte} />
                    </Card>
                )}

                <Text style={styles.historyTitle}>ÚLTIMOS APONTAMENTOS DE COLHEITA</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.historyCard} noPadding>
                        <View style={styles.historyContent}>
                            <View style={styles.historyIcon}>
                                <Ionicons name="leaf" size={20} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.hProd}>{item.produto}</Text>
                                <Text style={styles.hSub}>{item.cultura} • {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                                <Text style={styles.hVal}>
                                    {item.quantidade > 0 ? `${item.quantidade} kg Colhido` : ''} 
                                    {item.congelado > 0 ? `${item.congelado} kg Congelado` : ''}
                                </Text>
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

            {/* MODALS */}
            <Modal visible={productModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity onPress={() => { setProductModalVisible(false); setQuickAddModal(true); }}>
                                    <Ionicons name="add-circle" size={24} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." value={searchText} onChangeText={t => up(t, setSearchText)} />
                        <FlatList
                            data={productsDB.filter(p => p.nome.includes(searchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => handleProdutoSelect(item)}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>Fator: {item.fator_conversao || 1} Kg</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={areaModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR LOCAL</Text>
                            <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={areasDB}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => handleAreaSelect(item)}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.observacao}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={quickAddModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={styles.miniModal}>
                        <Text style={styles.modalTitle}>NOVO PRODUTO RÁPIDO</Text>
                        <AgroInput label="Nome" value={newItemName} onChangeText={t => up(t, setNewItemName)} placeholder="EX: MORANGO" />
                        <AgroInput label="Kg por Caixa" value={newItemFator} onChangeText={setNewItemFator} keyboardType="decimal-pad" placeholder="1.0" />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#9CA3AF' }]} onPress={() => setQuickAddModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.miniBtn} onPress={quickSave}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>

            <FriendlyModal
                visible={friendlyModal.visible}
                title={friendlyModal.title}
                message={friendlyModal.message}
                emoji={friendlyModal.emoji}
                buttonText={friendlyModal.buttonText}
                onClose={() => setFriendlyModal({ ...friendlyModal, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    
    // Tab bar design
    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 15, padding: 5 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
    tabTextActive: { color: '#065F46' },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginTop: 10, marginBottom: 10 },
    formCard: { padding: 20 },
    row: { flexDirection: 'row' },
    fatorText: { fontSize: 9, color: '#10B981', fontWeight: 'bold', marginLeft: 10, marginBottom: 10 },
    historyTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    historyCard: { marginBottom: 12 },
    historyContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    historyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    hProd: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    hSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: '#059669', marginTop: 4 },
    historyActions: { marginLeft: 10 },
    actionBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    miniModal: { padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    searchBar: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    itemSub: { fontSize: 10, color: '#9CA3AF' },
    miniBtn: { flex: 1, backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15, marginHorizontal: 5 },
    btnText: { color: '#FFF', fontWeight: 'bold' },

    // Multi-Item pointing elements
    addItemBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        borderWidth: 1.5, 
        borderColor: '#10B981', 
        borderStyle: 'dashed', 
        borderRadius: 12, 
        paddingVertical: 12, 
        marginTop: 15, 
        marginBottom: 15 
    },
    addItemText: { fontSize: 11, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
    tempListContainer: { 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12, 
        padding: 12, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        marginBottom: 20 
    },
    tempListTitle: { fontSize: 9, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 },
    tempItemCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: '#FFF', 
        borderRadius: 8, 
        padding: 10, 
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    tempItemName: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
    tempItemSub: { fontSize: 11, color: '#6B7280', marginTop: 2 }
});
