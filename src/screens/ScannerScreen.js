import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation, route }) {
    const { theme } = useTheme();
    const [hasPermission, setHasPermission] = useState(null);
    const [step, setStep] = useState(1); // 1: Foto Produto, 2: Foto Rótulo, 3: Análise
    const [imgProduto, setImgProduto] = useState(null);
    const [imgRotulo, setImgRotulo] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const takePicture = async () => {
        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled) {
                if (step === 1) {
                    setImgProduto(result.assets[0].uri);
                    setStep(2);
                } else if (step === 2) {
                    setImgRotulo(result.assets[0].uri);
                    setStep(3);
                }
            }
        } catch (error) {
            Alert.alert('Erro de Captura', 'Não foi possível acessar a câmera do dispositivo.');
        }
    };

    const handleAnalysis = async () => {
        setProcessing(true);
        // Simulation of AI processing
        setTimeout(() => {
            setProcessing(false);
            const mockData = {
                nome: "FUNGICIDA PREMIUM X1",
                tipo: "DEFENSIVO",
                observacao: "Ingrediente Ativo: Tebuconazol. Dosagem recomendada: 0.5L/ha. Carência: 14 dias.",
                images: { produto: imgProduto, rotulo: imgRotulo }
            };

            Alert.alert("Inteligência Artificial", "Processamento concluído! Os dados técnicos foram extraídos com sucesso.");
            if (route.params?.onScanComplete) {
                route.params.onScanComplete(mockData);
            }
            navigation.goBack();
        }, 2500);
    };

    const reset = () => {
        setStep(1);
        setImgProduto(null);
        setImgRotulo(null);
    };

    if (hasPermission === null) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#10B981" />
        </View>
    );
    
    if (hasPermission === false) return (
        <View style={styles.center}>
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text style={styles.errorTxt}>Acesso à câmera negado.</Text>
            <AgroButton title="VOLTAR" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
        </View>
    );

    // STEP 3: PREVIEW & AI ANALYSIS
    if (step === 3) {
        return (
            <View style={[styles.container, { backgroundColor: '#F3F4F6' }]}>
                <LinearGradient colors={['#111827', '#1F2937']} style={styles.reviewHeader}>
                    <TouchableOpacity onPress={reset} style={styles.backBtnHeader}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.reviewTitle}>REVISÃO DE CAPTURA</Text>
                    <Text style={styles.reviewSub}>Verifique as imagens antes de processar com IA</Text>
                </LinearGradient>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reviewScroll}>
                    <View style={styles.previewGrid}>
                        <Card style={styles.previewCard} noPadding>
                            <Image source={{ uri: imgProduto }} style={styles.previewImg} />
                            <View style={styles.imgLabelBox}>
                                <Text style={styles.imgLabel}>VISTA DO PRODUTO</Text>
                            </View>
                        </Card>
                        <Card style={styles.previewCard} noPadding>
                            <Image source={{ uri: imgRotulo }} style={styles.previewImg} />
                            <View style={styles.imgLabelBox}>
                                <Text style={styles.imgLabel}>RÓTULO / TÉCNICO</Text>
                            </View>
                        </Card>
                    </View>

                    <View style={styles.aiInfoBox}>
                        <MaterialCommunityIcons name="auto-fix" size={24} color={theme?.colors?.primary} />
                        <Text style={styles.aiInfoText}>
                            Nossa IA analisará estas imagens para identificar o produto e extrair as especificações técnicas automaticamente.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.reviewActions}>
                    {processing ? (
                        <View style={styles.processingBox}>
                            <ActivityIndicator size="large" color={theme?.colors?.primary} />
                            <Text style={styles.processingTxt}>PROCESSANDO VISÃO COMPUTACIONAL...</Text>
                        </View>
                    ) : (
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.retryBtn} onPress={reset}>
                                <Text style={styles.retryTxt}>REPETIR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.processBtn, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={handleAnalysis}>
                                <MaterialCommunityIcons name="brain" size={20} color="#FFF" />
                                <Text style={styles.processTxt}>INICIAR ANÁLISE IA</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // STEPS 1 & 2: CAPTURE MODE
    return (
        <View style={styles.container}>
            <View style={styles.cameraWrapper}>
                <View style={styles.cameraTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepIndicatorTxt}>PASSO {step} DE 2</Text>
                    </View>
                </View>

                <View style={styles.guideBoxWrapper}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                        
                        <MaterialCommunityIcons 
                            name={step === 1 ? "package-variant-closed" : "text-box-search-outline"} 
                            size={80} 
                            color="rgba(255,255,255,0.3)" 
                        />
                    </View>
                    <Text style={styles.captureGuideTitle}>
                        {step === 1 ? 'ENQUADRE A EMBALAGEM' : 'ENQUADRE O RÓTULO'}
                    </Text>
                    <Text style={styles.captureGuideSub}>
                        {step === 1 ? 'Mostre o produto de frente' : 'Foque nos textos e especificações'}
                    </Text>
                </View>

                <View style={styles.cameraBottom}>
                    <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
                        <View style={styles.shutterInner}>
                            <Ionicons name="camera" size={30} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.shutterTip}>TOQUE PARA CAPTURAR</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 30 },
    errorTxt: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 15 },
    
    // Review Styles
    reviewHeader: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    backBtnHeader: { marginBottom: 15 },
    reviewTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    reviewSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4 },
    reviewScroll: { padding: 20 },
    previewGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    previewCard: { flex: 1, height: 280, overflow: 'hidden' },
    previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgLabelBox: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, alignItems: 'center' },
    imgLabel: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    aiInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, gap: 15, elevation: 2 },
    aiInfoText: { flex: 1, fontSize: 12, color: '#4B5563', fontWeight: '600', lineHeight: 18 },
    reviewActions: { padding: 25, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    btnRow: { flexDirection: 'row', gap: 15 },
    retryBtn: { flex: 0.4, padding: 18, borderRadius: 18, borderWith: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    retryTxt: { fontSize: 12, fontWeight: '900', color: '#6B7280' },
    processBtn: { flex: 0.6, padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, elevation: 4 },
    processTxt: { fontSize: 12, fontWeight: '900', color: '#FFF' },
    processingBox: { alignItems: 'center', paddingVertical: 10 },
    processingTxt: { fontSize: 10, fontWeight: '900', color: '#6B7280', marginTop: 15, letterSpacing: 1 },

    // Capture Styles
    cameraWrapper: { flex: 1, justifyContent: 'space-between' },
    cameraTop: { paddingTop: 60, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { padding: 5 },
    stepIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    stepIndicatorTxt: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    guideBoxWrapper: { alignItems: 'center' },
    scanFrame: { width: width * 0.75, height: height * 0.4, justifyContent: 'center', alignItems: 'center' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#10B981', borderStyle: 'solid' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 20 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 20 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 20 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 20 },
    captureGuideTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 30, letterSpacing: 0.5 },
    captureGuideSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8, fontWeight: '600' },
    cameraBottom: { paddingBottom: 60, alignItems: 'center' },
    shutterBtn: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    shutterTip: { color: '#FFF', fontSize: 11, fontWeight: '900', marginTop: 15, letterSpacing: 2, opacity: 0.6 }
});
