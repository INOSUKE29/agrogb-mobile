import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, StatusBar as RNStatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertDescarte } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../ui/theme/colors';
import { Spacing } from '../ui/theme/spacing';
import { Radius } from '../ui/theme/radius';
import { AppCard } from '../ui/components/AppCard';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function DescarteScreen({ navigation }) {
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
            data: new Date().toISOString().split('T')[0]
        };

        try {
            await insertDescarte(dados);
            Alert.alert('Sucesso', 'Perda registrada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar o descarte.');
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#7F1D1D" />
            <LinearGradient colors={[Colors.primaryLight, Colors.background]} style={StyleSheet.absoluteFill} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

                {/* HEADER CARD */}
                <View style={styles.headerCard}>
                    <LinearGradient colors={['#7F1D1D', '#991B1B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.headerTitle}>REGISTRO DE PERDAS</Text>
                                <Text style={styles.headerSub}>Controle de Avarias e Descarte</Text>
                            </View>
                            <Ionicons name="trash-outline" size={24} color="rgba(255,255,255,0.8)" />
                        </View>
                    </LinearGradient>
                </View>

                {/* FORMULÁRIO */}
                <AppCard>
                    <AppInput
                        label="PRODUTO DESCARTADO *"
                        placeholder="EX: MORANGO - QUEBRA"
                        value={produto}
                        onChangeText={(t) => up(t, setProduto)}
                        autoCapitalize="characters"
                    />

                    <AppInput
                        label="QUANTIDADE (KG) *"
                        placeholder="0.00"
                        value={quantidade}
                        onChangeText={setQuantidade}
                        keyboardType="decimal-pad"
                    />

                    <AppInput
                        label="MOTIVO DO DESCARTE"
                        placeholder="EX: TRANSPORTE / MATURAÇÃO"
                        value={motivo}
                        onChangeText={(t) => up(t, setMotivo)}
                        multiline
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />

                    <AppButton
                        title="CONFIRMAR PERDA"
                        onPress={salvar}
                        style={{ backgroundColor: '#7F1D1D', marginTop: Spacing.xl }}
                    />
                </AppCard>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    headerCard: { marginTop: 20, marginBottom: Spacing.lg, borderRadius: Radius.xl, elevation: 8, backgroundColor: '#FFF', overflow: 'hidden' },
    headerGradient: { padding: 30 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: 'bold' },
});
