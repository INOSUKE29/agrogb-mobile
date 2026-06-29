import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, SafeAreaView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import Card from '../components/common/Card';

const { width } = Dimensions.get('window');

export default function DiagnosticosScreen() {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Puxamos v2_monitoramentos e fazemos join com v2_monitoramentos_midia para tentar pegar uma imagem
            const sql = `
                SELECT m.*, 
                       (SELECT caminho_arquivo FROM v2_monitoramentos_midia WHERE monitoramento_uuid = m.uuid AND tipo = 'IMAGEM' LIMIT 1) as imagem_capa
                FROM v2_monitoramentos m
                ORDER BY m.criado_em DESC
                LIMIT 50
            `;
            const res = await executeQuery(sql);
            const results = [];
            for (let i = 0; i < res.rows.length; i++) {
                results.push(res.rows.item(i));
            }
            setItems(results);
        } catch (e) {
            console.error('Erro ao carregar diagnósticos:', e);
        } finally {
            setLoading(false);
        }
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : ['#F59E0B', '#D97706']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>DIAGNÓSTICOS DE CAMPO</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Ocorrências e Laudos Agronômicos</Text>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#F59E0B" /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.uuid}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Card style={[styles.itemCard, { padding: 0, overflow: 'hidden' }]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.dateText, { color: textMutedColor }]}>
                                    <Ionicons name="time-outline" size={12} /> {formatDate(item.criado_em)}
                                </Text>
                                {item.sync_status === 0 ? (
                                    <View style={styles.badgeOffline}>
                                        <Ionicons name="cloud-offline-outline" size={12} color="#D97706" />
                                        <Text style={styles.badgeTextOffline}>OFFLINE</Text>
                                    </View>
                                ) : (
                                    <View style={styles.badgeOnline}>
                                        <Ionicons name="cloud-done-outline" size={12} color="#10B981" />
                                        <Text style={styles.badgeTextOnline}>SINCRONIZADO</Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.cardBody}>
                                {item.imagem_capa ? (
                                    <Image source={{ uri: item.imagem_capa }} style={styles.thumbnail} />
                                ) : (
                                    <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                                        <Ionicons name="image-outline" size={24} color={textMutedColor} />
                                    </View>
                                )}
                                
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.obsText, { color: textColor }]} numberOfLines={2}>
                                        {item.observacao_usuario || 'Sem descrição inserida.'}
                                    </Text>
                                    
                                    <View style={styles.metaRow}>
                                        {item.nivel_confianca === 'TECNICO' ? (
                                            <View style={styles.badgeTrust}>
                                                <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                                                <Text style={styles.badgeTrustTxt}>LAUDO TÉCNICO</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.badgeTrust, { backgroundColor: '#F59E0B20' }]}>
                                                <Ionicons name="alert-circle" size={10} color="#F59E0B" />
                                                <Text style={[styles.badgeTrustTxt, { color: '#F59E0B' }]}>EM ANÁLISE</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="clipboard-search-outline" size={60} color={textMutedColor} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyTxt, { color: textMutedColor }]}>Nenhum diagnóstico registrado ainda.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: '#F59E0B' }]} 
                onPress={() => navigation.navigate('DiagnosticoForm')}
            >
                <Ionicons name="camera" size={28} color="#FFF" />
            </TouchableOpacity>
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
    list: { padding: 20, paddingBottom: 100 },
    itemCard: { marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    dateText: { fontSize: 11, fontWeight: '600' },
    badgeOffline: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    badgeTextOffline: { fontSize: 9, fontWeight: 'bold', color: '#D97706' },
    badgeOnline: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    badgeTextOnline: { fontSize: 9, fontWeight: 'bold', color: '#10B981' },
    cardBody: { flexDirection: 'row', padding: 12, alignItems: 'center' },
    thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    thumbnailPlaceholder: { width: 60, height: 60, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, justifyContent: 'center' },
    obsText: { fontSize: 13, fontWeight: '500', marginBottom: 8, lineHeight: 18 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    badgeTrust: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    badgeTrustTxt: { fontSize: 9, fontWeight: 'bold', color: '#10B981' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
    emptyTxt: { marginTop: 15, fontWeight: '700', fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
});
