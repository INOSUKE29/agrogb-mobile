import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CULTURAS_DISPONIVEIS = ['Morango Albion', 'Morango San Andreas', 'Tomate Cereja', 'Milho Híbrido', 'Alface Crespa'];

export default function ColheitaScreen({ navigation }) {
    const [abaAtiva, setAbaAtiva] = useState('Colheita'); // 'Colheita', 'Congelamento', 'Descarte'
    const [dataOperacao, setDataOperacao] = useState('24/05/2026');
    const [talhao, setTalhao] = useState('Talhão 01 - Estufas');
    const [observacao, setObservacao] = useState('');
    
    // Itens no "Carrinho" de Registro
    const [itens, setItens] = useState([
        { id: '1', cultura: 'Morango Albion', quantidade: '120', unidade: 'Caixas' }
    ]);

    // Modal para adicionar novo item
    const [modalVisible, setModalVisible] = useState(false);
    const [novaCultura, setNovaCultura] = useState('Morango San Andreas');
    const [novaQuantidade, setNovaQuantidade] = useState('');
    const [novaUnidade, setNovaUnidade] = useState('Caixas');

    const handleAdicionarItem = () => {
        if (!novaQuantidade) {
            Alert.alert('Atenção', 'Informe a quantidade colhida.');
            return;
        }
        const novoItem = {
            id: Math.random().toString(),
            cultura: novaCultura,
            quantidade: novaQuantidade,
            unidade: novaUnidade
        };
        setItens([...itens, novoItem]);
        setNovaQuantidade('');
        setModalVisible(false);
    };

    const handleRemoverItem = (id) => {
        setItens(itens.filter(i => i.id !== id));
    };

    const handleSalvarOperacao = () => {
        if (itens.length === 0) {
            Alert.alert('Atenção', 'Adicione pelo menos um item no registro.');
            return;
        }
        Alert.alert('Sucesso', `Registro de ${abaAtiva} salvo com sucesso!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const getAbaColor = (aba) => {
        if (aba === 'Colheita') return '#10B981';
        if (aba === 'Congelamento') return '#3B82F6';
        if (aba === 'Descarte') return '#EF4444';
        return '#10B981';
    };

    const corAba = getAbaColor(abaAtiva);

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={26} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Registro</Text>
                <TouchableOpacity style={[styles.saveBtnTop, { backgroundColor: `${corAba}20` }]} onPress={handleSalvarOperacao}>
                    <Text style={[styles.saveBtnTopText, { color: corAba }]}>SALVAR</Text>
                </TouchableOpacity>
            </View>

            {/* ABAS DE OPERAÇÃO */}
            <View style={styles.tabsWrapper}>
                {['Colheita', 'Congelamento', 'Descarte'].map(aba => {
                    const isActive = abaAtiva === aba;
                    const abaColor = getAbaColor(aba);
                    return (
                        <TouchableOpacity 
                            key={aba}
                            style={[styles.tabBtn, isActive && { borderBottomColor: abaColor }]}
                            onPress={() => setAbaAtiva(aba)}
                        >
                            <Text style={[styles.tabText, isActive && { color: abaColor, fontWeight: '900' }]}>{aba}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* INFORMAÇÕES GERAIS */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeader}>DADOS DA OPERAÇÃO</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>DATA</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                            <TextInput style={styles.inputText} value={dataOperacao} onChangeText={setDataOperacao} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>ÁREA / TALHÃO</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="map-outline" size={20} color="#94A3B8" />
                            <TextInput style={styles.inputText} value={talhao} onChangeText={setTalhao} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>OBSERVAÇÕES (OPCIONAL)</Text>
                        <View style={styles.inputRowArea}>
                            <TextInput 
                                style={[styles.inputText, {height: 60, textAlignVertical: 'top'}]} 
                                value={observacao} 
                                onChangeText={setObservacao} 
                                placeholder="Clima, qualidade, perdas..."
                                placeholderTextColor="#475569"
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* CARRINHO DE ITENS */}
                <View style={styles.sectionCard}>
                    <View style={styles.carrinhoHeader}>
                        <Text style={styles.sectionHeader}>ITENS DA {abaAtiva.toUpperCase()}</Text>
                        <View style={[styles.badgeCount, { backgroundColor: `${corAba}20` }]}>
                            <Text style={[styles.badgeCountText, { color: corAba }]}>{itens.length}</Text>
                        </View>
                    </View>

                    {itens.map(item => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemCultura}>{item.cultura}</Text>
                                <Text style={styles.itemQtd}>{item.quantidade} {item.unidade}</Text>
                            </View>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoverItem(item.id)}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={[styles.addDashedBtn, { borderColor: corAba }]} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={20} color={corAba} />
                        <Text style={[styles.addDashedText, { color: corAba }]}>Adicionar Produto</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* BOTÃO FLUTUANTE DE FINALIZAR */}
            <View style={styles.footer}>
                <TouchableOpacity style={[styles.finalizarBtn, { backgroundColor: corAba }]} onPress={handleSalvarOperacao}>
                    <Ionicons name="checkmark-done" size={22} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.finalizarText}>CONCLUIR {abaAtiva.toUpperCase()}</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL ADICIONAR ITEM */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderTop}>
                            <Text style={styles.modalTitle}>Adicionar Produto</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabelModal}>CULTURA</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.culturaScroll}>
                            {CULTURAS_DISPONIVEIS.map(c => (
                                <TouchableOpacity 
                                    key={c} 
                                    style={[styles.culturaBtn, novaCultura === c && { borderColor: corAba, backgroundColor: `${corAba}15` }]}
                                    onPress={() => setNovaCultura(c)}
                                >
                                    <Text style={[styles.culturaBtnText, novaCultura === c && { color: corAba }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalRow}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <Text style={styles.inputLabelModal}>QUANTIDADE</Text>
                                <TextInput 
                                    style={styles.inputModalText} 
                                    keyboardType="numeric" 
                                    value={novaQuantidade} 
                                    onChangeText={setNovaQuantidade} 
                                    placeholder="Ex: 50"
                                    placeholderTextColor="#475569"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabelModal}>UNIDADE</Text>
                                <View style={styles.unidadeToggleRow}>
                                    <TouchableOpacity 
                                        style={[styles.unidadeBtn, novaUnidade === 'Caixas' && styles.unidadeBtnActive]}
                                        onPress={() => setNovaUnidade('Caixas')}
                                    >
                                        <Text style={[styles.unidadeBtnText, novaUnidade === 'Caixas' && styles.unidadeBtnTextActive]}>Caixas</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.unidadeBtn, novaUnidade === 'Kg' && styles.unidadeBtnActive]}
                                        onPress={() => setNovaUnidade('Kg')}
                                    >
                                        <Text style={[styles.unidadeBtnText, novaUnidade === 'Kg' && styles.unidadeBtnTextActive]}>Kg</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.addModalBtn, { backgroundColor: corAba }]} onPress={handleAdicionarItem}>
                            <Text style={styles.addModalBtnText}>ADICIONAR AO REGISTRO</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050A10' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#0B121E' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#F8FAFC' },
    saveBtnTop: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    saveBtnTopText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    tabsWrapper: { flexDirection: 'row', backgroundColor: '#0B121E', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 15, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { color: '#64748B', fontSize: 14, fontWeight: '700' },

    content: { padding: 20, paddingBottom: 100 },
    
    sectionCard: { backgroundColor: '#0B121E', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1F2937' },
    sectionHeader: { color: '#F8FAFC', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    
    inputGroup: { marginBottom: 15 },
    inputLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#1F2937' },
    inputRowArea: { backgroundColor: '#111827', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#1F2937' },
    inputText: { flex: 1, color: '#F8FAFC', fontSize: 14, marginLeft: 10, fontWeight: '600' },

    carrinhoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    badgeCount: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    badgeCountText: { fontSize: 12, fontWeight: '900' },

    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#1F2937' },
    itemInfo: { flex: 1 },
    itemCultura: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    itemQtd: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    deleteBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },

    addDashedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 10 },
    addDashedText: { fontSize: 14, fontWeight: '800', marginLeft: 8 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(11, 18, 30, 0.95)', borderTopWidth: 1, borderTopColor: '#1F2937' },
    finalizarBtn: { flexDirection: 'row', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    finalizarText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContent: { backgroundColor: '#0B121E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: Platform.OS === 'ios' ? 50 : 30, borderWidth: 1, borderColor: '#1F2937' },
    modalHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#F8FAFC' },
    
    inputLabelModal: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    culturaScroll: { flexDirection: 'row', marginBottom: 20 },
    culturaBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginRight: 10, backgroundColor: '#111827' },
    culturaBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },

    modalRow: { flexDirection: 'row', marginBottom: 25 },
    inputModalText: { backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#1F2937', color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    
    unidadeToggleRow: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden' },
    unidadeBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' },
    unidadeBtnActive: { backgroundColor: '#334155' },
    unidadeBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
    unidadeBtnTextActive: { color: '#F8FAFC', fontWeight: '900' },

    addModalBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
    addModalBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
