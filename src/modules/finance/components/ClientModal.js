import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from '../../../components/modals/BaseModal';
import { getClientes } from '../../../database/database';

export default function ClientModal({ visible, onClose, onCreated }) {
    const navigation = useNavigation();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            loadClients();
        }
    }, [visible]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            // Deduplica (Apenas visualização)
            const uniqueData = [...new Map(data.map(item => [item.cpf_cnpj ? item.cpf_cnpj.trim() : item.nome.trim().toUpperCase(), item])).values()];
            setClients(uniqueData);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (cliente) => {
        if (onCreated) onCreated(cliente); // Reaproveitando onCreated como onSelected
        onClose();
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="SELECIONAR PARCEIRO">
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => {
                        onClose();
                        navigation.navigate('ClienteForm', { returnTo: 'Vendas' });
                    }}
                >
                    <Ionicons name="add-circle" size={20} color="#FFF" />
                    <Text style={styles.addBtnText}>CADASTRAR NOVO NO SISTEMA</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={clients}
                        keyExtractor={(item, index) => item.uuid || String(index)}
                        style={{ maxHeight: 300 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.itemCard}
                                onPress={() => handleSelect(item)}
                            >
                                <View style={styles.iconBox}>
                                    <Ionicons name="person" size={16} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{item.nome}</Text>
                                    {item.cidade ? <Text style={styles.itemSub}>{item.cidade}</Text> : null}
                                </View>
                                <TouchableOpacity 
                                    style={{ padding: 8, marginRight: 4 }}
                                    onPress={() => {
                                        onClose();
                                        navigation.navigate('ClienteForm', { cliente: item, returnTo: 'Vendas' });
                                    }}
                                >
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 6, borderRadius: 8 }}>
                                        <Ionicons name="pencil" size={14} color="#94A3B8" />
                                    </View>
                                </TouchableOpacity>
                                <Ionicons name="chevron-forward" size={16} color="#64748B" />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>Nenhum cliente ou parceiro cadastrado.</Text>
                                <Text style={styles.emptySub}>Vá até o Menu Cadastros para adicionar.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </BaseModal>
    );
}

const styles = StyleSheet.create({
    container: { paddingTop: 10 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 14,
        marginBottom: 15,
        gap: 8
    },
    addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F680',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    itemTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
    itemSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
    emptyBox: { padding: 20, alignItems: 'center' },
    emptyText: { color: '#FFF', fontWeight: 'bold' },
    emptySub: { color: '#94A3B8', fontSize: 12, marginTop: 5, textAlign: 'center' }
});
