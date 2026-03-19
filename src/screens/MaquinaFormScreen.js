import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertMaquina, updateMaquinaRevisao } from '../database/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';
import { showToast } from '../ui/Toast';

const TIPOS = [
    { id: 'TRATOR', label: 'Trator', icon: 'tractor' },
    { id: 'CAMINHAO', label: 'Caminhão', icon: 'truck-outline' },
    { id: 'IMPLEMENTO', label: 'Implemento', icon: 'tools' },
    { id: 'OUTRO', label: 'Outro', icon: 'car-outline' },
];

export default function MaquinaFormScreen({ navigation, route }) {
    const { colors, isDark } = useTheme();
    const editItem = route.params?.editItem;

    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [placa, setPlaca] = useState('');
    const [horimetro, setHorimetro] = useState('');
    const [revisao, setRevisao] = useState('');

    useEffect(() => {
        if (editItem) {
            setNome(editItem.nome);
            setTipo(editItem.tipo || 'TRATOR');
            setPlaca(editItem.placa || '');
            setHorimetro(editItem.horimetro_atual?.toString() || '0');
            setRevisao(editItem.intervalo_revisao?.toString() || '250');
        }
    }, [editItem]);

    const handleSave = async () => {
        if (!nome.trim()) {
            return Alert.alert('Atenção', 'O nome da máquina é obrigatório.');
        }

        const hNum = parseFloat(horimetro) || 0;
        const rNum = parseFloat(revisao) || 0;

        try {
            if (editItem) {
                await updateMaquinaRevisao(editItem.uuid, hNum, rNum);
                showToast('Máquina atualizada!');
            } else {
                await insertMaquina({
                    uuid: uuidv4(),
                    nome: nome.toUpperCase(),
                    tipo: tipo,
                    placa: placa.toUpperCase(),
                    horimetro_atual: hNum,
                    intervalo_revisao: rNum
                });
                showToast('Máquina cadastrada com sucesso!');
            }
            navigation.goBack();
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar a máquina.');
        }
    };

    return (
        <AppContainer>
            <ScreenHeader 
                title={editItem ? 'EDITAR MÁQUINA' : 'NOVA MÁQUINA'} 
                onBack={() => navigation.goBack()} 
            />
            
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card style={styles.card}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>NOME / IDENTIFICAÇÃO *</Text>
                    <AgroInput
                        placeholder="Ex: TRATOR JOHN DEERE 6125"
                        value={nome}
                        onChangeText={setNome}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>TIPO DE VEÍCULO</Text>
                    <View style={styles.tipoGrid}>
                        {TIPOS.map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.tipoItem,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border },
                                    tipo === t.id && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                                ]}
                                onPress={() => setTipo(t.id)}
                            >
                                <MaterialCommunityIcons 
                                    name={t.icon} 
                                    size={24} 
                                    color={tipo === t.id ? colors.primary : colors.textMuted} 
                                />
                                <Text style={[styles.tipoLabel, { color: tipo === t.id ? colors.primary : colors.textSecondary }]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>PLACA / CHASSI (OPCIONAL)</Text>
                    <AgroInput
                        placeholder="ABC-1234"
                        value={placa}
                        onChangeText={setPlaca}
                        autoCapitalize="characters"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>HORÍMETRO / KM</Text>
                            <AgroInput
                                placeholder="0"
                                value={horimetro}
                                onChangeText={setHorimetro}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>REVISÃO EM (H/KM)</Text>
                            <AgroInput
                                placeholder="250"
                                value={revisao}
                                onChangeText={setRevisao}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <AgroButton 
                        title={editItem ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR MÁQUINA'}
                        icon="checkmark-circle"
                        onPress={handleSave}
                        style={{ marginTop: 20 }}
                    />
                </Card>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20 },
    card: { padding: 20 },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 10 },
    tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    tipoItem: { 
        width: '48%', 
        padding: 15, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        alignItems: 'center', 
        gap: 8 
    },
    tipoLabel: { fontSize: 12, fontWeight: '800' },
    row: { flexDirection: 'row', gap: 15 }
});
