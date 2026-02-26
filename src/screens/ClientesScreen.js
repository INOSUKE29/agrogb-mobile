import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar as RNStatusBar, Linking } from 'react-native';
import { getClientes } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../ui/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClientesScreen({ navigation }) {
    const [originalItems, setOriginalItems] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            // Parse TYPE and EXTENDED from observacao if matches format
            const parsed = data.map(d => {
                let t = 'CLIENTE';
                let isAtivo = true;

                if (d.observacao) {
                    try {
                        if (d.observacao.startsWith('{')) {
                            const ext = JSON.parse(d.observacao);
                            t = ext.tipo || 'CLIENTE';
                            if (ext.ativo !== undefined) isAtivo = ext.ativo;
                        } else if (d.observacao.includes('[TIPO:')) {
                            const match = d.observacao.match(/\[TIPO:(.*?)\]/);
                            if (match) t = match[1];
                        }
                    } catch (e) { }
                }

                // Fallback checks
                if (t === 'CLIENTE' && d.observacao && d.observacao.includes('FORNECEDOR')) t = 'FORNECEDOR';
                if (t === 'CLIENTE' && d.observacao && d.observacao.includes('PARCEIRO')) t = 'PARCEIRO';

                return { ...d, tipo: t, ativo: isAtivo };
            });
            setOriginalItems(parsed);
            setItems(parsed);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSearch = (text) => {
        setSearchText(text);
        if (!text.trim()) {
            setItems(originalItems);
        } else {
            const lower = text.toLowerCase();
            const filtered = originalItems.filter(i =>
                i.nome.toLowerCase().includes(lower) ||
                (i.telefone && i.telefone.includes(lower)) ||
                (i.endereco && i.endereco.toLowerCase().includes(lower))
            );
            setItems(filtered);
        }
    };

    const handleEdit = (item) => {
        navigation.navigate('ClienteForm', { cliente: item });
    };

    const handleNew = () => {
        navigation.navigate('ClienteForm'); // No params = New
    };

    // --- RENDER HELPERS ---
    const getBadgeColor = (t) => {
        if (t === 'PARCEIRO') return '#3B82F6'; // Blue
        if (t === 'FORNECEDOR') return '#F59E0B'; // Amber
        return '#10B981'; // Green (Default Cliente)
    };

    const handleCall = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    };

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, '')}`);
    };

    return (
        <View style={styles.container}>
            <RNStatusBar backgroundColor={Colors.primary} barStyle="light-content" />
            <LinearGradient colors={['#E6F4EA', '#FFFFFF']} style={StyleSheet.absoluteFill} />

            {/* HEADER */}
            <LinearGradient colors={[Colors.primary, '#047857']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GERENCIAR PESSOAS</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            {/* SEARCH AREA */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar Nome, Telefone..."
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={handleSearch}
                    />
                </View>
                <Text style={styles.sectionTitle}>LISTA DE CADASTROS</Text>
            </View>

            {/* LIST */}
            {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => handleEdit(item)}>
                            {/* Avatar */}
                            <View style={[styles.avatar, { backgroundColor: getBadgeColor(item.tipo) + '20' }]}>
                                <Text style={[styles.avatarText, { color: getBadgeColor(item.tipo) }]}>
                                    {item.nome.charAt(0)}
                                </Text>
                            </View>

                            {/* Info */}
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardName, !item.ativo && styles.cardNameInactive]} numberOfLines={1}>
                                    {item.nome} {!item.ativo ? '(INATIVO)' : ''}
                                </Text>
                                <View style={styles.row}>
                                    <Ionicons name="call-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                    <Text style={styles.cardPhone}>{item.telefone || 'Sem telefone'}</Text>
                                </View>
                                {item.endereco ? <Text style={styles.cardLoc} numberOfLines={1}>{item.endereco}</Text> : null}
                            </View>

                            {/* Actions / Badge */}
                            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 10 }}>
                                <View style={[styles.badge, { backgroundColor: getBadgeColor(item.tipo) }]}>
                                    <Text style={styles.badgeText}>{item.tipo && item.tipo !== 'CLIENTE' ? item.tipo : 'CLI'}</Text>
                                </View>

                                {!!item.telefone && (
                                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                                        <TouchableOpacity onPress={() => handleCall(item.telefone)} style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}>
                                            <Ionicons name="call" size={14} color="#0284C7" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleWhatsApp(item.telefone)} style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}>
                                            <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum registro encontrado.</Text>}
                />
            }

            {/* FAB */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleNew}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { backgroundColor: Colors.primary, paddingVertical: 20, paddingHorizontal: 20, paddingTop: 50 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

    searchContainer: { padding: 20, paddingBottom: 10 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, elevation: 2 },
    searchInput: { flex: 1, fontSize: 15, color: '#1F2937' },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#6B7280', marginTop: 25, letterSpacing: 1 },

    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    cardBody: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    cardNameInactive: { color: '#9CA3AF', textDecorationLine: 'line-through' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    cardPhone: { fontSize: 13, color: '#6B7280' },
    cardLoc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },

    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
