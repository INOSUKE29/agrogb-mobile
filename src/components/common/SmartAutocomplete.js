// SmartAutocomplete.js - Smart Input with Inline Plus Shortcut and LibraryPickerModal Binding
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import LibraryPickerModal from './LibraryPickerModal';

export default function SmartAutocomplete({
    label,
    value, // Selected object (e.g. { name: 'Bruno', uuid: '...' }) or string
    onSelect, // Callback when item is chosen
    service, // LibraryService reference
    title = 'SELECIONAR',
    placeholder = 'Toque para selecionar...',
    filterType = null,
    quickAddFields = [], // Array of { key, label, placeholder, defaultValue }
    style = {},
    icon = 'search-outline'
}) {
    const { theme } = useTheme();
    const isDark = theme?.dark || false;
    const [modalVisible, setModalVisible] = useState(false);

    // Derive display name from selected value
    const getDisplayName = () => {
        if (!value) return '';
        if (typeof value === 'string') return value.toUpperCase();
        const name = value.nome || value.name || value.produto || value.item || '';
        return name.toUpperCase();
    };

    const displayName = getDisplayName();
    const isSelected = !!displayName;

    const handleClear = () => {
        onSelect(null);
    };

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
                {/* Main Tap Target */}
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

                {/* Right Actions */}
                <View style={styles.actionRow}>
                    {isSelected ? (
                        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    ) : (
                        quickAddFields.length > 0 && (
                            <TouchableOpacity 
                                style={[styles.quickAddShortcut, { backgroundColor: theme?.colors?.primary + '15' }]} 
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="add" size={16} color={theme?.colors?.primary || '#10B981'} />
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>

            {/* Bounded Picker Modal */}
            <LibraryPickerModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={onSelect}
                service={service}
                title={title}
                placeholder={placeholder}
                filterType={filterType}
                quickAddFields={quickAddFields}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
    inputWrapper: {
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1
    },
    tapArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%'
    },
    icon: { marginRight: 12 },
    displayText: { fontSize: 13, flex: 1 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    clearBtn: { padding: 5 },
    quickAddShortcut: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
