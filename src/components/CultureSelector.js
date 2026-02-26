import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CultureSelector({
    cultures = [],
    selectedCulture,
    onSelect,
    loading = false,
    error = null
}) {

    if (loading) {
        return <ActivityIndicator size="small" color="#15803D" style={{ marginVertical: 10 }} />;
    }

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    if (!cultures || cultures.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma cultura cadastrada.</Text>
                <Text style={styles.emptySub}>Cadastre culturas no menu principal.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>VINCULAR À CULTURA <Text style={styles.required}>*</Text></Text>
            <Text style={styles.subLabel}>Escolha uma cultura cadastrada</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {cultures.map((cult) => {
                    const isSelected = selectedCulture === cult.id || selectedCulture === cult.nome;
                    // Assuming value passed is name or ID. Prompt says: "Associar a compra ao ID da cultura selecionada" -> "cultureId"
                    // But legacy might use Name. Let's support both or just ID. Existing code used Name string. 
                    // Prompt says: "Manter payload atual, apenas acrescentando: cultureId"
                    // So we probably need to save BOTH name (for legacy support/display) AND ID (for relation).
                    // Or just use ID if we change everything.
                    // Prompt: "Associar a compra ao ID da cultura selecionada... Manter payload atual... culture: (cultura || 'GERAL')"
                    // Let's pass the whole object or ID to onSelect.

                    return (
                        <TouchableOpacity
                            key={cult.uuid || cult.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => onSelect(cult)}
                        >
                            <Ionicons
                                name={isSelected ? "checkmark-circle" : "leaf-outline"}
                                size={18}
                                color={isSelected ? "#15803D" : "#4B5563"}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                {cult.nome}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
    required: { color: '#EF4444' },
    subLabel: { fontSize: 11, color: '#6B7280', marginBottom: 10 },
    scroll: { paddingVertical: 5 },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    chipActive: {
        backgroundColor: '#DCFCE7',
        borderColor: '#86EFAC'
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563'
    },
    chipTextActive: {
        color: '#15803D',
        fontWeight: 'bold'
    },

    errorText: { color: '#EF4444', fontSize: 12 },
    emptyContainer: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8 },
    emptyText: { color: '#EF4444', fontWeight: 'bold' },
    emptySub: { color: '#B91C1C', fontSize: 11 }
});
