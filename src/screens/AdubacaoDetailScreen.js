import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert, Share, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { updatePlanoAdubacao } from '../database/database';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';

export default function AdubacaoDetailScreen({ route, navigation }) {
    const { theme } = useTheme();
    const { plano } = route.params;
    const [currentPlano, setCurrentPlano] = useState(plano);
    const [loading, setLoading] = useState(false);

    const isApplied = currentPlano.status === 'APLICADO';

    const handleApply = async () => {
        Alert.alert(
            'Confirmar Aplicação',
            'Deseja marcar este plano como REALIZADO? Isso servirá como registro histórico.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setLoading(true);
                        const updated = {
                            ...currentPlano,
                            status: 'APLICADO',
                            data_aplicacao: new Date().toISOString()
                        };
                        try {
                            await updatePlanoAdubacao(currentPlano.uuid, updated);
                            setCurrentPlano(updated);
                            Alert.alert('Sucesso', 'Plano marcado como APLICADO!');
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao atualizar plano.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        try {
            const message = `*AGROGB - PLANO DE ADUBAÇÃO*\n\n` +
                `📅 ${new Date(currentPlano.data_criacao).toLocaleDateString()}\n` +
                `📝 ${currentPlano.nome_plano}\n` +
                `🌱 Cultura: ${currentPlano.cultura}\n` +
                `💧 Aplicação: ${currentPlano.tipo_aplicacao}\n` +
                `📍 Local: ${currentPlano.area_local || 'Geral'}\n\n` +
                `*RECEITA/ORIENTAÇÃO:*\n${currentPlano.descricao_tecnica}\n\n` +
                `Status: ${currentPlano.status}`;

            await Share.share({ message });
        } catch (error) {
            Alert.alert('Erro', error.message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient 
                colors={isApplied ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']} 
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>DETALHES DO PLANO</Text>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statusBadge}>
                    <Ionicons name={isApplied ? "checkmark-circle" : "time"} size={20} color="#FFF" />
                    <Text style={styles.statusText}>
                        {isApplied
                            ? `APLICADO EM ${new Date(currentPlano.data_aplicacao).toLocaleDateString()}`
                            : 'PLANEJADO - AGUARDANDO'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.mainInfoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: isApplied ? '#F0FDF4' : '#FFFBEB' }]}>
                            <FontAwesome5
                                name={currentPlano.tipo_aplicacao === 'GOTEJO' ? 'faucet' : 'spray-can'}
                                size={22}
                                color={isApplied ? '#10B981' : '#F59E0B'}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.title}>{currentPlano.nome_plano}</Text>
                            <Text style={styles.subtitle}>{currentPlano.cultura} • {currentPlano.area_local || 'Área Geral'}</Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ORIENTAÇÃO TÉCNICA / RECEITA</Text>
                    <Card style={styles.descriptionCard}>
                        <Text style={styles.descriptionText}>{currentPlano.descricao_tecnica}</Text>
                    </Card>
                </View>

                {currentPlano.anexos_uri && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ANEXO / COMPROVANTE</Text>
                        <Card noPadding style={styles.imageCard}>
                            <Image
                                source={{ uri: currentPlano.anexos_uri }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        </Card>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {!isApplied && (
                    <AgroButton
                        title="MARCAR COMO APLICADO"
                        onPress={handleApply}
                        loading={loading}
                        style={{ marginBottom: 12 }}
                    />
                )}
                
                <View style={styles.footerRow}>
                    <AgroButton
                        title="EDITAR"
                        variant="secondary"
                        disabled={isApplied}
                        onPress={() => navigation.navigate('AdubacaoForm', { plano: currentPlano })}
                        style={{ flex: 1 }}
                    />
                    {isApplied && (
                        <AgroButton
                            title="COMPARTILHAR"
                            variant="primary"
                            onPress={handleShare}
                            style={{ flex: 1, marginLeft: 10 }}
                        />
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignSelf: 'center' },
    statusText: { color: '#FFF', fontWeight: '900', fontSize: 11, marginLeft: 8 },
    scrollContent: { padding: 20, paddingBottom: 120 },
    mainInfoCard: { marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    section: { marginBottom: 25 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    descriptionCard: { padding: 20 },
    descriptionText: { fontSize: 15, color: '#374151', lineHeight: 24, fontWeight: '500' },
    imageCard: { overflow: 'hidden', height: 300 },
    image: { width: '100%', height: '100%' },
    footer: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, position: 'absolute', bottom: 0, width: '100%' },
    footerRow: { flexDirection: 'row' }
});
