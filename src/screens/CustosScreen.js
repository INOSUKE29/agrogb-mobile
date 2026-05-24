import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCost, getCostCategories, insertCostCategory, executeQuery, getCosts } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function CustosScreen({ navigation }) {
    const { theme } = useTheme();
    const [categoria, setCategoria] = useState(null);
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const categories = await getCostCategories();
            setItems(categories);
            const costs = await getCosts();
            setHistory(costs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const calcularTotal = () => {
        const q = parseFloat(quantidade) || 0;
        const v = parseFloat(valorUnitario) || 0;
        return (q * v).toFixed(2);
    }

    const salvar = async () => {
        if (!categoria || !quantidade || !valorUnitario) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios (*)');
            return;
        }

        const dados = {
            category_id: categoria.id,
            quantity: parseFloat(quantidade) || 0,
            unit_value: parseFloat(valorUnitario) || 0,
            notes: observacao.toUpperCase(),
        };

        try {
            await insertCost(dados);
            Alert.alert('Sucesso', 'Custo registrado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar o custo.');
        }
    };

    const getTotalMensal = () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return history
            .filter(c => {
                const d = new Date(c.created_at);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((acc, curr) => acc + (curr.total_value || 0), 0);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTROLE DE CUSTOS</Text>
                    <View style={{ width: 24 }} />
                </View>
                
                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Custos no Mês" 
                        value={`R$ ${getTotalMensal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon="trending-down" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>LANÇAR DESPESA</Text>
                    
                    <AgroInput 
                        label="Categoria da Despesa *"
                        value={categoria ? categoria.name : ''}
                        placeholder="SELECIONAR CATEGORIA..."
                        icon="list"
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
                                placeholder="1"
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1.5 }}>
                            <AgroInput 
                                label="Valor Unit. R$ *"
                                value={valorUnitario}
                                onChangeText={setValorUnitario}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>TOTAL DO LANÇAMENTO</Text>
                        <Text style={styles.totalValue}>R$ {calcularTotal()}</Text>
                    </View>

                    <AgroInput 
                        label="Notas / Observação"
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        placeholder="DETALHES DA DESPESA..."
                        icon="document-text"
                        style={{ marginBottom: 20 }}
                    />

                    <AgroButton 
                        title="SALVAR REGISTRO"
                        onPress={salvar}
                        color="#EF4444"
                    />
                </Card>

                {/* MODALS */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.overlay}>
                        <View style={styles.modalBg}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>ESCOLHA A CATEGORIA</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.searchBar}
                                placeholder="Buscar categoria..."
                                value={searchText}
                                onChangeText={t => up(t, setSearchText)}
                            />

                            <FlatList
                                data={items.filter(i => i.name.toUpperCase().includes(searchText.toUpperCase()))}
                                keyExtractor={i => i.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemRow} onPress={() => { setCategoria(item); setModalVisible(false); }}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                        <Text style={styles.itemSub}>{item.type ? item.type.toUpperCase() : 'GERAL'}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row' },
    summaryCard: { flex: 1, height: 90 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 },
    formCard: { padding: 20 },
    row: { flexDirection: 'row' },
    totalBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    totalLabel: { fontSize: 9, fontWeight: '900', color: '#6B7280', letterSpacing: 1 },
    totalValue: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 5 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    searchBar: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    itemSub: { fontSize: 10, color: '#9CA3AF' }
});
