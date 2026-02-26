import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, initConnection, getCulturas, getCadastro } from '../database/database';

export default function ColheitaScreen({ navigation }) {
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [descarte, setDescarte] = useState(''); // NOVO
    const [observacao, setObservacao] = useState('');

    const [loading, setLoading] = useState(false);

    // Auxiliar UI
    const [showOptions, setShowOptions] = useState({ prod: false, area: false });
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            setProductsDB(Array.isArray(allItems) ? allItems.filter(i => i.tipo === 'PRODUTO') : []);
            const areas = await getCulturas();
            setAreasDB(Array.isArray(areas) ? areas : []);
        } catch (e) {
            console.warn("Colheita DB load fail:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Bloco 2: Strict Validation
        if (!talhao.trim()) return Alert.alert('Aviso Mestre', 'Defina a Origem (Área ou Talhão).');
        if (!produto.trim()) return Alert.alert('Aviso Mestre', 'Qual produto foi colhido?');
        if (!quantidade.trim()) return Alert.alert('Aviso Mestre', 'Quantos KG, Sacas ou Unidades colheu?');

        const qtdReal = parseFloat(quantidade);
        const descReal = parseFloat(descarte) || 0;

        if (isNaN(qtdReal) || qtdReal <= 0) return Alert.alert('Aviso Mestre', 'A quantidade colhida deve ser um número válido maior que 0.');

        setLoading(true);
        try {
            const safeObj = {
                uuid: uuidv4(),
                cultura: talhao.toUpperCase(),
                produto: produto.toUpperCase(),
                quantidade: qtdReal,
                quantidade_descartada: descReal, // Integrado
                congelado: 0,
                observacao: observacao.toUpperCase(),
                data: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString()
            };

            const db = await initConnection();
            if (!db) throw new Error("Falha Crítica do Banco de Dados. Impossível salvar no momento.");

            db.transaction(tx => {
                tx.executeSql(
                    `INSERT INTO colheitas (uuid, cultura, produto, quantidade, quantidade_descartada, congelado, data, observacao, last_updated) 
                     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                    [
                        safeObj.uuid, safeObj.cultura, safeObj.produto, safeObj.quantidade, safeObj.quantidade_descartada, safeObj.data, safeObj.observacao, safeObj.last_updated
                    ],
                    (_, result) => {
                        Alert.alert('Sucesso 🎉', `Colheita Total Registrada!\nAproveitável: ${safeObj.quantidade}\nDescartada: ${safeObj.quantidade_descartada}`, [
                            { text: 'Voltar ao Menu', onPress: () => navigation.goBack() }
                        ]);
                    },
                    (_, err) => {
                        console.error('[Colheita SQLite] Falha Inserção', err);
                        Alert.alert('Falha do Banco', err.message);
                    }
                );
            });

        } catch (error) {
            console.error('[AgroGB] Falha Estrutural:', error);
            Alert.alert('Falha ao Salvar', error.message || 'Houve um erro no aplicativo durante a etapa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 25, paddingBottom: 50 }}>

            <Text style={styles.topInfo}>REGISTRO DE PRODUÇÃO (DIA)</Text>

            <Text style={styles.labelCampo}>ORIGEM (ÁREA / TALHÃO / ESTUFA) *</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowOptions({ ...showOptions, area: !showOptions.area })}>
                <Text style={talhao ? styles.inputText : styles.inputPlaceholder}>{talhao || "Tocar para Selecionar ou Digitar..."}</Text>
            </TouchableOpacity>
            {showOptions.area && (
                <View style={styles.dropdown}>
                    <TextInput style={styles.dropdownSearch} placeholder="✏️ Ou pule e digite um novo nome..." value={talhao} onChangeText={t => setTalhao(t.toUpperCase())} />
                    {areasDB.map(a => (
                        <TouchableOpacity key={a.id} style={styles.dropItem} onPress={() => { setTalhao(a.nome); setShowOptions({ ...showOptions, area: false }); }}>
                            <Text style={styles.dropItemText}>{a.nome}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.labelCampo}>QUAL O PRODUTO COLHIDO? *</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowOptions({ ...showOptions, prod: !showOptions.prod })}>
                <Text style={produto ? styles.inputText : styles.inputPlaceholder}>{produto || "Tocar para Selecionar Produto..."}</Text>
            </TouchableOpacity>
            {showOptions.prod && (
                <View style={styles.dropdown}>
                    <TextInput style={styles.dropdownSearch} placeholder="✏️ Ou pule e digite um novo nome..." value={produto} onChangeText={t => setProduto(t.toUpperCase())} />
                    {productsDB.map(p => (
                        <TouchableOpacity key={p.id} style={styles.dropItem} onPress={() => { setProduto(p.nome); setShowOptions({ ...showOptions, prod: false }); }}>
                            <Text style={styles.dropItemText}>{p.nome}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.cardDiv}>
                <Text style={styles.cardInfo}>O total produzido na roça hoje engloba duas partes: O que foi perfeitamente colhido para estoque/venda, e aquilo que teve de ser descartado/refugado durante a colheita.</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                <View style={styles.col}>
                    <Text style={styles.labelVerde}>QTD APROVEITAVEL *</Text>
                    <TextInput
                        style={[styles.inputNumerico, { borderColor: '#10B981' }]}
                        value={quantidade}
                        onChangeText={setQuantidade}
                        keyboardType="numeric"
                        placeholder="Ex: 500"
                    />
                </View>

                <View style={styles.col}>
                    <Text style={styles.labelVermelho}>DESCARTE / REFUGO</Text>
                    <TextInput
                        style={[styles.inputNumerico, { borderColor: '#EF4444' }]}
                        value={descarte}
                        onChangeText={setDescarte}
                        keyboardType="numeric"
                        placeholder="Ex: 50"
                    />
                </View>
            </View>

            <Text style={styles.labelCampo}>OBSERVAÇÕES (OPCIONAL)</Text>
            <TextInput
                style={[styles.inputTexto, { height: 80 }]}
                value={observacao}
                onChangeText={t => setObservacao(t.toUpperCase())}
                multiline
                placeholder="Exemplo: Safra castigada por granizo, boa parte do refugo foi machucado..."
            />

            <TouchableOpacity
                style={[styles.saveBtnGigante, loading && { backgroundColor: '#9CA3AF' }]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? <ActivityIndicator size="large" color="#FFF" /> : <Text style={styles.saveBtnTxtGigante}>✔ SALVAR E ENCERRAR</Text>}
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    topInfo: { fontSize: 13, fontWeight: 'bold', color: '#10B981', marginBottom: 20 },
    labelCampo: { fontSize: 13, fontWeight: '900', color: '#374151', marginBottom: 8 },
    inputTexto: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 14, padding: 18, fontSize: 16, color: '#1F2937', marginBottom: 25 },

    inputBox: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 14, padding: 20, marginBottom: 25 },
    inputText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    inputPlaceholder: { fontSize: 16, color: '#9CA3AF' },

    dropdown: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 25, marginTop: -15, elevation: 1 },
    dropdownSearch: { padding: 15, fontSize: 16, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    dropItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    dropItemText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },

    col: { flex: 1 },
    labelVerde: { fontSize: 12, fontWeight: '900', color: '#10B981', marginBottom: 8 },
    labelVermelho: { fontSize: 12, fontWeight: '900', color: '#EF4444', marginBottom: 8 },
    inputNumerico: { backgroundColor: '#FFF', borderWidth: 3, borderRadius: 14, padding: 18, fontSize: 24, fontWeight: '900', color: '#1F2937', textAlign: 'center' },

    cardDiv: { backgroundColor: '#EFF6FF', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#DBEAFE' },
    cardInfo: { fontSize: 13, color: '#1E3A8A', lineHeight: 20 },

    saveBtnGigante: { backgroundColor: '#10B981', padding: 22, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 3 },
    saveBtnTxtGigante: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 }
});
