import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { insertPlanoAdubacao, updatePlanoAdubacao } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';

// Design System
import Card from '../components/common/Card';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';

export default function AdubacaoFormScreen({ route, navigation }) {
    const { theme } = useTheme();
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
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.granted === false) {
            Alert.alert("Erro", "É necessário acesso à câmera!");
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

            Alert.alert('Sucesso', 'Plano salvo com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar plano.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}
        >
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editMode ? 'EDITAR PLANO' : 'NOVO PLANO'}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Preencha as informações do plano nutricional</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.formCard}>
                    <AgroInput 
                        label="NOME DO PLANO" 
                        value={nome} 
                        onChangeText={(t) => setNome(t.toUpperCase())} 
                        placeholder="EX: ADUBAÇÃO TOMATE SEM. 4"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="CULTURA" 
                                value={cultura} 
                                onChangeText={(t) => setCultura(t.toUpperCase())} 
                                placeholder="EX: TOMATE"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="ÁREA / LOCAL" 
                                value={area} 
                                onChangeText={(t) => setArea(t.toUpperCase())} 
                                placeholder="OPCIONAL" 
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>TIPO DE APLICAÇÃO</Text>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'GOTEJO' && { backgroundColor: theme?.colors?.primary + '20', borderColor: theme?.colors?.primary }]}
                            onPress={() => setTipo('GOTEJO')}
                        >
                            <Text style={[styles.pillText, tipo === 'GOTEJO' && { color: theme?.colors?.primary }]}>💧 GOTEJO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'PULVERIZACAO' && { backgroundColor: theme?.colors?.primary + '20', borderColor: theme?.colors?.primary }]}
                            onPress={() => setTipo('PULVERIZACAO')}
                        >
                            <Text style={[styles.pillText, tipo === 'PULVERIZACAO' && { color: theme?.colors?.primary }]}>🌫️ PULVERIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>RECEITA TÉCNICA / OBSERVAÇÕES</Text>
                    <Card noPadding>
                        <AgroInput
                            value={descricao}
                            onChangeText={setDescricao}
                            style={styles.textArea}
                            placeholder="Descreva aqui os produtos, doses e orientações de aplicação..."
                            multiline={true}
                        />
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ANEXO / COMPROVANTE (OPCIONAL)</Text>
                    <View style={styles.attachWrapper}>
                        {imageUri ? (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                                    <Ionicons name="trash" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.attachButtons}>
                                <TouchableOpacity style={styles.attachBtn} onPress={takePhoto}>
                                    <Ionicons name="camera" size={24} color={theme?.colors?.primary} />
                                    <Text style={[styles.attachText, { color: theme?.colors?.primary }]}>CÂMERA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                                    <Ionicons name="images" size={24} color={theme?.colors?.primary} />
                                    <Text style={[styles.attachText, { color: theme?.colors?.primary }]}>GALERIA</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <AgroButton title="SALVAR PLANO" onPress={handleSave} loading={loading} />
                <AgroButton title="CANCELAR" variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: 12 }} />

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    formCard: { padding: 20, marginBottom: 20 },
    row: { flexDirection: 'row' },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
    pillContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
    pill: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    pillText: { fontWeight: '900', color: '#6B7280', fontSize: 11 },
    section: { marginBottom: 25 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    textArea: { height: 150, textAlignVertical: 'top', borderBottomWidth: 0 },
    attachWrapper: { marginBottom: 10 },
    attachButtons: { flexDirection: 'row', gap: 15 },
    attachBtn: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    attachText: { fontSize: 10, fontWeight: '900', marginTop: 8 },
    imagePreview: { position: 'relative', height: 200, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    previewImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: 8, borderRadius: 10 }
});
