import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CadastroScreen({ navigation }) {
    const handleNavigate = (tipo, title) => {
        navigation.navigate('CadastroForm', { tipo, title });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Cadastros</Text>
                <Text style={styles.subtitle}>Selecione o que deseja registrar</Text>
            </View>

            <View style={styles.grid}>
                <TouchableOpacity style={styles.card} onPress={() => handleNavigate('PRODUTO', 'Novo Produto')}>
                    <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="cart-outline" size={32} color="#2563EB" />
                    </View>
                    <Text style={styles.cardTitle}>+ Produto</Text>
                    <Text style={styles.cardDesc}>Itens de venda ou estoque</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => handleNavigate('INSUMO', 'Novo Insumo')}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="flask-outline" size={32} color="#DC2626" />
                    </View>
                    <Text style={styles.cardTitle}>+ Insumo</Text>
                    <Text style={styles.cardDesc}>Sementes, defensivos, embalagens</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => handleNavigate('CULTURA', 'Nova Cultura')}>
                    <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                        <Ionicons name="leaf-outline" size={32} color="#059669" />
                    </View>
                    <Text style={styles.cardTitle}>+ Cultura</Text>
                    <Text style={styles.cardDesc}>Variedades / Tipos de plantio</Text>
                </TouchableOpacity>

                {/* Fornecedor direciona pro cadastro de Clientes que serve pra ambos */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClienteForm', { isFornecedor: true })}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="business-outline" size={32} color="#D97706" />
                    </View>
                    <Text style={styles.cardTitle}>+ Fornecedor</Text>
                    <Text style={styles.cardDesc}>Empresas e prestadores</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 20, paddingBottom: 50 },
    header: { marginBottom: 30, marginTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 5, textAlign: 'center' },
    cardDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center' }
});
