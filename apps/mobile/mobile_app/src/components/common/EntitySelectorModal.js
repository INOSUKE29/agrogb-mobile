import React, { useState, useEffect } from 'react';
import { StyleSheet,  View, Text, Modal, TouchableOpacity, 
    TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, 
    Platform  } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';
import Button from './Button';
import QuickAddModal from './QuickAddModal';

export default function EntitySelectorModal({
    visible, onClose, onSelect, service,
    title = 'SELECIONAR', placeholder = 'Digite para pesquisar...',
    filterType = null, createRoute = null, createParams = {}
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [globalResults, setGlobalResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState('local'); // 'local' | 'global'
    const [importing, setImporting] = useState(null);
    const [quickAddVisible, setQuickAddVisible] = useState(false);
    const [quickAddLoading, setQuickAddLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            handleSearch('');
            setSearchMode('local');
        }
    }, [visible]);

    const handleSearch = async (text) => {
        setSearchQuery(text);
        if (!service) return;
        setLoading(true);
        try {
            // Assume service.searchLocal e service.searchGlobal existem
            // Se service não for atualizado ainda, cai para o search normal
            const searchFn = service.searchLocal || service.search;
            const list = await searchFn(text, filterType);
            setResults(list || []);
            setSearchMode('local');
            setGlobalResults([]);
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalSearch = async () => {
        if (!service || !service.searchGlobal) return;
        setLoading(true);
        try {
            const list = await service.searchGlobal(searchQuery, filterType);
            setGlobalResults(list || []);
            setSearchMode('global');
        } catch (e) {
            console.error('Global search error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (item) => {
        if (!service || !service.importEntity) return;
        setImporting(item.uuid || item.id);
        try {
            const importedItem = await service.importEntity(item);
            onSelect(importedItem || item);
            onClose();
        } catch (e) {
            console.error('Error importing:', e);
        } finally {
            setImporting(null);
        }
    };

    const handleSelectItem = (item) => {
        onSelect(item);
        onClose();
    };

    
    const handleQuickAddSave = async (name, category) => {
        if (!service || !service.quickAdd) {
            // Fallback to old behavior if no quickAdd is defined
            handleCreateNew();
            return;
        }
        setQuickAddLoading(true);
        try {
            const newItem = await service.quickAdd(name, category || filterType);
            onSelect(newItem);
            setQuickAddVisible(false);
            onClose();
        } catch (e) {
            console.error('Erro no quick add:', e);
            alert('Não foi possível realizar o cadastro rápido.');
        } finally {
            setQuickAddLoading(false);
        }
    };

    const handleCreateNew = () => {
        if (createRoute && service && service.navigation) {
            onClose();
            service.navigation.navigate(createRoute, { 
                ...createParams,
                initialSearch: searchQuery, 
                returnToScreen: service.route.name 
            });
        }
    };

    const renderItemRow = ({ item }) => {
        const name = item.nome || item.name || item.produto || item.item || 'NÃO IDENTIFICADO';
        const sub = item.telefone || item.contato || item.area_ha ? `${item.area_ha} ha` : item.tipo || item.cargo || '';
        
        return (
            <TouchableOpacity 
                style={styles.itemRow} 
                onPress={() => searchMode === 'global' ? handleImport(item) : handleSelectItem(item)}
            >
                <View style={[styles.avatarBox, { backgroundColor: colors.bgCard }]}>
                    <Ionicons name={searchMode === 'global' ? "cloud-download-outline" : "bookmark-outline"} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemText}>{name.toUpperCase()}</Text>
                    {!!sub && <Text style={styles.itemSubText}>{sub.toUpperCase()}</Text>}
                </View>
                {searchMode === 'global' && (
                    <View style={styles.importBtn}>
                        {importing === (item.uuid || item.id) ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.importText}>IMPORTAR</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <View style={styles.sheet}>
                    <View style={styles.indicator} />
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>{title.toUpperCase()}</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchWrapper}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: '#1C1C1E' }]}
                                placeholder={placeholder}
                                placeholderTextColor="#8E8E93"
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        
                        <TouchableOpacity style={styles.quickAddSwitch} onPress={() => setQuickAddVisible(true)}>
                            <Ionicons name="add" size={18} color="#FFF" />
                            <Text style={[styles.quickAddText, {color: '#FFF'}]}>NOVO CADASTRO</Text>
                        </TouchableOpacity>
    
                    </View>

                    {loading && !importing ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={searchMode === 'global' ? globalResults : results}
                            renderItem={renderItemRow}
                            keyExtractor={(item, idx) => item.uuid || item.id || String(idx)}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons 
                                        name={searchMode === 'global' ? "cloud-off-outline" : "folder-search-outline"} 
                                        size={48} 
                                        color={colors.border} 
                                    />
                                    <Text style={styles.emptyStateTitle}>
                                        {searchMode === 'global' ? 'Não encontrado na Nuvem' : 'Não encontrado localmente'}
                                    </Text>
                                    <Text style={styles.emptyStateSub}>
                                        {searchMode === 'global' 
                                            ? 'Este item não existe na biblioteca global. Você precisará realizar um cadastro completo.' 
                                            : 'Se o item não apareceu na biblioteca local da sua fazenda, busque na Biblioteca Global ou cadastre um novo.'}
                                    </Text>
                                    
                                    {searchMode === 'local' ? (
                                        <Button 
                                            title="BUSCAR NA BIBLIOTECA GLOBAL" 
                                            icon={<Ionicons name="cloud-search" size={16} color="#FFF" />}
                                            onPress={handleGlobalSearch} 
                                            style={{ marginTop: 20, width: '100%' }}
                                        />
                                    ) : (
                                        <Button 
                                            title="CRIAR NOVO CADASTRO" 
                                            icon={<Ionicons name="add" size={16} color="#FFF" />}
                                            onPress={handleCreateNew} 
                                            style={{ marginTop: 20, width: '100%' }}
                                        />
                                    )}
                                </View>
                            }
                        />
                    )}
                </View>
            
                <QuickAddModal
                    visible={quickAddVisible}
                    onClose={() => setQuickAddVisible(false)}
                    onSave={handleQuickAddSave}
                    loading={quickAddLoading}
                    hideCategory={!(service && service.name === 'ProductLibraryService')}
                />
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { 
        backgroundColor: colors.bg,
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        paddingHorizontal: 20, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 25, 
        maxHeight: '85%', 
        minHeight: '60%',
    },
    indicator: { width: 45, height: 5, borderRadius: 10, alignSelf: 'center', marginTop: 12, marginBottom: 15, backgroundColor: colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 13, fontWeight: '900', letterSpacing: 1, color: colors.text },
    closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCard },
    
    searchWrapper: { flexDirection: 'row', gap: 10, marginBottom: 18, alignItems: 'center' },
    searchBox: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', height: 52, 
        borderRadius: 16, borderWidth: 1, paddingHorizontal: 15,
        backgroundColor: '#FFFFFF', borderColor: '#D1D1D6'
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
    
    quickAddSwitch: { 
        flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, 
        paddingHorizontal: 15, borderRadius: 16, borderWidth: 1,
        backgroundColor: colors.primary, borderColor: colors.primaryDark
    },
    quickAddText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, color: colors.text },

    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    listContainer: { paddingBottom: 50 },
    
    itemRow: { 
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, 
        borderBottomWidth: 1, borderBottomColor: colors.border
    },
    avatarBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemText: { fontSize: 13, fontWeight: '800', color: colors.text },
    itemSubText: { fontSize: 10, color: colors.textMuted, fontWeight: 'bold', marginTop: 3 },
    
    importBtn: {
        backgroundColor: colors.bgInput,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1, borderColor: colors.primary
    },
    importText: { fontSize: 10, fontWeight: 'bold', color: colors.primary },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
    emptyStateTitle: { fontSize: 16, fontWeight: '800', marginTop: 15, marginBottom: 8, color: colors.text },
    emptyStateSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
