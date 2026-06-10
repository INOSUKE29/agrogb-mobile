import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, StatusBar, SafeAreaView } from 'react-native';
import { getAlertasAtivos, resolverAlerta } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export default function PendenciasScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [alertas, setAlertas] = useState([]);

    useFocusEffect(useCallback(() => {
        loadAlertas();
    }, []));

    const loadAlertas = async () => {
        const data = await getAlertasAtivos();
        setAlertas(data);
    };

    const handleResolver = (alerta) => {
        Alert.alert('Resolver Pendência', 'Tem certeza que já resolveu esta pendência e deseja limpar este aviso?', [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Sim, Resolvido', 
                style: 'default', 
                onPress: async () => {
                    await resolverAlerta(alerta.uuid);
                    loadAlertas();
                } 
            }
        ]);
    };

    const isDark = true;
    const textColor = '#FFF';
    const textMutedColor = '#9CA3AF';
    const cardBg = '#1F2937';

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>PENDÊNCIAS DO SISTEMA</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Corrija gargalos de estoque e cadastros faltantes para manter a base redonda.</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {alertas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={60} color={activeColors.primary || '#10B981'} />
                        <Text style={styles.emptyTitle}>Tudo Limpo!</Text>
                        <Text style={styles.emptySub}>Nenhuma pendência encontrada. Seu sistema está rodando 100% liso.</Text>
                    </View>
                ) : (
                    alertas.map(alerta => {
                        const isEstoque = alerta.tipo === 'ESTOQUE_NEGATIVO';
                        const iconName = isEstoque ? 'cube-outline' : 'document-text-outline';
                        const colorTheme = isEstoque ? '#EF4444' : '#F59E0B'; // Red for negative stock, Yellow for missing catalog

                        return (
                            <LinearGradient colors={[cardBg, '#111827']} key={alerta.uuid} style={[styles.card, { borderLeftColor: colorTheme }]}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? `${colorTheme}15` : `${colorTheme}10` }]}>
                                        <Ionicons name={iconName} size={20} color={colorTheme} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.tipo, { color: colorTheme }]}>{isEstoque ? 'ESTOQUE NEGATIVO' : 'FICHA TÉCNICA FALTANTE'}</Text>
                                        <Text style={[styles.data, { color: textMutedColor }]}>{new Date(alerta.data_criacao).toLocaleString('pt-BR')}</Text>
                                    </View>
                                </View>
                                
                                <Text style={[styles.mensagem, { color: textColor }]}>{alerta.mensagem}</Text>

                                <TouchableOpacity 
                                    style={styles.resolveBtn}
                                    onPress={() => handleResolver(alerta)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark" size={16} color="#FFF" />
                                    <Text style={styles.resolveBtnText}>MARCAR COMO RESOLVIDO</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 'bold' },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: 15 },
    emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 5, paddingHorizontal: 20 },
    card: { marginBottom: 15, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderLeftWidth: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    tipo: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    data: { fontSize: 10, marginTop: 2 },
    mensagem: { fontSize: 14, fontWeight: '500', lineHeight: 22, marginBottom: 15 },
    resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 10, gap: 5 },
    resolveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 }
});
