import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertDescarte } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function DescarteScreen({ navigation }) {
    const { theme } = useTheme();
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');

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
            data: new Date().toISOString().split('T')[0]
        };

        try {
            await insertDescarte(dados);
            Alert.alert('Sucesso', 'Registro de perda confirmado com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar o descarte no banco de dados.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#7F1D1D', '#991B1B']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>REGISTRO DE PERDAS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Controle de Avarias e Descarte de Produtos</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.formCard}>
                    <View style={styles.infoBox}>
                        <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.infoText}>
                            Certifique-se de registrar o motivo real da perda para auditoria de estoque.
                        </Text>
                    </View>

                    <AgroInput 
                        label="PRODUTO DESCARTADO *" 
                        value={produto} 
                        onChangeText={t => setProduto(t.toUpperCase())} 
                        autoCapitalize="characters" 
                        placeholder="EX: MORANGO ESPECIAL - QUEBRA"
                        icon="cube-outline"
                    />

                    <AgroInput 
                        label="QUANTIDADE (KG) *" 
                        value={quantidade} 
                        onChangeText={setQuantidade} 
                        keyboardType="decimal-pad" 
                        placeholder="0.00"
                        icon="scale-outline"
                    />

                    <AgroInput 
                        label="MOTIVO DO DESCARTE" 
                        value={motivo} 
                        onChangeText={t => setMotivo(t.toUpperCase())} 
                        multiline 
                        autoCapitalize="characters" 
                        placeholder="EX: TRANSPORTE / MATURAÇÃO EXCESSIVA"
                        icon="chatbubble-ellipses-outline"
                    />

                    <AgroButton 
                        title="CONFIRMAR PERDA" 
                        onPress={salvar} 
                        variant="danger"
                        style={{ marginTop: 20 }}
                    />
                </Card>

                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelTxt}>CANCELAR OPERAÇÃO</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    formCard: { padding: 25 },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: '#7F1D1D', fontWeight: '600', lineHeight: 18 },
    cancelBtn: { alignSelf: 'center', marginTop: 25, padding: 10 },
    cancelTxt: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }
});
