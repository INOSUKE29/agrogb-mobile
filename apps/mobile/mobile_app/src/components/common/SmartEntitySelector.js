import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { BlurView } from 'expo-blur';

export default function SmartEntitySelector({
    label,
    value, // id, uuid, string ou objeto ({ uuid: '123', nome: 'xyz' })
    onSelect, // (item) => void
    fetchItems, // async (searchQuery) => []
    onAddNew, // () => void (Callback para abrir a tela de cadastro completo)
    title = 'SELECIONAR',
    placeholder = 'Toque para selecionar...',
    icon = 'search-outline',
    style = {},
}) {
    const { theme } = useTheme();
    const isDark = theme?.dark || false;
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial fetch when opened
    useEffect(() => {
        if (modalVisible) {
            handleSearch('');
        }
    }, [modalVisible]);

    const handleSearch = async (text) => {
        setSearchQuery(text);
        if (!fetchItems) return;
        setLoading(true);
        try {
            const list = await fetchItems(text);
            setResults(list || []);
        } catch (e) {
            console.error('Erro na busca do selector:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        onSelect(item);
        setModalVisible(false);
    };

    // Format display name
    const getDisplayName = () => {
        if (!value) return '';
        if (typeof value === 'string') return value.toUpperCase();
        return (value.nome || value.name || value.descricao || value.produto || 'SELECIONADO').toUpperCase();
    };

    const displayName = getDisplayName();
    const isSelected = !!displayName;

    return (
        <View style={[styles.container, style]}>
            {!!label && <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>{label.toUpperCase()}</Text>}
            
            <View style={[
                styles.inputWrapper, 
                { 
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F3F4F6', 
                    borderColor: isSelected 
                        ? (theme?.colors?.primary || '#10B981') 
                        : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB')
                }
            ]}>
                <TouchableOpacity 
                    style={styles.tapArea} 
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons 
                        name={icon} 
                        size={18} 
                        color={isSelected ? (theme?.colors?.primary || '#10B981') : '#9CA3AF'} 
                        style={styles.icon} 
                    />
                    <Text 
                        numberOfLines={1} 
                        style={[
                            styles.displayText, 
                            { 
                                color: isSelected 
                                    ? (isDark ? '#FFF' : '#1F2937') 
                                    : (isDark ? '#4B5563' : '#9CA3AF'),
                                fontWeight: isSelected ? '800' : '500'
                            }
                        ]}
                    >
                        {isSelected ? displayName : placeholder}
                    </Text>
                </TouchableOpacity>

                {isSelected && (
                    <TouchableOpacity onPress={() => onSelect(null)} style={styles.clearBtn}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* MODAL */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
                    
                    <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={[styles.sheet, { backgroundColor: isDark ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                        <View style={styles.header}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#1F2937' }]}>{title}</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#4B5563'} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#F3F4F6' }]}>
                            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.searchInput, { color: isDark ? '#FFF' : '#1F2937' }]}
                                placeholder="Pesquisar..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={handleSearch}
                            />
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(item, index) => item.id ? item.id.toString() : item.uuid || index.toString()}
                                style={{ marginTop: 10 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[styles.itemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} 
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
                                        <Text style={[styles.itemText, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                            {(item.nome || item.name || item.descricao || item.produto || 'Item').toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 30 }}>
                                        Nenhum resultado encontrado.
                                    </Text>
                                }
                            />
                        )}

                        {!!onAddNew && (
                            <TouchableOpacity 
                                style={styles.addNewBtn}
                                onPress={() => {
                                    setModalVisible(false);
                                    setTimeout(() => onAddNew(), 300); // Dar tempo para fechar o modal
                                }}
                            >
                                <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.addNewText}>CADASTRAR NOVO</Text>
                            </TouchableOpacity>
                        )}
                    </BlurView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
    inputWrapper: { height: 52, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    tapArea: { flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%' },
    icon: { marginRight: 12 },
    displayText: { fontSize: 13, flex: 1 },
    clearBtn: { padding: 5 },
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, minHeight: '60%', maxHeight: '80%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 14, fontWeight: '900' },
    closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
    searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16, paddingHorizontal: 15 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    itemText: { fontSize: 13, fontWeight: '800' },
    addNewBtn: { flexDirection: 'row', backgroundColor: '#10B981', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    addNewText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});
