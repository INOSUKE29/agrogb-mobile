import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ALL_OPERATIONAL_TOOLS = [
    { id: 'CadernoCampo', label: 'Caderno', icon: 'book-open-outline', color: '#0F766E' },
    { id: 'Colheita', label: 'Colheita', icon: 'leaf', color: '#059669' },
    { id: 'Monitoramento', label: 'Monitorar', icon: 'camera-outline', color: '#EC4899' },
    { id: 'MenuAdubacao', label: 'Adubação', icon: 'flask-outline', color: '#A855F7' },
    { id: 'Plantio', label: 'Plantio', icon: 'apple', color: '#8B5CF6' },
    { id: 'Scanner', label: 'Scanner QR', icon: 'barcode-scan', color: '#475569' },
    { id: 'MenuSistema', label: 'Ajustes', icon: 'cog-outline', color: '#475569' },
];

export default function ClientMenuScreen({ navigation }) {
    const renderTool = (item) => (
        <TouchableOpacity 
            key={item.id}
            style={styles.gridItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.id)}
        >
            <View style={styles.cardInternal}>
                <View style={[styles.balloon, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1B5E20', '#166534']}
                style={styles.headerGradient}
            >
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Central de Operações</Text>
                        <Text style={styles.headerSub}>Todas as ferramentas da fazenda</Text>
                    </View>
                    <Ionicons name="apps" size={30} color="rgba(255,255,255,0.7)" />
                </View>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.scroll} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridContainer}>
                    {ALL_OPERATIONAL_TOOLS.map(renderTool)}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerGradient: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#1B5E20',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        marginBottom: 20
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    
    scroll: { paddingHorizontal: 15, paddingBottom: 40 },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
    gridItem: { 
        width: '33.33%', 
        paddingHorizontal: 5,
        paddingVertical: 5,
        marginBottom: 8
    },
    cardInternal: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 5,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04, 
        shadowRadius: 8, 
        elevation: 2,
        height: 110, 
        justifyContent: 'center'
    },
    balloon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    itemLabel: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' },
});
