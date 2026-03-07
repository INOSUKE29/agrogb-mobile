import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertProcessamento } from '../services/EstoqueService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';

export default function ProcessamentoScreen({ navigation }) {
    const { colors } = useTheme();
    const [tipo, setTipo] = useState('DESCARTE'); // 'DESCARTE' ou 'CONGELAMENTO'
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');

    const up = (t, setter) => setter(t.toUpperCase());

    const salvar = async () => {
        if (!produto || !quantidade) {
            Alert.alert('Atenção', 'Produto e Quantidade são obrigatórios.');
            return;
        }

        const dados = {
            uuid: uuidv4(),
            produto: produto.toUpperCase(),
            quantidade_kg: parseFloat(quantidade) || 0,
            motivo: (motivo || 'NÃO INFORMADO').toUpperCase(),
            data: new Date().toISOString().split('T')[0],
            tipo: tipo
        };

        try {
            await insertProcessamento(dados);
            Alert.alert('Sucesso', `${tipo === 'DESCARTE' ? 'Perda' : 'Congelamento'} registrado com sucesso!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Erro', `Não foi possível registrar o ${tipo.toLowerCase()}.`);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                {tipo === 'DESCARTE' ? (
                    <LinearGradient colors={['#7F1D1D', '#991B1B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHeader}>
                        <Text style={styles.headerTitle}>REGISTRO DE PERDAS</Text>
                        <Text style={styles.headerSub}>Controle de Avarias e Descarte de Produtos</Text>
                    </LinearGradient>
                ) : (
                    <LinearGradient colors={['#1E3A8A', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHeader}>
                        <Text style={styles.headerTitle}>CONGELAMENTO DE ESTOQUE</Text>
                        <Text style={styles.headerSub}>Separação de estoque para Polpas e Congelados</Text>
                    </LinearGradient>
                )}

                <View style={styles.form}>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeBtn, tipo === 'DESCARTE' ? styles.typeActiveDescarte : { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                            onPress={() => setTipo('DESCARTE')}
                        >
                            <Ionicons name="trash-outline" size={18} color={tipo === 'DESCARTE' ? '#FFF' : colors.textSecondary} />
                            <Text style={[styles.typeText, { color: tipo === 'DESCARTE' ? '#FFF' : colors.textSecondary }]}>DESCARTE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.typeBtn, tipo === 'CONGELAMENTO' ? styles.typeActiveCongelamento : { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                            onPress={() => setTipo('CONGELAMENTO')}
                        >
                            <Ionicons name="snow-outline" size={18} color={tipo === 'CONGELAMENTO' ? '#FFF' : colors.textSecondary} />
                            <Text style={[styles.typeText, { color: tipo === 'CONGELAMENTO' ? '#FFF' : colors.textSecondary }]}>CONGELAR</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUTO ORIGEM *</Text>
                        <GlowInput
                            placeholder="EX: MORANGO"
                            value={produto}
                            onChangeText={(t) => up(t, setProduto)}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>QUANTIDADE (KG) *</Text>
                        <GlowInput
                            placeholder="0.00"
                            value={quantidade}
                            onChangeText={setQuantidade}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                            {tipo === 'DESCARTE' ? 'MOTIVO DO DESCARTE' : 'OBSERVAÇÕES DO LOTE'}
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                            placeholder={tipo === 'DESCARTE' ? "EX: MATURAÇÃO EXCESSIVA" : "EX: LOTE 15B, MORANGOS MENORES"}
                            value={motivo}
                            onChangeText={(t) => up(t, setMotivo)}
                            multiline
                            placeholderTextColor={colors.placeholder}
                        />
                    </View>

                    <PrimaryButton
                        label={tipo === 'DESCARTE' ? "CONFIRMAR PERDA" : "CONFIRMAR CONGELAMENTO"}
                        onPress={salvar}
                        style={{ backgroundColor: tipo === 'DESCARTE' ? '#7F1D1D' : '#1E3A8A' }}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    card: { borderRadius: 32, overflow: 'hidden', elevation: 8, shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 50 },
    cardHeader: { padding: 30 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: 'bold' },
    form: { padding: 25 },
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 5 },
    typeActiveDescarte: { backgroundColor: '#7F1D1D', borderColor: '#7F1D1D' },
    typeActiveCongelamento: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
    typeText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    field: { marginBottom: 20 },
    label: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 15 },
    textArea: { height: 100, textAlignVertical: 'top' }
});
