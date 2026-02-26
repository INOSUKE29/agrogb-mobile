import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, StyleSheet, Image, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getCadastro } from '../database/database';
import { COLORS } from '../styles/theme'; // NEW THEME
import { AppCard } from '../ui/components/AppCard';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
};

export default function MonitoramentoScreen({ navigation, route }) {
    // --- STATE ---
    const initialMode = route?.params?.screen || 'LANDING';
    const [screen, setScreen] = useState(initialMode); // LANDING, FORM

    useEffect(() => {
        if (route?.params?.screen) {
            setScreen(route.params.screen);
        }
    }, [route?.params?.screen]);

    const [loading, setLoading] = useState(false);

    // Form State
    const [form, setForm] = useState({
        uuid: '',
        cultura: '',
        data: '',
        observacao: '',
        tipo_problema: 'OBSERVACAO', // PRAGA, DOENCA, OBSERVACAO
        intensidade: 'MEDIA', // BAIXA, MEDIA, ALTA
        media: []
    });

    // Camera
    const [cameraVisible, setCameraVisible] = useState(false);
    const cameraRef = useRef(null);

    // --- ACTIONS ---
    const startNew = () => {
        setForm({
            uuid: uuidv4(),
            cultura: '',
            data: new Date().toISOString(),
            observacao: '',
            tipo_problema: 'OBSERVACAO',
            intensidade: 'MEDIA',
            media: []
        });
        setScreen('FORM');
    };

    const addMedia = (uri, type, base64 = null) => {
        setForm(prev => ({
            ...prev,
            media: [...prev.media, { uri, type, base64, id: uuidv4() }]
        }));
    };

    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const p = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
                addMedia(p.uri, 'IMAGEM', p.base64);
                setCameraVisible(false);
            } catch (e) { Alert.alert('Erro', 'Falha ao capturar foto'); }
        }
    };

    const saveFinal = async () => {
        if (form.media.length === 0) return Alert.alert('Atenção', 'Pelo menos uma foto é obrigatória no monitoramento.');

        setLoading(true);
        try {
            const uuid = form.uuid;
            let alertLevel = 'VERDE';
            if (form.intensidade === 'MEDIA') alertLevel = 'AMARELO';
            if (form.intensidade === 'ALTA') alertLevel = 'VERMELHO';

            // 1. Insert Entity
            await executeQuery(`
                INSERT INTO monitoramento_entidade 
                (uuid, cultura_id, data, observacao_usuario, status, nivel_confianca, criado_em, last_updated,
                 titulo, nivel_alerta, tags) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    uuid,
                    form.cultura ? form.cultura.toUpperCase() : 'GERAL',
                    form.data,
                    form.observacao ? form.observacao.toUpperCase() : '',
                    'CONFIRMADO',
                    'MANUAL',
                    new Date().toISOString(),
                    new Date().toISOString(),
                    form.tipo_problema,
                    alertLevel,
                    form.intensidade
                ]
            );

            // 2. Insert Media
            for (const m of form.media) {
                await executeQuery(`
                    INSERT INTO monitoramento_media (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em, last_updated) 
                    VALUES (?,?,?,?,?,?)`,
                    [uuidv4(), uuid, m.type, m.uri, new Date().toISOString(), new Date().toISOString()]
                );
            }

            Alert.alert('Sucesso', 'Monitoramento registrado!', [
                {
                    text: 'OK', onPress: () => {
                        setScreen('LANDING');
                    }
                }
            ]);

        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar registro.');
        } finally {
            setLoading(false);
        }
    };

    // --- LANDING SCREEN ---
    if (screen === 'LANDING') {
        return (
            <View style={styles.container}>
                <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
                <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
                        <Ionicons name="menu" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MONITORAMENTO</Text>
                    <Text style={styles.headerSub}>Registrar ocorrência no campo</Text>
                </View>

                <View style={styles.landingContent}>
                    <TouchableOpacity style={styles.bigButton} onPress={startNew}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="camera" size={40} color={COLORS.primaryLight} />
                        </View>
                        <Text style={styles.bigButtonTitle}>REGISTRAR AGORA</Text>
                        <Text style={styles.bigButtonSub}>FOTO • PRAGA • DOENÇA</Text>
                    </TouchableOpacity>

                    <AppCard style={{ marginTop: 32, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassBorder }}>
                        <Text style={styles.infoTitle}>INSTRUÇÕES TÉCNICAS</Text>
                        <Text style={styles.infoText}>1. Capture foto nítida do problema.</Text>
                        <Text style={styles.infoText}>2. Classifique o tipo e intensidade.</Text>
                        <Text style={styles.infoText}>3. O registro alimenta o Caderno de Campo.</Text>
                    </AppCard>
                </View>
            </View>
        );
    }

    // --- FORM SCREEN ---
    if (cameraVisible) return (
        <Modal visible={true}>
            <Camera style={{ flex: 1 }} ref={cameraRef}>
                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }}>
                    <TouchableOpacity onPress={takePhoto} style={styles.captureBtn} />
                    <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.closeCamera}><Ionicons name="close" size={40} color="#FFF" /></TouchableOpacity>
                </View>
            </Camera>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            <View style={styles.headerCompact}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setScreen('LANDING')} style={{ marginRight: 15 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitleCompact}>MONITORAMENTO</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" style={{ marginRight: 4 }} />
                            <Text style={styles.headerSubCompact}>{formatDate(form.data)}</Text>
                            {form.cultura ? (
                                <>
                                    <Text style={{ color: 'rgba(255,255,255,0.4)', marginHorizontal: 6 }}>|</Text>
                                    <Text style={styles.headerSubCompact}>{form.cultura}</Text>
                                </>
                            ) : null}
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

                {/* 1. MEDIA (MAIN) */}
                <AppCard>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="images-outline" size={18} color={COLORS.gray200} />
                        <Text style={styles.label}>EVIDÊNCIAS / FOTOS</Text>
                    </View>
                    <ScrollView horizontal style={{ marginBottom: 10 }} showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={() => setCameraVisible(true)}>
                            <Ionicons name="camera-outline" size={32} color={COLORS.primaryLight} />
                            <Text style={styles.addPhotoText}>ADICIONAR</Text>
                        </TouchableOpacity>
                        {form.media.map((m, i) => (
                            <View key={i} style={styles.mediaPreview}>
                                <Image source={{ uri: m.uri }} style={styles.mediaImg} />
                                <View style={styles.photoIndexBadge}>
                                    <Text style={styles.photoIndexText}>{i + 1}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    {form.media.length === 0 && <Text style={{ fontSize: 11, color: COLORS.destructive, fontStyle: 'italic' }}>* Obrigatório adicionar foto.</Text>}
                </AppCard>

                {/* 2. CLASSIFICACAO */}
                <AppCard>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="search-outline" size={18} color={COLORS.gray200} />
                        <Text style={styles.label}>CLASSIFICAÇÃO TÉCNICA</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.typeRow, form.tipo_problema === 'PRAGA' && styles.typeRowActive]}
                        onPress={() => setForm({ ...form, tipo_problema: 'PRAGA' })}
                    >
                        <MaterialCommunityIcons name="bug-outline" size={24} color={form.tipo_problema === 'PRAGA' ? COLORS.primaryLight : COLORS.gray500} />
                        <Text style={[styles.typeText, form.tipo_problema === 'PRAGA' && { color: COLORS.primaryLight }]}>PRAGA</Text>
                        {form.tipo_problema === 'PRAGA' && <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeRow, form.tipo_problema === 'DOENCA' && styles.typeRowActive]}
                        onPress={() => setForm({ ...form, tipo_problema: 'DOENCA' })}
                    >
                        <MaterialCommunityIcons name="bacteria-outline" size={24} color={form.tipo_problema === 'DOENCA' ? '#FBBF24' : COLORS.gray500} />
                        <Text style={[styles.typeText, form.tipo_problema === 'DOENCA' && { color: '#FBBF24' }]}>DOENÇA</Text>
                        {form.tipo_problema === 'DOENCA' && <Ionicons name="checkmark-circle" size={20} color="#FBBF24" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeRow, form.tipo_problema === 'OBSERVACAO' && styles.typeRowActive]}
                        onPress={() => setForm({ ...form, tipo_problema: 'OBSERVACAO' })}
                    >
                        <Ionicons name="eye-outline" size={24} color={form.tipo_problema === 'OBSERVACAO' ? COLORS.white : COLORS.gray500} />
                        <Text style={[styles.typeText, form.tipo_problema === 'OBSERVACAO' && { color: COLORS.white }]}>OBSERVAÇÃO GERAL</Text>
                        {form.tipo_problema === 'OBSERVACAO' && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                    </TouchableOpacity>
                </AppCard>

                {/* 3. INTENSIDADE */}
                <AppCard>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle-outline" size={18} color={COLORS.gray200} />
                        <Text style={styles.label}>NÍVEL DE SEVERIDADE</Text>
                    </View>

                    <View style={styles.intensityRow}>
                        <TouchableOpacity
                            style={[styles.intensityTag, form.intensidade === 'BAIXA' && { backgroundColor: COLORS.surface, borderColor: COLORS.gray500 }]}
                            onPress={() => setForm({ ...form, intensidade: 'BAIXA' })}
                        >
                            <Text style={[styles.intensityText, form.intensidade === 'BAIXA' && { color: COLORS.white, fontWeight: '900' }]}>BAIXA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.intensityTag, form.intensidade === 'MEDIA' && { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: '#FBBF24' }]}
                            onPress={() => setForm({ ...form, intensidade: 'MEDIA' })}
                        >
                            <Text style={[styles.intensityText, form.intensidade === 'MEDIA' && { color: '#FBBF24', fontWeight: '900' }]}>MÉDIA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.intensityTag, form.intensidade === 'ALTA' && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }]}
                            onPress={() => setForm({ ...form, intensidade: 'ALTA' })}
                        >
                            <Text style={[styles.intensityText, form.intensidade === 'ALTA' && { color: '#EF4444', fontWeight: '900' }]}>ALTA</Text>
                        </TouchableOpacity>
                    </View>
                </AppCard>

                {/* 4. OBSERVAÇÃO */}
                <AppCard>
                    <AppInput
                        label="NOTAS TÉCNICAS (OPCIONAL)"
                        value={form.observacao}
                        onChangeText={t => setForm({ ...form, observacao: t })}
                        placeholder="Descreva detalhes..."
                        multiline
                        style={{ height: 100, textAlignVertical: 'top', fontSize: 15 }}
                        variant="glass"
                    />
                </AppCard>

                <AppButton
                    title="FINALIZAR REGISTRO"
                    onPress={saveFinal}
                    loading={loading}
                    style={{ backgroundColor: COLORS.primary, marginBottom: 50, borderRadius: 24 }}
                    textStyle={{ fontWeight: '900', letterSpacing: 1 }}
                />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },

    header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    headerCompact: { padding: 20, paddingTop: 50, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
    headerSub: { color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: '600', fontSize: 13, letterSpacing: 0.5 },

    headerTitleCompact: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    headerSubCompact: { color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', fontSize: 12 },

    landingContent: { flex: 1, justifyContent: 'center', padding: 25 },
    bigButton: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, width: '100%' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    bigButtonTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
    bigButtonSub: { fontSize: 12, color: COLORS.gray500, marginTop: 8, fontWeight: 'bold' },

    infoTitle: { fontWeight: '900', marginBottom: 12, color: COLORS.primaryLight, fontSize: 11, letterSpacing: 1 },
    infoText: { color: COLORS.gray200, marginBottom: 6, fontSize: 13 },

    formContainer: { padding: 15 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
    label: { fontSize: 11, fontWeight: '800', color: COLORS.gray200, letterSpacing: 0.5 },

    // Photo
    addPhotoBtn: { width: 90, height: 90, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.glassBorder },
    addPhotoText: { fontSize: 9, fontWeight: 'bold', marginTop: 4, color: COLORS.gray500 },
    mediaPreview: { marginRight: 10, position: 'relative' },
    mediaImg: { width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
    photoIndexBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, borderRadius: 4 },
    photoIndexText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    // Type Selector
    typeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
    typeRowActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: COLORS.primaryLight },
    typeText: { flex: 1, marginLeft: 15, fontSize: 14, fontWeight: 'bold', color: COLORS.gray500, letterSpacing: 0.5 },

    // Intensity
    intensityRow: { flexDirection: 'row', gap: 10 },
    intensityTag: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    intensityText: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray500, letterSpacing: 0.5 },

    captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 4, borderColor: '#DDD' },
    closeCamera: { position: 'absolute', top: 50, right: 30 }
});
