import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function MyFarmScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minha Propriedade</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="barn" size={32} color="#1B5E20" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.farmName}>Fazenda Boa Esperança</Text>
                        <Text style={styles.farmLocation}>São Paulo, SP</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>350 Hectares</Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="pencil" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Talhões Registrados</Text>
                    <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add" size={18} color="#FFF" />
                        <Text style={styles.addBtnText}>Novo Talhão</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.fieldCard}>
                    <View style={styles.fieldHeader}>
                        <Text style={styles.fieldName}>Talhão 1 (Morango San Andreas)</Text>
                        <Text style={styles.fieldArea}>10 Ha</Text>
                    </View>
                    <View style={styles.fieldFooter}>
                        <Text style={styles.plantCount}>15.000 plantas</Text>
                        <Text style={styles.plantDate}>Plantado em: 10/01/2026</Text>
                    </View>
                </View>

                <View style={styles.fieldCard}>
                    <View style={styles.fieldHeader}>
                        <Text style={styles.fieldName}>Talhão 2 (Morango Albion)</Text>
                        <Text style={styles.fieldArea}>5 Ha</Text>
                    </View>
                    <View style={styles.fieldFooter}>
                        <Text style={styles.plantCount}>8.000 plantas</Text>
                        <Text style={styles.plantDate}>Plantado em: 05/02/2026</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, paddingTop: 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#ECEFF1' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
    content: { padding: 20 },
    infoCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    iconBox: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    farmName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    farmLocation: { fontSize: 14, color: '#64748B', marginBottom: 8 },
    badge: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#475569' },
    
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    addBtn: { flexDirection: 'row', backgroundColor: '#1B5E20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
    addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 },
    
    fieldCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    fieldName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    fieldArea: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
    fieldFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    plantCount: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    plantDate: { fontSize: 12, color: '#94A3B8' }
});
