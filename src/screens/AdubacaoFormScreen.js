import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../ui/theme/colors';
import { Spacing } from '../ui/theme/spacing';
import { Radius } from '../ui/theme/radius';
import { AppCard } from '../ui/components/AppCard';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';
import { insertPlanoAdubacao, updatePlanoAdubacao } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdubacaoFormScreen({ route, navigation }) {
    const editMode = !!route.params?.plano;
    const plano = route.params?.plano || {};

    const [nome, setNome] = useState(plano.nome_plano || '');
    const [cultura, setCultura] = useState(plano.cultura || '');
    const [tipo, setTipo] = useState(plano.tipo_aplicacao || 'GOTEJO');
    const [area, setArea] = useState(plano.area_local || '');
    const [descricao, setDescricao] = useState(plano.descricao_tecnica || '');
    const [imageUri, setImageUri] = useState(plano.anexos_uri || null);
    const [fileType, setFileType] = useState(plano.anexos_uri && plano.anexos_uri.endsWith('.pdf') ? 'pdf' : 'image');
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setFileType('image');
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
            setFileType('image');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                setFileType('pdf');
            } else if (result.type === 'success') {
                setImageUri(result.uri);
                setFileType('pdf');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha ao selecionar documento.');
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
        <View style={styles.container}>
            <RNStatusBar barStyle="dark-content" backgroundColor={Colors.primaryLight} />
            <LinearGradient colors={[Colors.primaryLight, Colors.background]} style={StyleSheet.absoluteFill} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{editMode ? 'EDITAR PLANO' : 'NOVO PLANO DE ADUBAÇÃO'}</Text>
                    <Text style={styles.headerSub}>Nutrição e Planejamento de Safra</Text>
                </View>

                {/* FORM */}
                <AppCard>
                    <AppInput
                        label="NOME DO PLANO (Ex: Tomate Sem. 4)"
                        value={nome}
                        onChangeText={(t) => setNome(t.toUpperCase())}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: Spacing.md }}>
                            <AppInput
                                label="CULTURA"
                                value={cultura}
                                onChangeText={(t) => setCultura(t.toUpperCase())}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="ÁREA / LOCAL"
                                value={area}
                                onChangeText={(t) => setArea(t.toUpperCase())}
                                placeholder="Opcional"
                            />
                        </View>
                    </View>

                    {/* SELETOR TIPO DE APLICAÇÃO */}
                    <Text style={styles.label}>TIPO DE APLICAÇÃO</Text>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'GOTEJO' && styles.pillActive]}
                            onPress={() => setTipo('GOTEJO')}
                        >
                            <Text style={[styles.pillText, tipo === 'GOTEJO' && styles.pillTextActive]}>💧 GOTEJO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'PULVERIZACAO' && styles.pillActive]}
                            onPress={() => setTipo('PULVERIZACAO')}
                        >
                            <Text style={[styles.pillText, tipo === 'PULVERIZACAO' && styles.pillTextActive]}>🌫️ PULVERIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>

                    {/* DESCRIÇÃO TÉCNICA */}
                    <AppInput
                        label="RECEITA TÉCNICA / OBSERVAÇÕES"
                        value={descricao}
                        onChangeText={setDescricao}
                        style={{ height: 150, textAlignVertical: 'top' }}
                        placeholder="Cole aqui a recomendação do WhatsApp ou digite os produtos e doses..."
                        multiline={true}
                    />
                </AppCard>

                {/* ANEXOS */}
                <Text style={styles.labelSection}>DOCUMENTO / FOTO (OPCIONAL)</Text>
                <AppCard style={{ padding: 10 }}>
                    {imageUri ? (
                        <View style={styles.imagePreview}>
                            {fileType === 'pdf' ? (
                                <View style={[styles.pdfPreview, { height: 150, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }]}>
                                    <FontAwesome5 name="file-pdf" size={50} color="#EF4444" />
                                    <Text style={{ marginTop: 10, color: '#374151', fontWeight: 'bold' }}>DOCUMENTO PDF ANEXADO</Text>
                                </View>
                            ) : (
                                <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
                            )}

                            <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                                <Ionicons name="trash" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.attachButtons}>
                            <TouchableOpacity style={styles.attachBtn} onPress={takePhoto}>
                                <Ionicons name="camera" size={24} color={Colors.primary} />
                                <Text style={styles.attachText}>CÂMERA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                                <Ionicons name="images" size={24} color={Colors.primary} />
                                <Text style={styles.attachText}>GALERIA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
                                <FontAwesome5 name="file-pdf" size={24} color="#EF4444" />
                                <Text style={[styles.attachText, { color: '#EF4444' }]}>PDF</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </AppCard>

                <AppButton title="SALVAR PLANO" onPress={handleSave} loading={loading} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: Colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: { marginBottom: 20, marginTop: 10, marginLeft: 10 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

    row: { flexDirection: 'row' },

    label: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
    labelSection: { fontSize: 12, fontWeight: '900', color: Colors.textSecondary, marginLeft: 10, marginBottom: 10, marginTop: 10, letterSpacing: 1 },

    pillContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    pill: { flex: 1, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
    pillActive: { backgroundColor: '#ECFDF5', borderColor: Colors.primary },
    pillText: { fontWeight: 'bold', color: Colors.textSecondary, fontSize: 12 },
    pillTextActive: { color: Colors.primary },

    // Attachments
    attachButtons: { flexDirection: 'row', gap: 15 },
    attachBtn: { flex: 1, backgroundColor: '#F9FAFB', padding: 20, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    attachText: { fontSize: 10, fontWeight: 'bold', color: Colors.primary, marginTop: 5 },
    imagePreview: { position: 'relative' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }
});
