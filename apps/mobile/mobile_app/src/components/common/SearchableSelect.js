import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function SearchableSelect({ 
    label, 
    value, 
    options = [], 
    onSelect, 
    placeholder = 'Selecione...',
    allowCustom = false, 
    icon = 'list-outline'
}) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';
    const cardBg = activeColors.card || '#FFFFFF';

    useEffect(() => {
        if (search) {
            setFilteredData(options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())));
        } else {
            setFilteredData(options);
        }
    }, [search, options]);

    const handleSelect = (item) => {
        onSelect(item.id);
        setModalVisible(false);
        setSearch('');
    };

    const handleCustom = () => {
        if (search.trim() && allowCustom) {
            onSelect(search.trim());
            setModalVisible(false);
            setSearch('');
        }
    };

    const selectedOption = options.find(o => o.id === value);
    const displayValue = selectedOption ? selectedOption.name : (allowCustom && value ? value : '');

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: textMutedColor }]}>{label}</Text>}
            <TouchableOpacity 
                style={[styles.inputBox, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: borderCol }]} 
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name={icon} size={18} color={textMutedColor} style={styles.icon} />
                <Text style={[styles.inputText, { color: displayValue ? textColor : textMutedColor }]}>
                    {displayValue || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={textMutedColor} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>{label || 'Selecione'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={textMutedColor} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.searchBox, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
                            <Ionicons name="search" size={18} color={textMutedColor} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: textColor }]}
                                placeholder="Buscar..."
                                placeholderTextColor={textMutedColor}
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                        </View>

                        <FlatList
                            data={filteredData}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.optionItem, { borderBottomColor: borderCol }]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[styles.optionText, { color: textColor }]}>{item.name}</Text>
                                    {value === item.id && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <Text style={[styles.emptyText, { color: textMutedColor }]}>Nenhum item encontrado.</Text>
                                    {allowCustom && search.trim() !== '' && (
                                        <TouchableOpacity style={styles.customBtn} onPress={handleCustom}>
                                            <Ionicons name="add-circle-outline" size={18} color="#10B981" />
                                            <Text style={styles.customBtnTxt}>Adicionar "{search}"</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
    inputBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 15 },
    icon: { marginRight: 10 },
    inputText: { flex: 1, fontSize: 14, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 16, fontWeight: 'bold' },
    searchBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, paddingHorizontal: 12, marginBottom: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15 },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    optionText: { fontSize: 15, fontWeight: '500' },
    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { fontSize: 14, fontWeight: '500' },
    customBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, backgroundColor: '#10B98115', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
    customBtnTxt: { color: '#10B981', fontWeight: 'bold', fontSize: 13 }
});
