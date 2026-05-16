import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function OcrScreen({ navigation }) {
    const { theme } = useTheme();
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        Alert.alert(
            'Código Identificado', 
            `A nota fiscal ou código foi detectado com sucesso.\n\nTipo: ${type}\nDados: ${data}`, 
            [{ text: 'CONTINUAR', onPress: () => setScanned(false) }]
        );
    };

    if (hasPermission === null) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }
    
    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-reverse-outline" size={60} color="#EF4444" />
                <Text style={styles.errorTxt}>Sem acesso à câmera do dispositivo.</Text>
                <TouchableOpacity style={styles.backBtnAction} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnTxt}>VOLTAR</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#111827', 'rgba(17,24,39,0.8)']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>LEITOR INTELIGENTE</Text>
                        <Text style={styles.headerSub}>Captura de Notas e Códigos</Text>
                    </View>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <Camera
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={styles.camera}
                ratio="16:9"
            >
                <View style={styles.overlay}>
                    <View style={styles.scanContainer}>
                        <View style={styles.scannerLine} />
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                    
                    <View style={styles.instructionBox}>
                        <MaterialCommunityIcons name="qrcode-scan" size={24} color="#10B981" />
                        <Text style={styles.instruction}>Aponte para o QR Code ou Código de Barras</Text>
                    </View>
                </View>
            </Camera>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.torchBtn}>
                    <Ionicons name="flashlight-outline" size={24} color="#FFF" />
                    <Text style={styles.torchTxt}>LANTERNA</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    errorTxt: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 15 },
    backBtnAction: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: '#111827', borderRadius: 12 },
    backBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 12 },
    
    header: { position: 'absolute', top: 0, width: '100%', zIndex: 10, paddingTop: 60, paddingBottom: 25, paddingHorizontal: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitleBox: { alignItems: 'center' },
    headerTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
    closeBtn: { padding: 5 },
    
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanContainer: { width: width * 0.8, height: width * 0.8, justifyContent: 'center', alignItems: 'center' },
    scannerLine: { width: '100%', height: 2, backgroundColor: '#10B981', position: 'absolute', top: '50%', shadowColor: '#10B981', shadowOpacity: 1, shadowRadius: 10, elevation: 10 },
    
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#10B981', borderStyle: 'solid' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    
    instructionBox: { position: 'absolute', bottom: 150, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 20, gap: 10 },
    instruction: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    
    bottomBar: { position: 'absolute', bottom: 0, width: '100%', paddingBottom: 50, alignItems: 'center' },
    torchBtn: { alignItems: 'center', gap: 8 },
    torchTxt: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, opacity: 0.8 }
});
