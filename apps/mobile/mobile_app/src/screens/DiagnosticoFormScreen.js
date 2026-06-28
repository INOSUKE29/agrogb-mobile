import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import Card from '../components/common/Card';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';

const { width } = Dimensions.get('window');

export default function DiagnosticoFormScreen() {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const navigation = useNavigation();

    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    
    // Form fields
    const [observacao, setObservacao] = useState('');
    const [area, setArea] = useState('');
    const [cultura, setCultura] = useState('');
    const [foto, setFoto] = useState(null);
    const [localizacao, setLocalizacao] = useState(null);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permissão', 'Precisamos de acesso à câmera para registrar a praga.');
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFoto(result.assets[0].uri);
        }
    };

    const captureGPS = async () => {
        setGpsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Negada', 'Precisamos de acesso ao GPS.');
                setGpsLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocalizacao({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude
            });
            Alert.alert('Sucesso', 'Localização exata capturada!');
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível capturar o GPS.');
        } finally {
            setGpsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!observacao.trim()) {
            return Alert.alert('Atenção', 'Você precisa descrever a ocorrência.');
        }

        setLoading(true);
        try {
            const json = await AsyncStorage.getItem('user_session');
            const session = json ? JSON.parse(json) : { id: 'unknown' };
            const now = new Date().toISOString();
            const diagUuid = uuidv4();
            
            let geoStr = null;
            if (localizacao) {
                geoStr = `${localizacao.lat},${localizacao.lng}`;
            }

            // 1. Insert into monitoramento_entidade
            await executeQuery(
                `INSERT INTO monitoramento_entidade 
                 (uuid, usuario_id, observacao_usuario, nivel_confianca, geoloc, status, criado_em, sync_status, last_updated) 
                 VALUES (?, ?, ?, 'TECNICO', ?, 'ABERTO', ?, 0, ?)`,
                [diagUuid, session.id, observacao, geoStr, now, now]
            );

            // Queue outbox for monitoramento_entidade
            const diagPayload = JSON.stringify({
                uuid: diagUuid,
                usuario_id: session.id,
                observacao_usuario: observacao,
                nivel_confianca: 'TECNICO',
                geoloc: geoStr,
                status: 'ABERTO'
            });

            await executeQuery(
                `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                [uuidv4(), 'monitoramento_entidade', diagUuid, 'INSERT', diagPayload, now]
            );

            // 2. Insert into monitoramento_media if there is a photo
            if (foto) {
                const mediaUuid = uuidv4();
                await executeQuery(
                    `INSERT INTO monitoramento_media (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em) 
                     VALUES (?, ?, 'IMAGEM', ?, ?)`,
                    [mediaUuid, diagUuid, foto, now]
                );

                const mediaPayload = JSON.stringify({
                    uuid: mediaUuid,
                    monitoramento_uuid: diagUuid,
                    tipo: 'IMAGEM',
                    caminho_arquivo: 'offline_storage' // Server-side needs to handle actual upload later
                });

                await executeQuery(
                    `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                    [uuidv4(), 'monitoramento_media', mediaUuid, 'INSERT', mediaPayload, now]
                );
            }

            Alert.alert('Sucesso', 'Diagnóstico registrado! Ele será sincronizado automaticamente quando houver conexão.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar o laudo.');
        } finally {
            setLoading(false);
        }
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : ['#F59E0B', '#D97706']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>NOVO DIAGNÓSTICO</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Laudo em Campo</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Card style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>1. EVIDÊNCIA VISUAL</Text>
                    
                    <TouchableOpacity 
                        style={[styles.photoBox, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]} 
                        onPress={takePhoto}
                        activeOpacity={0.8}
                    >
                        {foto ? (
                            <Image source={{ uri: foto }} style={styles.photoPreview} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="camera-outline" size={40} color={textMutedColor} />
                                <Text style={[styles.photoTxt, { color: textMutedColor }]}>Tirar Foto da Ocorrência</Text>
                            </View>
                        )}
                        {foto && (
                            <View style={styles.photoEditBadge}>
                                <Ionicons name="pencil" size={12} color="#FFF" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <Text style={[styles.sectionTitle, { color: textColor }]}>2. DETALHES TÉCNICOS</Text>
                    
                    <AgroInput 
                        label="OBSERVAÇÃO DO AGRÔNOMO *" 
                        value={observacao} 
                        onChangeText={setObservacao} 
                        multiline
                        placeholder="Ex: Identificado lagarta do cartucho com severidade alta na bordadura..."
                        icon="create-outline"
                    />

                    <AgroInput 
                        label="ÁREA / TALHÃO (Opcional)" 
                        value={area} 
                        onChangeText={setArea} 
                        placeholder="Nome do talhão"
                        icon="map-outline"
                    />

                    <View style={{ position: 'relative' }}>
                        <AgroInput 
                            label="LOCALIZAÇÃO EXATA" 
                            value={localizacao ? `Lat: ${localizacao.lat.toFixed(5)}, Lng: ${localizacao.lng.toFixed(5)}` : 'Não informada'} 
                            editable={false}
                            icon="pin-outline"
                        />
                        <TouchableOpacity style={styles.gpsCaptureBtn} onPress={captureGPS} disabled={gpsLoading}>
                            {gpsLoading ? (
                                <ActivityIndicator size="small" color="#F59E0B" />
                            ) : (
                                <View style={styles.gpsBadge}>
                                    <Ionicons name="locate" size={14} color="#F59E0B" />
                                    <Text style={styles.gpsText}>GPS</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.btnWrapper}>
                    <AgroButton 
                        title="SALVAR DIAGNÓSTICO" 
                        onPress={handleSave} 
                        loading={loading}
                        color="#F59E0B"
                        icon="checkmark-circle-outline"
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: { marginBottom: 20 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginTop: 5 },
    photoBox: { width: '100%', height: 180, borderRadius: 15, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: { alignItems: 'center' },
    photoTxt: { marginTop: 10, fontSize: 13, fontWeight: '500' },
    photoEditBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
    gpsCaptureBtn: { position: 'absolute', right: 12, top: 40, padding: 6, borderRadius: 8 },
    gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    gpsText: { fontSize: 10, fontWeight: '900', color: '#F59E0B' },
    btnWrapper: { paddingBottom: 20 }
});
