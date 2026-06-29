import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { executeQuery } from '../database/database';
import AgroInput from '../components/AgroInput';
import SmartEntitySelector from '../components/common/SmartEntitySelector';
import { ClientLibraryService, ProductLibraryService } from '../services/LibraryServices';

export default function VendaFormScreen({ navigation }) {
    const { colors } = useTheme();
    const [cliente, setCliente] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!cliente || !produto || !quantidade || !valorUnitario) {
            Alert.alert("Atenção", "Preencha todos os campos obrigatórios (Cliente, Produto, Quantidade e Valor).");
            return;
        }

        setLoading(true);
        try {
            const qtdNum = parseFloat(quantidade.replace(',', '.'));
            const valNum = parseFloat(valorUnitario.replace(',', '.'));
            const valorTotal = qtdNum * valNum;

            const query = `
                INSERT INTO v2_vendas (
                    id, 
                    cliente_nome, 
                    produto_nome, 
                    quantidade, 
                    valor_unitario, 
                    valor_total, 
                    data_venda, 
                    observacao, 
                    created_at, 
                    sync_status
                ) VALUES (
                    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
                    ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'), 'pending'
                )
            `;

            await executeQuery(query, [cliente, produto, qtdNum, valNum, valorTotal, observacao]);

            Alert.alert("Sucesso", "Venda registrada com sucesso!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Erro ao salvar venda", error);
            Alert.alert("Erro", "Não foi possível registrar a venda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nova Venda</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dados do Cliente</Text>
                
                <SmartEntitySelector
                    label="Comprador / Cooperativa / Frigorífico"
                    value={cliente}
                    onSelect={setCliente}
                    service={ClientLibraryService}
                    placeholder="Selecione ou adicione novo..."
                    createRoute="ClienteFormScreen"
                    icon="business-outline"
                />

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Dados do Produto</Text>
                
                <SmartEntitySelector
                    label="O que você está vendendo?"
                    value={produto}
                    onSelect={setProduto}
                    service={ProductLibraryService}
                    placeholder="Selecione o produto (ex: Soja, Milho)..."
                    createRoute="ProdutoFormScreen"
                    icon="leaf-outline"
                />

                <View style={styles.row}>
                    <View style={styles.halfCol}>
                        <AgroInput
                            label="Quantidade"
                            placeholder="Ex: 1000"
                            value={quantidade}
                            onChangeText={setQuantidade}
                            icon="stats-chart-outline"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfCol}>
                        <AgroInput
                            label="Preço Unit. (R$)"
                            placeholder="Ex: 120,50"
                            value={valorUnitario}
                            onChangeText={setValorUnitario}
                            icon="cash-outline"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {quantidade && valorUnitario && !isNaN(parseFloat(quantidade.replace(',', '.'))) && !isNaN(parseFloat(valorUnitario.replace(',', '.'))) ? (
                    <View style={[styles.totalPreview, { backgroundColor: (colors.primary || '#10B981') + '15', borderColor: colors.primary }]}>
                        <Text style={[styles.totalPreviewLabel, { color: colors.primary }]}>Valor Total Previsto:</Text>
                        <Text style={[styles.totalPreviewValue, { color: colors.primary }]}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(quantidade.replace(',', '.')) * parseFloat(valorUnitario.replace(',', '.')))}
                        </Text>
                    </View>
                ) : null}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Adicionais</Text>

                <AgroInput
                    label="Observações / Condições de Pagamento"
                    placeholder="Ex: Pagamento 30/60 dias"
                    value={observacao}
                    onChangeText={setObservacao}
                    icon="document-text-outline"
                    multiline
                />

                <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: colors.primary || '#10B981' }, loading && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Registrar Venda</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        elevation: 2,
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    formContainer: { padding: 20 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfCol: {
        width: '48%',
    },
    totalPreview: {
        marginTop: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    totalPreviewLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    totalPreviewValue: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 5,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 30,
        elevation: 3,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
