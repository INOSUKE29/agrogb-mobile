import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerScreen({ navigation, route }) {
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
                quality: 0.5,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled) {
                if (step === 1) {
                    setImgProduto(result.assets[0].uri);
                    setStep(2); // Próximo passo: Rótulo
                } else if (step === 2) {
                    setImgRotulo(result.assets[0].uri);
                    setStep(3); // Próximo passo: Review/Análise
                }
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível capturar a foto.');
        }
    };

    const handleAnalysis = async () => {
        setProcessing(true);
        // SIMULAÇÃO DA CHAMADA AI/PYTHON
        setTimeout(() => {
            setProcessing(false);
            // Retorna para a tela de cadastro com os dados "extraídos"
            // No futuro: Passar o JSON real da AI
            const mockData = {
                nome: "PRODUTO DETECTADO (AI)",
                tipo: "DEFENSIVO",
                observacao: "Ingrediente Ativo: Glifosato. Dosagem: 2L/ha.",
                images: { produto: imgProduto, rotulo: imgRotulo }
            };

            Alert.alert("Sucesso", "Dados extraídos com Inteligência Artificial!");
            if (route.params?.onScanComplete) {
                route.params.onScanComplete(mockData);
            }
            navigation.goBack();
        }, 2000);
    };

    const reset = () => {
        setStep(1);
        setImgProduto(null);
        setImgRotulo(null);
    };

    if (hasPermission === null) return <View />;
    if (hasPermission === false) return <Text>Sem acesso à câmera</Text>;

    // STEP 3: PREVIEW & ANÁLISE
    if (step === 3) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Revisão das Imagens</Text>
                </View>

                <View style={styles.previewContainer}>
                    <View style={styles.previewCard}>
                        <Image source={{ uri: imgProduto }} style={styles.previewImg} />
                        <Text style={styles.previewLabel}>Produto</Text>
                    </View>
                    <View style={styles.previewCard}>
                        <Image source={{ uri: imgRotulo }} style={styles.previewImg} />
                        <Text style={styles.previewLabel}>Rótulo/Bula</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    {processing ? (
                        <ActivityIndicator size="large" color="#10B981" />
                    ) : (
                        <>
                            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={reset}>
                                <Text style={styles.btnTextOutline}>Tentar Novamente</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleAnalysis}>
                                <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnTextPrimary}>PROCESSAR COM IA</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    }

    // STEPS 1 & 2: CÂMERA MODO DE CAPTURA RÁPIDA
    return (
        <View style={styles.container}>
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <View style={[styles.topBar, { position: 'absolute', top: 0, width: '100%' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>PASSO {step}/2</Text>
                    </View>
                </View>

                <View style={styles.guideContainer}>
                    <Ionicons name="camera-outline" size={80} color="#10B981" />
                    <Text style={[styles.guideText, { fontSize: 18, marginTop: 20 }]}>
                        {step === 1 ? 'TOQUE ABAIXO PARA FOTO DO PRODUTO' : 'AGORA A FOTO RÓTULO / BULA'}
                    </Text>
                </View>

                <View style={[styles.bottomBar, { position: 'absolute', bottom: 0, width: '100%' }]}>
                    <Text style={styles.instruction}>
                        {step === 1 ? 'Foto clara da embalagem' : 'Textos técnicos visíveis'}
                    </Text>
                    <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                        <Ionicons name="scan-outline" size={30} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between' },
    topBar: { paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
    stepText: { color: '#10B981', fontWeight: 'bold', fontSize: 12 },

    guideContainer: { alignItems: 'center', justifyContent: 'center' },
    guideBox: { width: 250, height: 350, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    guideBoxText: { width: 300, height: 200, borderColor: '#10B981' },
    guideText: { color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },

    bottomBar: { paddingBottom: 40, alignItems: 'center', backgroundColor: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))' },
    instruction: { color: '#FFF', fontSize: 14, marginBottom: 20, fontWeight: '500' },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },

    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },

    previewContainer: { flex: 1, padding: 20, flexDirection: 'row', gap: 15, backgroundColor: '#F3F4F6' },
    previewCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 10, alignItems: 'center', elevation: 2 },
    previewImg: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10, resizeMode: 'cover' },
    previewLabel: { fontWeight: 'bold', color: '#374151' },

    actions: { padding: 20, backgroundColor: '#FFF', gap: 10 },
    btn: { padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    btnPrimary: { backgroundColor: '#10B981' },
    btnOutline: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
    btnTextPrimary: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    btnTextOutline: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
});
