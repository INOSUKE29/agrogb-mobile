import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import { v4 as uuidv4 } from 'uuid';
import { Picker } from '@react-native-picker/picker';

export default function BibliotecaFormScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'Defensivo',
        fabricante: '',
        dose_padrao: '',
        principio_ativo: ''
    });

    const THEME = {
        bg: theme?.colors?.bg ?? '#0B121E',
        card: theme?.colors?.card ?? '#152235',
        text: theme?.colors?.text ?? '#F3F4F6',
        textSub: theme?.colors?.textMuted ?? '#9CA3AF',
        primary: theme?.colors?.primary ?? '#10B981',
        border: theme?.colors?.border ?? 'rgba(255,255,255,0.05)',
        warning: theme?.colors?.warning ?? '#F59E0B'
    };

    const handleSave = async () => {
        if (!formData.nome.trim()) {
            Alert.alert('Erro', 'O nome do produto é obrigatório.');
            return;
        }

        try {
            setLoading(true);
            const uuid = uuidv4();
            const now = new Date().toISOString();

            const sql = `
                INSERT INTO cadastro (
                    uuid, nome, tipo, fabricante, dose_padrao, principio_ativo,
                    status_curadoria, last_updated, sync_status, is_deleted
                ) VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE', ?, 0, 0)
            `;

            const params = [
                uuid,
                formData.nome,
                formData.tipo,
                formData.fabricante,
                formData.dose_padrao,
                formData.principio_ativo,
                now
            ];

            await executeQuery(sql, params);
            
            // Queue for sync
            const payload = JSON.stringify({
                uuid,
                nome: formData.nome,
                tipo: formData.tipo,
                fabricante: formData.fabricante,
                dose_padrao: formData.dose_padrao,
                principio_ativo: formData.principio_ativo,
                status_curadoria: 'PENDENTE'
            });

            await executeQuery(
                `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                [uuidv4(), 'cadastro', uuid, 'INSERT', payload, now]
            );
            
            Alert.alert('Sucesso', 'Produto salvo e adicionado à fila de validação.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Erro ao salvar produto local:', error);
            Alert.alert('Erro', 'Não foi possível salvar o produto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { backgroundColor: THEME.bg }]}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={THEME.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: THEME.text }]}>Sugerir Produto</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.alertBox}>
                        <Ionicons name="information-circle" size={20} color={THEME.warning} />
                        <Text style={[styles.alertText, { color: THEME.warning }]}>
                            Este produto ficará disponível no seu app imediatamente para uso em prescrições, mas aparecerá como "Em Validação" até que um Administrador o aprove na base global.
                        </Text>
                    </View>

                    <Text style={[styles.label, { color: THEME.text }]}>Tipo de Insumo</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                        <Picker
                            selectedValue={formData.tipo}
                            onValueChange={(itemValue) => setFormData({ ...formData, tipo: itemValue })}
                            style={{ color: THEME.text }}
                            dropdownIconColor={THEME.textSub}
                        >
                            <Picker.Item label="Defensivo" value="Defensivo" />
                            <Picker.Item label="Fertilizante" value="Fertilizante" />
                            <Picker.Item label="Semente" value="Semente" />
                            <Picker.Item label="Outros" value="Outros" />
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: THEME.text }]}>Nome do Produto *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: THEME.card, color: THEME.text, borderColor: THEME.border }]}
                        placeholder="Ex: Roundup Original"
                        placeholderTextColor={THEME.textSub}
                        value={formData.nome}
                        onChangeText={(text) => setFormData({ ...formData, nome: text })}
                    />

                    <Text style={[styles.label, { color: THEME.text }]}>Fabricante</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: THEME.card, color: THEME.text, borderColor: THEME.border }]}
                        placeholder="Ex: Monsanto / Bayer"
                        placeholderTextColor={THEME.textSub}
                        value={formData.fabricante}
                        onChangeText={(text) => setFormData({ ...formData, fabricante: text })}
                    />

                    <Text style={[styles.label, { color: THEME.text }]}>Princípio Ativo</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: THEME.card, color: THEME.text, borderColor: THEME.border }]}
                        placeholder="Ex: Glifosato"
                        placeholderTextColor={THEME.textSub}
                        value={formData.principio_ativo}
                        onChangeText={(text) => setFormData({ ...formData, principio_ativo: text })}
                    />

                    <Text style={[styles.label, { color: THEME.text }]}>Dose Padrão Sugerida</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: THEME.card, color: THEME.text, borderColor: THEME.border }]}
                        placeholder="Ex: 2 L/ha"
                        placeholderTextColor={THEME.textSub}
                        value={formData.dose_padrao}
                        onChangeText={(text) => setFormData({ ...formData, dose_padrao: text })}
                    />

                </ScrollView>

                <View style={[styles.footer, { backgroundColor: THEME.bg, borderTopColor: THEME.border }]}>
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: THEME.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>{loading ? 'Salvando...' : 'Salvar e Validar'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 15, borderRadius: 10, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
    alertText: { flex: 1, fontSize: 12, marginLeft: 10, lineHeight: 18 },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, height: 50, fontSize: 15 },
    pickerContainer: { borderWidth: 1, borderRadius: 10, height: 50, justifyContent: 'center' },
    footer: { padding: 20, borderTopWidth: 1 },
    saveBtn: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
