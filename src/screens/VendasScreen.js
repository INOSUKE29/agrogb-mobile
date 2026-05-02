import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Platform, SafeAreaView, StatusBar, ActivityIndicator, Switch, Image } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCadastro, getClientes } from '../database/database';
import VendaService from '../services/VendaService';
import ProductModal from '../modules/inventory/components/ProductModal';
import ClientModal from '../modules/finance/components/ClientModal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function VendasScreen({ navigation }) {
    const [cliente, setCliente] = useState('');
    const [clienteId, setClienteId] = useState(null);
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [precoKg, setPrecoKg] = useState('');
    const [view, setView] = useState('LIST');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await VendaService.getRecentSales();
            setHistory(data || []);
        } catch { setHistory([]); }
        finally { setLoadingHistory(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

    const valorTotalCalc = useMemo(() => {
        const q = parseFloat(quantidade) || 0;
        const p = parseFloat(precoKg) || 0;
        return q * p;
    }, [quantidade, precoKg]);

    const handleSalvar = async () => {
        if (!produto || !quantidade || !precoKg) return Alert.alert('Atenção', 'Preencha todos os campos.');
        setSaving(true);
        try {
            await VendaService.registrarVenda({
                cliente_nome: cliente || 'BALCÃO',
                produto,
                quantidade: parseFloat(quantidade),
                valor_total: valorTotalCalc,
                data: new Date().toISOString().split('T')[0]
            });
            Alert.alert('Sucesso', 'Venda realizada!');
            setView('LIST');
            loadHistory();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
        finally { setSaving(false); }
    };

    const renderList = () => (
        <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
                <Text style={styles.headerTitle}>HISTÓRICO DE VENDAS</Text>
                <View style={{width: 24}} />
            </View>

            {loadingHistory ? <ActivityIndicator color="#10B981" /> : (
                history.map(item => (
                    <View key={item.uuid} style={styles.historyCard}>
                        <View style={styles.iconCircle}><Ionicons name="cart" size={20} color="#10B981" /></View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <Text style={styles.hTitle}>{item.cliente_nome || 'Balcão'}</Text>
                            <Text style={styles.hSub}>{item.produto} • {item.quantidade}kg</Text>
                        </View>
                        <Text style={styles.hVal}>R$ {item.valor_total?.toFixed(2)}</Text>
                    </View>
                ))
            )}
            
            <TouchableOpacity style={styles.fab} onPress={() => setView('FORM')}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGrad}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderForm = () => (
        <ScrollView contentContainerStyle={styles.scroll}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => setView('LIST')}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
                <Text style={styles.headerTitle}>NOVA VENDA</Text>
                <View style={{width: 24}} />
            </View>

            <View style={styles.formCard}>
                <Text style={styles.label}>CLIENTE</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setClientModalVisible(true)}>
                    <Text style={styles.pickerTxt}>{cliente || 'Selecionar Cliente'}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                <Text style={styles.label}>PRODUTO</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setModalVisible(true)}>
                    <Text style={styles.pickerTxt}>{produto || 'Selecionar Produto'}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                <View style={{flexDirection: 'row', gap: 15, marginTop: 20}}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>QUANTIDADE (KG)</Text>
                        <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" placeholder="0" />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>PREÇO/KG (R$)</Text>
                        <TextInput style={styles.input} value={precoKg} onChangeText={setPrecoKg} keyboardType="numeric" placeholder="0.00" />
                    </View>
                </View>

                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>TOTAL A RECEBER</Text>
                    <Text style={styles.totalVal}>R$ {valorTotalCalc.toFixed(2)}</Text>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSalvar} disabled={saving}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.saveGrad}>
                        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveTxt}>FINALIZAR VENDA</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ProductModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(p) => { setProduto(p.nome); setModalVisible(false); }} />
            <ClientModal visible={clientModalVisible} onClose={() => setClientModalVisible(false)} onCreated={(c) => { setCliente(c.nome); setClientModalVisible(false); }} />
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#065F46', '#047857', '#F3F4F6', '#FFFFFF']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent />
            {view === 'LIST' ? renderList() : renderForm()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scroll: { padding: 20, paddingTop: 55, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
    iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    hTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    hSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    hVal: { fontSize: 16, fontWeight: '900', color: '#10B981' },

    fab: { position: 'absolute', right: 20, bottom: 40, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
    fabGrad: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },

    formCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 25, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 10 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
    picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    pickerTxt: { fontSize: 15, color: '#374151', fontWeight: '600' },
    input: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, fontSize: 18, fontWeight: '700', color: '#111827', borderWidth: 1, borderColor: '#F3F4F6' },
    
    totalBox: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, marginVertical: 25, alignItems: 'center', borderWidth: 1, borderColor: '#DCFCE7' },
    totalLabel: { fontSize: 11, fontWeight: '900', color: '#059669', marginBottom: 5 },
    totalVal: { fontSize: 28, fontWeight: '900', color: '#064E3B' },

    saveBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    saveGrad: { height: 64, justifyContent: 'center', alignItems: 'center' },
    saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});
