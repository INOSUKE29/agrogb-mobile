import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Image, Share } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AgroButton from '../ui/components/AgroButton';
import { ProductionService } from '../modules/production/services/ProductionService';
import { executeQuery } from '../database/database';

export default function AdubacaoDetailScreen({ route, navigation }) {
    const { colors, isDark } = useTheme();
    const { plano } = route.params;
    const [currentPlano, setCurrentPlano] = useState(plano);
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(false);

    const isApplied = currentPlano.status === 'APLICADO' || currentPlano.status === 'CONCLUIDO';

    const loadItens = React.useCallback(async () => {
        try {
            const res = await executeQuery(`SELECT * FROM production_fertilization_items WHERE plano_uuid = ?`, [currentPlano.uuid]);
            setItens(res.rows._array || []);
        } catch (_) { /* Error handled silently or via UI fallback */ }
    }, [currentPlano.uuid]);

    React.useEffect(() => { loadItens(); }, [loadItens]);

    const handleApply = async () => {
        Alert.alert(
            'Confirmar Aplicação Inteligente',
            'Deseja aplicar esta receita agora? Isso dará BAIXA AUTOMÁTICA de todos os insumos no seu estoque.',
            [
                { text: 'Agora não', style: 'cancel' },
                {
                    text: 'Confirmar Aplicação',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await ProductionService.applyFertilization(currentPlano.uuid);
                            setCurrentPlano({ ...currentPlano, status: 'CONCLUIDO', data_aplicacao: new Date().toISOString() });
                            Alert.alert('Sucesso', '✅ Adubação realizada e estoque atualizado!');
                        } catch (_) {
                            Alert.alert('Erro', 'Falha ao aplicar adubação.');
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

            await Share.share({
                message: message,
            });
        } catch (_) {
            alert('Falha ao compartilhar registro.');
        }
    };

    return (
        <View style={styles.container}>
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
                            color={colors.primary}
                        />
                    </View>
                    <View>
                        <Text style={styles.title}>{currentPlano.nome_plano}</Text>
                        <Text style={styles.subtitle}>{currentPlano.cultura} • {currentPlano.area_local || 'Sem local definido'}</Text>
                    </View>
                </View>

                {/* INSUMOS ESTRUTURADOS (DIAMOND PRO) */}
                {itens.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INSUMOS DA RECEITA</Text>
                        <View style={[styles.itemsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {itens.map(item => (
                                <View key={item.id} style={styles.itemRow}>
                                    <View style={[styles.itemDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.produto_id}</Text>
                                    <Text style={[styles.itemValue, { color: colors.primary }]}>{item.quantidade} {item.unidade}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* RECEITA TEXTUAL (LEGACY/OBS) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ORIENTAÇÃO ADICIONAL</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.description, { color: colors.textPrimary }]}>{currentPlano.descricao_tecnica || 'Nenhuma observação adicional.'}</Text>
                    </View>
                </View>

                {/* ANEXOS */}
                {currentPlano.anexos_uri && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ANEXO / FOTO</Text>
                        <Image
                            source={{ uri: currentPlano.anexos_uri }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                {!isApplied ? (
                    <AgroButton
                        title="MARCAR COMO APLICADO"
                        onPress={handleApply}
                        loading={loading}
                    />
                ) : (
                    <AgroButton
                        title="COMPARTILHAR REGISTRO"
                        variant="secondary"
                        onPress={handleShare}
                    />
                )}

                <AgroButton
                    title="EDITAR"
                    variant="secondary"
                    style={{ marginTop: 0 }}
                    disabled={isApplied} // Desabilita edição se já aplicado (regra de segurança)
                    onPress={() => navigation.navigate('AdubacaoForm', { plano: currentPlano })}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 100 },
    statusBar: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bgPlanned: { backgroundColor: '#F59E0B' },
    bgApplied: { backgroundColor: '#10B981' },
    statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    header: { padding: 25, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
    iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    subtitle: { fontSize: 14 },
    section: { padding: 20 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
    card: { padding: 20, borderRadius: 16, borderWidth: 1, minHeight: 80 },
    itemsCard: { padding: 15, borderRadius: 16, borderWidth: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    itemDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
    itemName: { flex: 1, fontSize: 14, fontWeight: 'bold' },
    itemValue: { fontSize: 14, fontWeight: '900' },
    description: { fontSize: 15, lineHeight: 22 },
    image: { width: '100%', height: 300, borderRadius: 16, borderWidth: 1 },
    footer: { padding: 20, borderTopWidth: 1 }
});
