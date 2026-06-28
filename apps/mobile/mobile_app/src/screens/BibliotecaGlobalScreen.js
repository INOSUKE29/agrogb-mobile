import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

export default function BibliotecaGlobalScreen({ navigation }) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const THEME = {
        bg: theme?.colors?.bg ?? '#0B121E',
        card: theme?.colors?.card ?? '#152235',
        text: theme?.colors?.text ?? '#F3F4F6',
        textSub: theme?.colors?.textMuted ?? '#9CA3AF',
        primary: theme?.colors?.primary ?? '#10B981',
        border: theme?.colors?.border ?? 'rgba(255,255,255,0.05)',
        warning: theme?.colors?.warning ?? '#F59E0B'
    };

    const loadItems = async () => {
        try {
            setLoading(true);
            const query = `
                SELECT * FROM cadastro 
                WHERE is_deleted = 0 OR is_deleted IS NULL
                ORDER BY nome ASC
            `;
            const result = await executeQuery(query);
            const list = [];
            for (let i = 0; i < result.rows.length; i++) {
                list.push(result.rows.item(i));
            }
            setItems(list);
        } catch (error) {
            console.error('Erro ao carregar biblioteca:', error);
            Alert.alert('Erro', 'Não foi possível carregar a biblioteca global.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    const filteredItems = items.filter(i => 
        i.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.fabricante?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.tipo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const isPending = item.status_curadoria === 'PENDENTE';
        
        const getIcon = () => {
            switch(item.tipo?.toLowerCase()) {
                case 'defensivo': return 'shield-checkmark';
                case 'fertilizante': return 'flask';
                case 'semente': return 'leaf';
                default: return 'cube';
            }
        };

        return (
            <View style={[styles.card, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name={getIcon()} size={20} color={THEME.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.title, { color: THEME.text }]}>{item.nome}</Text>
                            <Text style={[styles.subtitle, { color: THEME.textSub }]}>{item.tipo || 'Geral'} • {item.fabricante || 'Fabricante N/I'}</Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.cardFooter}>
                    <View style={styles.statusBadge}>
                        <Ionicons 
                            name={isPending ? "time" : "checkmark-circle"} 
                            size={14} 
                            color={isPending ? THEME.warning : THEME.primary} 
                        />
                        <Text style={[styles.statusText, { color: isPending ? THEME.warning : THEME.primary }]}>
                            {isPending ? 'Em Validação' : 'Aprovado Global'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: THEME.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={THEME.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: THEME.text }]}>Biblioteca Global</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                    <Ionicons name="search" size={20} color={THEME.textSub} />
                    <TextInput
                        style={[styles.searchInput, { color: THEME.text }]}
                        placeholder="Buscar por nome, fabricante ou tipo..."
                        placeholderTextColor={THEME.textSub}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={THEME.textSub} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={THEME.primary} />
                        <Text style={[styles.centerText, { color: THEME.textSub, marginTop: 12 }]}>Carregando catálogo...</Text>
                    </View>
                ) : filteredItems.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="library-outline" size={60} color={THEME.textSub} style={{ opacity: 0.5 }} />
                        <Text style={[styles.centerText, { color: THEME.text, fontSize: 16, marginTop: 15 }]}>Nenhum item encontrado.</Text>
                        <Text style={[styles.centerText, { color: THEME.textSub, marginTop: 8 }]}>Você pode adicionar novos produtos locais que serão validados pelo administrador.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={item => item.uuid}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: THEME.primary }]}
                onPress={() => navigation.navigate('BibliotecaForm')}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    searchContainer: { paddingHorizontal: 20, paddingBottom: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 45, borderRadius: 10, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
    content: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    centerText: { textAlign: 'center' },
    card: { borderWidth: 1, borderRadius: 12, marginBottom: 15, padding: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    subtitle: { fontSize: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    fab: { position: 'absolute', bottom: 25, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 }
});
