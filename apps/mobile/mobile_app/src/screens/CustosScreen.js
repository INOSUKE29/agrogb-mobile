import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { insertCost, getCostCategories, getCosts } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// Design System
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import SmartEntitySelector from '../components/common/SmartEntitySelector';
import { CostCenterLibraryService } from '../services/LibraryServices';

export default function CustosScreen({ navigation }) {
    const { theme } = useTheme();
    const [categoria, setCategoria] = useState(null);
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');

    // Selection State
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);
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
            category_name: categoria.nome,
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
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
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
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.formCard}>
                    <SmartEntitySelector
                        label="CATEGORIA DA DESPESA *"
                        value={categoria?.name || ''}
                        onSelect={val => setCategoria(val)}
                        service={CostCenterLibraryService}
                        placeholder="BUSCAR CATEGORIA..."
                        icon="pricetag-outline"
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
                </LinearGradient>

                {/* MODAL REMOVIDO EM PROL DOS CHIPS INLINE */}
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
    formCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    row: { flexDirection: 'row' },
    totalBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    totalLabel: { fontSize: 9, fontWeight: '900', color: '#EF4444', letterSpacing: 1 },
    totalValue: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 5 },
    chipScroll: { marginBottom: 20, flexDirection: 'row' },
    chip: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipActive: { 
        backgroundColor: 'rgba(52, 211, 153, 0.1)', 
        borderColor: '#10B981' 
    },
    chipText: { 
        fontSize: 12, 
        fontWeight: '800', 
        color: '#9CA3AF' 
    },
    chipTextActive: { 
        color: '#10B981' 
    }
});
