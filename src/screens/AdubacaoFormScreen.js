import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';
import { insertPlanoAdubacao, updatePlanoAdubacao } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../context/ThemeContext';

export default function AdubacaoFormScreen({ route, navigation }) {
    const { colors } = useTheme();
    const editMode = !!route.params?.plano;
    const plano = route.params?.plano || {};

    const [nome, setNome] = useState(plano.nome_plano || '');
    const [cultura, setCultura] = useState(plano.cultura || '');
    const [tipo, setTipo] = useState(plano.tipo_aplicacao || 'GOTEJO');
    const [area, setArea] = useState(plano.area_local || '');
    const [descricao, setDescricao] = useState(plano.descricao_tecnica || '');
    const [imageUri, setImageUri] = useState(plano.anexos_uri || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Permitir original
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.granted === false) {
            alert("É necessário acesso à câmera!");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!nome || !cultura || !descricao) {
            Alert.alert('Campos Obrigatórios', 'Preencha Nome, Cultura e a Receita (Descrição).');
            return;
        }

        setLoading(true);
        try {
            const data = {
                uuid: editMode ? plano.uuid : uuidv4(),
                nome_plano: nome,
                cultura,
                tipo_aplicacao: tipo,
                area_local: area,
                descricao_tecnica: descricao,
                status: editMode ? plano.status : 'PLANEJADO',
                data_criacao: editMode ? plano.data_criacao : new Date().toISOString(),
                data_aplicacao: editMode ? plano.data_aplicacao : null,
                anexos_uri: imageUri
            };

            if (editMode) {
                await updatePlanoAdubacao(plano.uuid, data);
            } else {
                await insertPlanoAdubacao(data);
            }

            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar plano.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{editMode ? 'Editar Plano' : 'Novo Plano de Adubação'}</Text>

            <AgroInput label="NOME DO PLANO (Ex: Tomate Sem. 4)" value={nome} onChangeText={(t) => setNome(t.toUpperCase())} />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <AgroInput label="CULTURA" value={cultura} onChangeText={(t) => setCultura(t.toUpperCase())} />
                </View>
                <View style={{ flex: 1 }}>
                    <AgroInput label="ÁREA / LOCAL" value={area} onChangeText={(t) => setArea(t.toUpperCase())} placeholder="Opcional" />
                </View>
            </View>

            {/* SELETOR TIPO DE APLICAÇÃO */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>TIPO DE APLICAÇÃO</Text>
            <View style={styles.pillContainer}>
                <TouchableOpacity
                    style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.glassBorder }, tipo === 'GOTEJO' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                    onPress={() => setTipo('GOTEJO')}
                >
                    <Text style={[styles.pillText, { color: colors.textMuted }, tipo === 'GOTEJO' && { color: colors.primary }]}>💧 GOTEJO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.glassBorder }, tipo === 'PULVERIZACAO' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                    onPress={() => setTipo('PULVERIZACAO')}
                >
                    <Text style={[styles.pillText, { color: colors.textMuted }, tipo === 'PULVERIZACAO' && { color: colors.primary }]}>🌫️ PULVERIZAÇÃO</Text>
                </TouchableOpacity>
            </View>

            {/* DESCRIÇÃO TÉCNICA */}
            <View style={styles.textAreaContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>RECEITA TÉCNICA / OBSERVAÇÕES</Text>
                <AgroInput
                    value={descricao}
                    onChangeText={setDescricao}
                    style={{ height: 150, textAlignVertical: 'top' }}
                    placeholder="Cole aqui a recomendação do WhatsApp ou digite os produtos e doses..."
                    multiline={true}
                />
            </View>

            {/* ANEXOS */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>FOTO / ANEXO (OPCIONAL)</Text>
            <View style={styles.attachContainer}>
                {imageUri ? (
                    <View style={styles.imagePreview}>
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                            <Ionicons name="trash" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.attachButtons}>
                        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} onPress={takePhoto}>
                            <Ionicons name="camera" size={24} color={colors.primary} />
                            <Text style={[styles.attachText, { color: colors.primary }]}>CÂMERA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} onPress={pickImage}>
                            <Ionicons name="images" size={24} color={colors.primary} />
                            <Text style={[styles.attachText, { color: colors.primary }]}>GALERIA</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <AgroButton title="SALVAR PLANO" onPress={handleSave} loading={loading} />
            <AgroButton title="CANCELAR" variant="secondary" onPress={() => navigation.goBack()} />

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    row: { flexDirection: 'row' },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    pillContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    pill: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    pillActive: { backgroundColor: '#ECFDF5' },
    pillText: { fontWeight: 'bold', fontSize: 12 },
    pillTextActive: {},
    textAreaContainer: { marginBottom: 10 },
    attachContainer: { marginBottom: 30 },
    attachButtons: { flexDirection: 'row', gap: 15 },
    attachBtn: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
    attachText: { fontSize: 12, fontWeight: 'bold', marginTop: 5 },
    imagePreview: { position: 'relative' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }
});
