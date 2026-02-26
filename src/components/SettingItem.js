import React, { useState } from 'react';
import { COLORS } from '../styles/theme';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, AVAILABLE_THEMES } from '../context/ThemeContext';

export default function SettingItem({
    type,
    label,
    value,
    icon,
    settingKey,
    options = [],
    action,
    route,
    danger = false,
    keyboardType = 'default',
    onValueChange,
    onPress,
    isLast = false
}) {
    const { colors, theme, setTheme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');

    const handlePress = () => {
        if (type === 'navigation' && onPress) {
            onPress();
        } else if (type === 'select' || type === 'theme') {
            setModalVisible(true);
        } else if (type === 'action') {
            if (danger) {
                Alert.alert(
                    'Confirmação',
                    `Tem certeza que deseja ${label.toLowerCase()}?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Confirmar', onPress: onPress, style: 'destructive' }
                    ]
                );
            } else {
                onPress && onPress();
            }
        }
    };

    const handleSelectOption = (option) => {
        if (type === 'theme') {
            setTheme(option.value);
        }
        onValueChange && onValueChange(option.value || option);
        setModalVisible(false);
    };

    const handleInputBlur = () => {
        onValueChange && onValueChange(inputValue);
    };

    const renderRightContent = () => {
        switch (type) {
            case 'info':
                return <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>;

            case 'input':
                return (
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        onBlur={handleInputBlur}
                        placeholder="Digite..."
                        placeholderTextColor={colors.textSecondary}
                        keyboardType={keyboardType}
                    />
                );

            case 'select':
                return (
                    <View style={styles.selectContainer}>
                        <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                );

            case 'theme':
                const currentTheme = AVAILABLE_THEMES[theme] || {};
                return (
                    <View style={styles.selectContainer}>
                        <View style={[styles.themeIndicator, { backgroundColor: currentTheme?.colors?.primary ?? '#1E7F5C' }]} />
                        <Text style={[styles.valueText, { color: colors.textSecondary }]}>{currentTheme?.name ?? ''}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                );

            case 'toggle':
                return (
                    <Switch
                        value={value}
                        onValueChange={onValueChange}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                    />
                );

            case 'navigation':
                return <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />;

            case 'action':
                return null;

            default:
                return null;
        }
    };

    const isInteractive = ['select', 'theme', 'navigation', 'action'].includes(type);

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.container,
                    { borderBottomColor: colors.glassBorder ?? '#333' },
                    isLast && styles.lastItem,
                    danger && styles.dangerItem
                ]}
                onPress={isInteractive ? handlePress : undefined}
                activeOpacity={isInteractive ? 0.7 : 1}
                disabled={!isInteractive}
            >
                <View style={styles.leftContent}>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={danger ? (colors.destructive ?? '#D64545') : colors.textSecondary}
                            style={styles.icon}
                        />
                    )}
                    <Text style={[
                        styles.label,
                        { color: danger ? (colors.destructive ?? '#D64545') : colors.text }
                    ]}>
                        {label}
                    </Text>
                </View>
                <View style={styles.rightContent}>
                    {renderRightContent()}
                </View>
            </TouchableOpacity>

            {/* SELECT/THEME MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface ?? '#0F4D3A' }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
                        <ScrollView style={styles.optionsList}>
                            {type === 'theme' ? (
                                Object.entries(AVAILABLE_THEMES).map(([key, themeData]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.optionItem,
                                            { borderBottomColor: colors.glassBorder ?? '#333' },
                                            theme === key && { backgroundColor: colors.primary + '15' }
                                        ]}
                                        onPress={() => handleSelectOption({ value: key })}
                                    >
                                        <View style={[styles.themeIndicator, { backgroundColor: themeData.primary }]} />
                                        <Text style={[styles.optionText, { color: colors.text }]}>{themeData.name}</Text>
                                        {theme === key && (
                                            <Ionicons name="checkmark" size={24} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                options.map((option, index) => {
                                    const optionValue = typeof option === 'object' ? option.value : option;
                                    const optionLabel = typeof option === 'object' ? option.label : option;
                                    const isSelected = value === optionValue;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.optionItem,
                                                { borderBottomColor: colors.glassBorder ?? '#333' },
                                                isSelected && { backgroundColor: colors.primary + '15' }
                                            ]}
                                            onPress={() => handleSelectOption(optionValue)}
                                        >
                                            <Text style={[styles.optionText, { color: colors.text }]}>{optionLabel}</Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={24} color={colors.primary} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        minHeight: 56,
        borderBottomWidth: 1
    },
    lastItem: {
        borderBottomWidth: 0
    },
    dangerItem: {
        backgroundColor: '#FEF2F2'
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    icon: {
        marginRight: 12
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12
    },
    valueText: {
        fontSize: 14,
        marginRight: 8
    },
    input: {
        fontSize: 14,
        textAlign: 'right',
        minWidth: 100,
        paddingVertical: 4
    },
    selectContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    themeIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16
    },
    optionsList: {
        maxHeight: 400
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        gap: 12
    },
    optionText: {
        fontSize: 15,
        flex: 1
    }
});
