import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AgronomistEstoqueScreen({ route, navigation }) {
    const { clientId, clientName } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [estoque, setEstoque] = useState([]);

    useEffect(() => {
        // Simulando busca do estoque via Nuvem (Supabase)
        const fetchRemoteStock = async () => {
            setLoading(true);
            setTimeout(() => {
                setEstoque([
                    { id: 1, nome: 'Calcário Dolomítico', quantidade: 2500, unidade: 'kg', tipo: 'Fertilizante' },
                    { id: 2, nome: 'NPK 10-10-10', quantidade: 500, unidade: 'kg', tipo: 'Fertilizante' },
                    { id: 3, nome: 'Glifosato 480', quantidade: 120, unidade: 'L', tipo: 'Defensivo' },
                    { id: 4, nome: 'Sementes de Milho', quantidade: 50, unidade: 'kg', tipo: 'Semente' }
                ]);
                setLoading(false);
            }, 1000);
        };
        fetchRemoteStock();
    }, [clientId]);

    const getIconByTipo = (tipo) => {
        switch (tipo) {
            case 'Fertilizante': return <MaterialCommunityIcons name="flask" size={24} color="#8B5CF6" />;
            case 'Defensivo': return <MaterialCommunityIcons name="shield-bug" size={24} color="#EF4444" />;
            case 'Semente': return <Ionicons name="leaf" size={24} color="#10B981" />;
            default: return <Ionicons name="cube" size={24} color="#64748B" />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.headerTitle}>Estoque Disponível</Text>
                    <Text style={styles.headerSub}>{clientName || 'Cliente Selecionado'}</Text>
                </View>
                <View style={styles.readOnlyBadge}>
                    <Ionicons name="eye" size={14} color="#10B981" />
                    <Text style={styles.readOnlyText}>LEITURA</Text>
                </View>
            </View>

            {/* LISTA */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Sincronizando com a nuvem...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={styles.infoText}>
                            Você está visualizando o estoque atual do produtor. Apenas ele pode adicionar ou remover itens operacionais.
                        </Text>
                    </View>

                    {estoque.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardIconBox}>
                                {getIconByTipo(item.tipo)}
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.itemName}>{item.nome}</Text>
                                <Text style={styles.itemTipo}>{item.tipo}</Text>
                            </View>
                            <View style={styles.cardAction}>
                                <Text style={styles.itemQtd}>{item.quantidade}</Text>
                                <Text style={styles.itemUnd}>{item.unidade}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
    readOnlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    readOnlyText: { color: '#10B981', fontSize: 10, fontWeight: '900', marginLeft: 4, letterSpacing: 0.5 },
    content: { padding: 20, paddingBottom: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#94A3B8', marginTop: 10, fontSize: 14 },
    infoBox: { flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
    infoText: { color: '#BFDBFE', fontSize: 13, lineHeight: 18, marginLeft: 10, flex: 1 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    cardIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardBody: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
    itemTipo: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    cardAction: { alignItems: 'flex-end', justifyContent: 'center' },
    itemQtd: { fontSize: 20, fontWeight: '900', color: '#10B981' },
    itemUnd: { fontSize: 12, color: '#94A3B8', fontWeight: '700' }
});
