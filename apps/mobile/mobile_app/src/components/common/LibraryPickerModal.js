// LibraryPickerModal.js - Frosted Glassmorphism Bottom Sheet for Smart Selection, Recents, Favorites, and Quick Adds
import React, { useState, useEffect } from 'react';
import { StyleSheet,  View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    TextInput, 
    FlatList, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView  } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { BlurView } from 'expo-blur';

export default function LibraryPickerModal({
    visible,
    onClose,
    onSelect,
    service,
    title = 'SELECIONAR',
    placeholder = 'Digite para pesquisar...',
    filterType = null,
    createRoute = null, // Nome da rota para cadastro completo, ex: 'ProdutoFormScreen'
    createParams = {}, // Parâmetros adicionais para a rota
}) {
    const { theme } = useTheme();
    const isDark = false; // Forçado para UX no Sol (Branco/Cinza claro)

    // Search and data state
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recents, setRecents] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);

    // Removidos os estados de QuickAdd (Auditoria v2.0 exige tela completa)

    useEffect(() => {
        if (visible) {
            loadRecentsAndFavorites();
            handleSearch('');
        }
    }, [visible]);

    const loadRecentsAndFavorites = async () => {
        if (!service) return;
        try {
            const recs = await service.getRecents();
            const favs = await service.getFavorites();
            setRecents(recs || []);
            setFavorites(favs || []);
        } catch (e) {
            console.error('Error loading library recents:', e);
        }
    };

    const handleSearch = async (text) => {
        setSearchQuery(text);
        if (!service) return;
        setLoading(true);
        try {
            const list = await service.search(text, filterType);
            setResults(list || []);
        } catch (e) {
            console.error('Search error in picker modal:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectItem = async (item) => {
        if (!service) return;
        try {
            await service.addRecent(item);
        } catch (e) {
            console.log('Error logging recent item:', e);
        }
        onSelect(item);
        onClose();
    };

    const handleToggleFavorite = async (item, event) => {
        event.stopPropagation(); // Avoid selecting item when toggling star
        if (!service) return;
        try {
            const newFavs = await service.toggleFavorite(item);
            setFavorites(newFavs || []);
            // Refresh recents list to sync favorited icons
            loadRecentsAndFavorites();
        } catch (e) {
            console.error('Error toggling favorite:', e);
        }
    };

    // A integração com a Navegação Completa será passada via props ou callback
    const handleCreateNew = () => {
        if (createRoute && service && service.navigation) {
            onClose(); // Fecha o modal
            // Navega para a tela completa passando o termo pesquisado
            service.navigation.navigate(createRoute, { 
                ...createParams,
                initialSearch: searchQuery, 
                returnToScreen: service.route.name // Usa o nome da rota atual para voltar
            });
        }
    };

    const isFavorite = (item) => {
        return favorites.some(f => f.uuid === item.uuid || (f.id && f.id === item.id) || (f.name && f.name === item.name));
    };

    const renderItemRow = ({ item }) => {
        const name = item.nome || item.name || item.produto || item.item || 'NÃO IDENTIFICADO';
        const sub = item.telefone || item.contato || item.area_ha ? `${item.area_ha} ha` : item.tipo || item.cargo || '';
        const starred = isFavorite(item);

        return (
            <TouchableOpacity 
                style={[styles.itemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} 
                onPress={() => handleSelectItem(item)}
            >
                <View style={[styles.avatarBox, { backgroundColor: theme?.colors?.primary + '15' }]}>
                    <Ionicons name="bookmark-outline" size={16} color={theme?.colors?.primary || '#10B981'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, { color: isDark ? '#FFF' : '#1F2937' }]}>{name.toUpperCase()}</Text>
                    {!!sub && <Text style={styles.itemSubText}>{sub.toUpperCase()}</Text>}
                </View>
                <TouchableOpacity onPress={(e) => handleToggleFavorite(item, e)} style={styles.favoriteButton}>
                    <Ionicons 
                        name={starred ? "star" : "star-outline"} 
                        size={20} 
                        color={starred ? "#FBBF24" : (isDark ? "#4B5563" : "#9CA3AF")} 
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.overlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint={isDark ? 'dark' : 'light'} style={[styles.sheet, { backgroundColor: isDark ? 'rgba(17,24,39,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                    
                    {/* Header bar indicator */}
                    <View style={[styles.indicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                    
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: isDark ? '#FFF' : '#1F2937' }]}>{title.toUpperCase()}</Text>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} onPress={onClose}>
                            <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#4B5563'} />
                        </TouchableOpacity>
                    </View>

                    {/* SEARCH INPUT & QUICK ADD SWITCH */}
                    <View style={styles.searchWrapper}>
                        <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                            <Ionicons name="search" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: isDark ? '#FFF' : '#1F2937' }]}
                                placeholder={placeholder}
                                placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch('')}>
                                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {/* Navigation Switch to Full Registration */}
                        {createRoute && (
                            <TouchableOpacity 
                                style={[styles.quickAddSwitch, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}
                                onPress={handleCreateNew}
                            >
                                <Ionicons 
                                    name="add" 
                                    size={18} 
                                    color={isDark ? '#FFF' : '#10B981'} 
                                />
                                <Text style={[styles.quickAddText, { color: isDark ? '#FFF' : '#10B981' }]}>
                                    NOVO
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* MAIN SCROLL - SUGGESTIONS OR RECENTS/FAVORITES */}
                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={theme?.colors?.primary || '#10B981'} />
                        </View>
                    ) : searchQuery.length > 0 ? (
                        /* SEARCH RESULTS */
                        <FlatList
                            data={results}
                            renderItem={renderItemRow}
                            keyExtractor={(item, idx) => item.uuid || String(idx)}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="cloud-search-outline" size={48} color={isDark ? '#374151' : '#9CA3AF'} />
                                    <Text style={[styles.emptyStateTitle, { color: isDark ? '#4B5563' : '#6B7280' }]}>Não encontrado localmente</Text>
                                    <Text style={styles.emptyStateSub}>Se o item não apareceu na pesquisa da fazenda, faça uma Busca Global ou cadastre um novo preenchendo os dados completos.</Text>
                                    
                                    <TouchableOpacity style={[styles.quickAddBtn, { backgroundColor: theme?.colors?.primary || '#10B981', marginTop: 20, width: '100%' }]} onPress={() => handleSearch(searchQuery + ' --global')}>
                                        <Text style={styles.quickAddBtnText}>BUSCAR NA BASE GLOBAL</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    ) : (
                        /* HOME DEFAULT STATE: FAVORITES & RECENTS */
                        <ScrollView contentContainerStyle={styles.defaultScroll} showsVerticalScrollIndicator={false}>
                            {/* FAVORITES (HORIZONTAL GRID) */}
                            {favorites.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="star" size={14} color="#FBBF24" />
                                        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>MEUS FAVORITOS</Text>
                                    </View>
                                    <View style={styles.favoritesGrid}>
                                        {favorites.map((item) => {
                                            const name = item.nome || item.name || item.produto || item.item || 'NÃO IDENTIFICADO';
                                            return (
                                                <TouchableOpacity 
                                                    key={item.uuid} 
                                                    style={[styles.favoriteCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB' }]}
                                                    onPress={() => handleSelectItem(item)}
                                                >
                                                    <Ionicons name="star" size={16} color="#FBBF24" style={styles.starBadge} />
                                                    <Text numberOfLines={1} style={[styles.favCardText, { color: isDark ? '#FFF' : '#374151' }]}>
                                                        {name.toUpperCase()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* RECENTS (VERTICAL LIST) */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="time" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                    <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>SELEÇÕES RECENTES</Text>
                                </View>
                                {recents.length === 0 ? (
                                    <View style={[styles.emptyRecents, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                                        <Ionicons name="timer-outline" size={24} color="#9CA3AF" />
                                        <Text style={styles.emptyRecentsText}>Nenhum registro selecionado recentemente.</Text>
                                    </View>
                                ) : (
                                    recents.map((item) => {
                                        const name = item.nome || item.name || item.produto || item.item || 'NÃO IDENTIFICADO';
                                        const sub = item.telefone || item.contato || item.area_ha ? `${item.area_ha} ha` : item.tipo || item.cargo || '';
                                        const starred = isFavorite(item);
                                        return (
                                            <TouchableOpacity 
                                                key={item.uuid} 
                                                style={[styles.itemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} 
                                                onPress={() => handleSelectItem(item)}
                                            >
                                                <View style={[styles.avatarBox, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                                                    <Ionicons name="time-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.itemText, { color: isDark ? '#FFF' : '#1F2937' }]}>{name.toUpperCase()}</Text>
                                                    {!!sub && <Text style={styles.itemSubText}>{sub.toUpperCase()}</Text>}
                                                </View>
                                                <TouchableOpacity onPress={(e) => handleToggleFavorite(item, e)} style={styles.favoriteButton}>
                                                    <Ionicons 
                                                        name={starred ? "star" : "star-outline"} 
                                                        size={20} 
                                                        color={starred ? "#FBBF24" : (isDark ? "#4B5563" : "#9CA3AF")} 
                                                    />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>

                            {/* FULL CATALOG FALLBACK LINK */}
                            {searchQuery.length === 0 && results.length > 0 && (
                                <View style={{ marginTop: 10 }}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="list" size={14} color="#9CA3AF" />
                                        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>RESTANTE DO CATÁLOGO</Text>
                                    </View>
                                    {results.slice(0, 10).map((item) => {
                                        const name = item.nome || item.name || item.produto || item.item || 'NÃO IDENTIFICADO';
                                        // Ignore if already in recents or favorites
                                        if (recents.some(r => r.uuid === item.uuid) || favorites.some(f => f.uuid === item.uuid)) return null;
                                        const sub = item.telefone || item.contato || item.area_ha ? `${item.area_ha} ha` : item.tipo || item.cargo || '';
                                        const starred = isFavorite(item);
                                        return (
                                            <TouchableOpacity 
                                                key={item.uuid} 
                                                style={[styles.itemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} 
                                                onPress={() => handleSelectItem(item)}
                                            >
                                                <View style={[styles.avatarBox, { backgroundColor: theme?.colors?.primary + '10' }]}>
                                                    <Ionicons name="chevron-forward-outline" size={16} color={theme?.colors?.primary || '#10B981'} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.itemText, { color: isDark ? '#FFF' : '#1F2937' }]}>{name.toUpperCase()}</Text>
                                                    {!!sub && <Text style={styles.itemSubText}>{sub.toUpperCase()}</Text>}
                                                </View>
                                                <TouchableOpacity onPress={(e) => handleToggleFavorite(item, e)} style={styles.favoriteButton}>
                                                    <Ionicons 
                                                        name={starred ? "star" : "star-outline"} 
                                                        size={20} 
                                                        color={starred ? "#FBBF24" : (isDark ? "#4B5563" : "#9CA3AF")} 
                                                    />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </ScrollView>
                    )}
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { 
        borderTopLeftRadius: 35, 
        borderTopRightRadius: 35, 
        paddingHorizontal: 20, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 25, 
        maxHeight: '85%', 
        minHeight: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10
    },
    indicator: { width: 45, height: 5, borderRadius: 10, alignSelf: 'center', marginTop: 12, marginBottom: 15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    
    // Search Box
    searchWrapper: { flexDirection: 'row', gap: 10, marginBottom: 18, alignItems: 'center' },
    searchBox: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        height: 52, 
        borderRadius: 16, 
        borderWidth: 1, 
        paddingHorizontal: 15 
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
    
    // Quick Add Switch
    quickAddSwitch: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        height: 52, 
        paddingHorizontal: 15, 
        borderRadius: 16, 
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    quickAddText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    
    quickAddBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    quickAddBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    listContainer: { paddingBottom: 50 },
    
    // Item row inside lists
    itemRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 14, 
        borderBottomWidth: 1
    },
    avatarBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemText: { fontSize: 13, fontWeight: '800' },
    itemSubText: { fontSize: 10, color: '#6B7280', fontWeight: 'bold', marginTop: 3 },
    favoriteButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

    // Empty States
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
    emptyStateTitle: { fontSize: 14, fontWeight: '800', marginTop: 15, marginBottom: 8 },
    emptyStateSub: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },

    // Home Default Style
    defaultScroll: { paddingBottom: 40 },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    
    // Favorites Grid
    favoritesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    favoriteCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10, 
        paddingHorizontal: 14, 
        borderRadius: 12, 
        borderWidth: 1, 
        position: 'relative' 
    },
    starBadge: { marginRight: 6 },
    favCardText: { fontSize: 11, fontWeight: '900', maxWidth: 120 },

    emptyRecents: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 15, justifyContent: 'center' },
    emptyRecentsText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' }
});
