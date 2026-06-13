import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from '../../styles/globalStyles';
import EntitySelectorModal from './EntitySelectorModal';

export default function SmartEntitySelector({
    label,
    value, 
    onSelect, 
    service, // Service that implements searchLocal, searchGlobal, importEntity
    title = 'SELECIONAR',
    placeholder = 'Toque para selecionar...',
    filterType = null,
    createRoute = null, 
    createParams = {}, 
    style = {},
    icon = 'search-outline'
}) {
    const [modalVisible, setModalVisible] = useState(false);

    const getDisplayName = () => {
        if (!value) return '';
        if (typeof value === 'string') return value.toUpperCase();
        return (value.nome || value.name || value.produto || value.item || '').toUpperCase();
    };

    const displayName = getDisplayName();
    const isSelected = !!displayName;

    return (
        <View style={[styles.container, style]}>
            {!!label && <Text style={globalStyles.label}>{label}</Text>}
            
            <View style={[
                globalStyles.input,
                styles.wrapper,
                isSelected && globalStyles.inputFocus
            ]}>
                <TouchableOpacity 
                    style={styles.tapArea} 
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons 
                        name={icon} 
                        size={18} 
                        color={isSelected ? colors.primary : colors.textMuted} 
                        style={styles.icon} 
                    />
                    <Text 
                        numberOfLines={1} 
                        style={[
                            styles.displayText, 
                            { 
                                color: isSelected ? colors.text : colors.textMuted,
                                fontWeight: isSelected ? '800' : '500'
                            }
                        ]}
                    >
                        {isSelected ? displayName : placeholder}
                    </Text>
                </TouchableOpacity>

                {isSelected ? (
                    <TouchableOpacity onPress={() => onSelect(null)} style={styles.actionBtn}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                    </TouchableOpacity>
                ) : (
                    createRoute && (
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderRadius: 8 }]} 
                            onPress={() => setModalVisible(true)}
                        >
                            <Ionicons name="add" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    )
                )}
            </View>

            <EntitySelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={onSelect}
                service={service}
                title={title}
                placeholder={placeholder}
                filterType={filterType}
                createRoute={createRoute}
                createParams={createParams}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 0 // globalStyles.input tem marginBottom, aqui resetamos
    },
    tapArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%'
    },
    icon: { marginRight: 12 },
    displayText: { fontSize: 14, flex: 1 },
    actionBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
});
