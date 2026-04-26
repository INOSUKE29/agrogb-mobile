import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator, ScrollView,
    SafeAreaView, StatusBar, Platform, Dimensions, Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCadastro, insertCadastro, deleteCadastro, updateCadastro } from '../database/database';
import { showToast } from '../ui/Toast';

const { width } = Dimensions.get('window');

const CATEGORIES = {
    DEFENSIVO:    { label: 'Defensivo Agrícola',    icon: 'flask',       color: '#EF4444' },
    FERTILIZANTE: { label: 'Fertilizante / Adubo',  icon: 'leaf',        color: '#10B981' },
    NUTRIENTE:    { label: 'Nutriente / Corretivo',  icon: 'water',       color: '#F59E0B' },
    EMBALAGEM:    { label: 'Embalagem / Caixa',      icon: 'cube-outline',color: '#60A5FA' },
    INSUMO:       { label: 'Insumo Geral',           icon: 'construct',   color: '#8B5CF6' },
    CULTURA:      { label: 'Cultura (Plantio)',       icon: 'nutrition',   color: '#34D399' },
    PRODUTO:      { label: 'Produto (Venda)',         icon: 'cart',        color: '#F59E0B' },
    AREA:         { label: 'Área / Talhão',           icon: 'map',         color: '#6EE7B7' }
};

const FILTROS = ['TODAS', 'DEFENSIVO', 'FERTILIZANTE', 'INSUMO', 'PRODUTO', 'CULTURA', 'EMBALAGEM'];

export default function CadastroScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('TODAS');

    // Form state
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('INSUMO');
    const [unidade, setUnidade] = useState('KG');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCadastro();
            setItems(data);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao carregar catálogo.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const memoSections = useMemo(() => {
        const filtered = items.filter(it => {
            const matchTermo = it.nome.toUpperCase().includes(termoBusca.toUpperCase());
            const matchCat = filtroCategoria === 'TODAS' || it.tipo === filtroCategoria;
            return matchTermo && matchCat;
        });
        const grouped = filtered.reduce((acc, item) => {
            const t = item.tipo || 'INSUMO';
            if (!acc[t]) acc[t] = { title: t, data: [] };
            acc[t].data.push(item);
            return acc;
        }, {});
        return Object.values(grouped);
    }, [items, termoBusca, filtroCategoria]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />
            
            {/* HERDER (COESTO COM A HOME) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', 'transparent']}
                style={styles.header}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.branding}>
                        <Image source={require('../../assets/logo.png')} style={styles.megaLogo} />
                        <Text style={styles.headerTitle}>Catálogo</Text>
                    </View>

                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={30} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Buscar no catálogo..." 
                        value={termoBusca}
                        onChangeText={setTermoBusca}
                    />
                </View>
            </LinearGradient>

            <View style={styles.filterArea}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                    {FILTROS.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterChip, filtroCategoria === f && styles.filterChipActive]}
                            onPress={() => setFiltroCategoria(f)}
                        >
                            <Text style={[styles.filterText, filtroCategoria === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1B5E20" style={{marginTop: 50}} />
            ) : (
                <SectionList
                    sections={memoSections}
                    keyExtractor={item => item.uuid}
                    contentContainerStyle={styles.list}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.secTitle}>{CATEGORIES[title]?.label || title}</Text>
                    )}
                    renderItem={({ item }) => {
                        const cfg = CATEGORIES[item.tipo] || CATEGORIES['INSUMO'];
                        return (
                            <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
                                <View style={[styles.balloon, {backgroundColor: cfg.color + '15'}]}>
                                    <Ionicons name={cfg.icon} size={24} color={cfg.color} />
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.unidade} • {cfg.label}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#999" />
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { height: 260, paddingTop: 60, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    backBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    branding: { alignItems: 'center' },
    megaLogo: { width: 60, height: 60, borderRadius: 15, marginBottom: 5 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    addBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 15, height: 50, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

    filterArea: { marginVertical: 15 },
    filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#F0F0F0' },
    filterChipActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
    filterText: { fontSize: 13, fontWeight: 'bold', color: '#999' },
    filterTextActive: { color: '#FFF' },

    list: { padding: 20, paddingBottom: 100 },
    secTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', marginBottom: 15, marginTop: 10 },
    itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    balloon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemSub: { fontSize: 12, color: '#999', marginTop: 2 }
});
