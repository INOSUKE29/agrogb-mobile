import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RecommendationDetailScreen({ route, navigation }) {
    const { recommendation, clientName } = route.params || {};

    const isPending = recommendation?.status === 'PENDING';
    const isApproved = recommendation?.status === 'APPROVED';

    let products = [];
    let instructions = '';
    
    try {
        const parsed = JSON.parse(recommendation?.description || '{}');
        products = parsed.products || [];
        instructions = parsed.instructions || '';
    } catch (e) {
        instructions = recommendation?.description || '';
    }

    const getStatusText = () => {
        if (recommendation?.status === 'PENDING') return 'Pendente - Aguardando aprovação';
        if (recommendation?.status === 'APPROVED') return 'Aprovada';
        if (recommendation?.status === 'DRAFT') return 'Rascunho';
        return 'Rejeitada';
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhe da Recomendação</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <Text style={styles.recId}>Recomendação #{recommendation?.id?.substring(0,6).toUpperCase()}</Text>
                    <Text style={styles.farmName}>{clientName || 'Fazenda'}</Text>
                    <Text style={styles.cultureName}>{recommendation?.title}</Text>
                    
                    <View style={[styles.statusBox, isPending ? styles.statusPending : (isApproved ? styles.statusApproved : styles.statusDraft)]}>
                        <Text style={[styles.statusText, isPending ? styles.textPending : (isApproved ? styles.textApproved : styles.textDraft)]}>
                            {getStatusText()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Produtos</Text>
                {products.length > 0 ? (
                    products.map((p, index) => (
                        <View key={index} style={styles.productCard}>
                            <Text style={styles.productName}>{p.name}</Text>
                            <Text style={styles.productDosage}>{p.dosage}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{color: '#94A3B8'}}>Nenhum produto listado.</Text>
                )}

                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Instruções</Text>
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsText}>{instructions || 'Nenhuma instrução adicional.'}</Text>
                </View>

                <Text style={styles.dateText}>
                    Enviada em {new Date(recommendation?.created_at).toLocaleDateString('pt-BR')} às {new Date(recommendation?.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },

    content: { padding: 20 },
    headerCard: { backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#1F2937' },
    recId: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginBottom: 5 },
    farmName: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    cultureName: { color: '#64748B', fontSize: 13, marginBottom: 15 },
    
    statusBox: { padding: 12, borderRadius: 8, marginTop: 5 },
    statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
    textPending: { color: '#F59E0B', fontWeight: '800', fontSize: 13 },
    statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    textApproved: { color: '#10B981', fontWeight: '800', fontSize: 13 },
    statusDraft: { backgroundColor: '#1F2937' },
    textDraft: { color: '#94A3B8', fontWeight: '800', fontSize: 13 },

    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 15 },
    productCard: { backgroundColor: '#111827', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginBottom: 10 },
    productName: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    productDosage: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },

    instructionsCard: { backgroundColor: '#111827', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginBottom: 25 },
    instructionsText: { color: '#F8FAFC', fontSize: 14, lineHeight: 22 },

    dateText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 30 }
});
