import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { executeQuery } from '../../database/database';
import AgroStateOverlay from '../../components/common/AgroStateOverlay';

export default function TalhoesAgronomoScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [talhoes, setTalhoes] = useState([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadAllTalhoes();
        });
        loadAllTalhoes();
        return unsubscribe;
    }, [navigation]);

    const loadAllTalhoes = async () => {
        setLoading(true);
        try {
            // Join fields with farms to show farm name
            const query = `
                SELECT 
                    f.uuid as field_uuid, f.nome as field_nome, f.area, f.plant_count, 
                    fa.nome as farm_nome
                FROM fields f
                LEFT JOIN farms fa ON f.farm_uuid = fa.uuid
                WHERE f.is_deleted = 0
                ORDER BY fa.nome ASC, f.nome ASC
            `;
            const res = await executeQuery(query);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            setTalhoes(rows);
        } catch (e) {
            console.error('Erro ao carregar talhões:', e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="map-outline" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldTitle, { color: activeColors.text || '#1F2937' }]}>{item.field_nome}</Text>
                    <Text style={[styles.farmName, { color: activeColors.textSub || '#6B7280' }]}>
                        <Ionicons name="home-outline" size={12} /> {item.farm_nome || 'Fazenda Desconhecida'}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Diagnosticos', { fieldId: item.field_uuid, fieldName: item.field_nome })}
                >
                    <Ionicons name="medkit-outline" size={18} color="#10B981" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.infoBadge}>
                    <Ionicons name="expand-outline" size={14} color={activeColors.textSub || '#6B7280'} />
                    <Text style={[styles.infoText, { color: activeColors.textSub || '#6B7280' }]}>{item.area} ha</Text>
                </View>
                <View style={styles.infoBadge}>
                    <Ionicons name="leaf-outline" size={14} color={activeColors.textSub || '#6B7280'} />
                    <Text style={[styles.infoText, { color: activeColors.textSub || '#6B7280' }]}>{item.plant_count} Plantas</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#06111C', '#0A1522']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MAPA DE TALHÕES</Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={talhoes}
                    renderItem={renderItem}
                    keyExtractor={item => item.field_uuid}
                    contentContainerStyle={talhoes.length === 0 ? { flex: 1 } : styles.list}
                    ListEmptyComponent={
                        <AgroStateOverlay 
                            state="empty" 
                            message="Nenhum talhão registrado nas fazendas."
                            icon="map-outline"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 15, letterSpacing: 1 },
    list: { padding: 15, paddingBottom: 100 },
    card: { 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 15, 
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    fieldTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    farmName: { fontSize: 13, fontWeight: '600' },
    actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.2)', paddingTop: 15, gap: 15 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(156, 163, 175, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    infoText: { fontSize: 12, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
