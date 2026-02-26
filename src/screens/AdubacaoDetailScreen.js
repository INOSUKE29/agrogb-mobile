import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert, Share, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../styles/theme'; // COLORS importado corretamente
import { AppButton } from '../ui/components/AppButton';
import { updatePlanoAdubacao } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

export default function AdubacaoDetailScreen({ route, navigation }) {
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
                        await updatePlanoAdubacao(currentPlano.uuid, updated);
                        setCurrentPlano(updated);
                        setLoading(false);
                        Alert.alert('Sucesso', 'Plano marcado como APLICADO!');
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
            alert(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* STATUS BAR */}
                <View style={[styles.statusBar, isApplied ? styles.bgApplied : styles.bgPlanned]}>
                    <Ionicons name={isApplied ? "checkmark-circle" : "time"} size={20} color="#FFF" />
                    <Text style={styles.statusText}>
                        {isApplied
                            ? `APLICADO EM ${new Date(currentPlano.data_aplicacao).toLocaleDateString()}`
                            : 'PLANEJADO - AGUARDANDO APLICAÇÃO'}
                    </Text>
                </View>

                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <FontAwesome5
                            name={currentPlano.tipo_aplicacao === 'GOTEJO' ? 'faucet' : 'spray-can'}
                            size={24}
                            color={COLORS.primaryLight}
                        />
                    </View>
                    <View>
                        <Text style={styles.title}>{currentPlano.nome_plano}</Text>
                        <Text style={styles.subtitle}>{currentPlano.cultura} • {currentPlano.area_local || 'Sem local definido'}</Text>
                    </View>
                </View>

                {/* RECEITA */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ORIENTAÇÃO TÉCNICA</Text>
                    <View style={styles.card}>
                        <Text style={styles.description}>{currentPlano.descricao_tecnica}</Text>
                    </View>
                </View>

                {/* ANEXOS */}
                {currentPlano.anexos_uri && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ANEXO / LAUDO</Text>

                        {currentPlano.anexos_uri.toLowerCase().endsWith('.pdf') ? (
                            <TouchableOpacity
                                style={[styles.card, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface }]}
                                onPress={async () => {
                                    try {
                                        if (await Sharing.isAvailableAsync()) {
                                            await Sharing.shareAsync(currentPlano.anexos_uri);
                                        } else {
                                            Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
                                        }
                                    } catch (e) { Alert.alert('Erro', 'Falha ao abrir PDF: ' + e.message); }
                                }}
                            >
                                <FontAwesome5 name="file-pdf" size={48} color={COLORS.destructive} />
                                <Text style={{ marginTop: 15, fontWeight: 'bold', color: COLORS.white }}>VISUALIZAR ARQUIVO PDF</Text>
                                <Text style={{ fontSize: 12, color: COLORS.gray500, marginTop: 5 }}>Toque para abrir</Text>
                            </TouchableOpacity>
                        ) : (
                            <Image
                                source={{ uri: currentPlano.anexos_uri }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        )}
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                {!isApplied ? (
                    <AppButton
                        title="MARCAR COMO APLICADO"
                        onPress={handleApply}
                        loading={loading}
                    />
                ) : (
                    <AppButton
                        title="COMPARTILHAR REGISTRO"
                        variant="ghost"
                        onPress={handleShare}
                    />
                )}

                <AppButton
                    title="EDITAR"
                    variant="ghost"
                    style={{ marginTop: 10, borderColor: COLORS.glassBorder, borderWidth: 1 }}
                    disabled={isApplied}
                    onPress={() => navigation.navigate('AdubacaoForm', { plano: currentPlano })}
                />
            </View>
        </View>
    );
}

// CORREÇÃO: StyleSheet.create() agora usa COLORS (importado) em vez de theme.COLORS (nunca declarado)
// Isso eliminava o ReferenceError: Property 'theme' doesn't exist no startup do Hermes.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },
    content: { paddingBottom: 100 },

    statusBar: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bgPlanned: { backgroundColor: '#F59E0B' },
    bgApplied: { backgroundColor: COLORS.primary },
    statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

    header: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
    iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    subtitle: { fontSize: 14, color: COLORS.gray500 },

    section: { padding: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 10, letterSpacing: 1 },

    card: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, minHeight: 100 },
    description: { fontSize: 16, color: COLORS.white, lineHeight: 24 },

    image: { width: '100%', height: 300, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder },

    footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.glassBorder }
});
