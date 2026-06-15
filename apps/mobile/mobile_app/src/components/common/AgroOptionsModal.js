// AgroOptionsModal.js - Glassmorphic Bottom Sheet for Item Actions (Edit / Delete)
import React from 'react';
import { StyleSheet, View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    Platform,
    Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function AgroOptionsModal({
    visible,
    onClose,
    title = 'Opções do Registro',
    subtitle = '',
    onEdit,
    onDelete,
    editLabel = 'EDITAR REGISTRO',
    deleteLabel = 'EXCLUIR REGISTRO',
    cancelLabel = 'CANCELAR'
}) {
    const { theme } = useTheme();
    const isDark = theme?.theme_mode === 'dark' || theme?.dark || false;
    const activeColors = theme?.colors || {};

    const handleEditPress = () => {
        onClose();
        if (onEdit) setTimeout(() => onEdit(), 100);
    };

    const handleDeletePress = () => {
        onClose();
        if (onDelete) setTimeout(() => onDelete(), 100);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop Area to Tap Out */}
                <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />
                
                {/* Blur Sheet */}
                <BlurView 
                    intensity={Platform.OS === 'ios' ? 75 : 100} 
                    tint={isDark ? 'dark' : 'light'} 
                    style={[
                        styles.sheet, 
                        { 
                            backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
                            borderColor: activeColors.border || 'rgba(0,0,0,0.08)'
                        }
                    ]}
                >
                    {/* Visual drag indicator */}
                    <View style={[styles.indicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]} />
                    
                    {/* Header Details */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                            {title.toUpperCase()}
                        </Text>
                        {!!subtitle && (
                            <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                {subtitle.toUpperCase()}
                            </Text>
                        )}
                    </View>
                    
                    {/* Options list */}
                    <View style={styles.optionsWrapper}>
                        {/* EDIT ACTION */}
                        <TouchableOpacity 
                            style={[
                                styles.optionRow, 
                                { 
                                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
                                    borderColor: 'rgba(16, 185, 129, 0.2)' 
                                }
                            ]}
                            onPress={handleEditPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="create" size={22} color={activeColors.primary || '#10B981'} />
                            </View>
                            <Text style={[styles.optionText, { color: activeColors.primary || '#10B981' }]}>
                                {editLabel}
                            </Text>
                        </TouchableOpacity>

                        {/* DELETE ACTION */}
                        <TouchableOpacity 
                            style={[
                                styles.optionRow, 
                                { 
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)',
                                    borderColor: 'rgba(239, 68, 68, 0.2)' 
                                }
                            ]}
                            onPress={handleDeletePress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <Ionicons name="trash" size={22} color={activeColors.error || '#EF4444'} />
                            </View>
                            <Text style={[styles.optionText, { color: activeColors.error || '#EF4444' }]}>
                                {deleteLabel}
                            </Text>
                        </TouchableOpacity>

                        {/* CANCEL ACTION */}
                        <TouchableOpacity 
                            style={[
                                styles.cancelBtn, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                }
                            ]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.cancelText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                                {cancelLabel.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0,0,0,0.55)' 
    },
    sheet: { 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        paddingHorizontal: 25, 
        paddingBottom: Platform.OS === 'ios' ? 45 : 30, 
        borderWidth: 1,
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 15
    },
    indicator: { 
        width: 48, 
        height: 5, 
        borderRadius: 10, 
        alignSelf: 'center', 
        marginTop: 12, 
        marginBottom: 20 
    },
    header: { 
        alignItems: 'center', 
        marginBottom: 25 
    },
    title: { 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 1.2, 
        textAlign: 'center'
    },
    subtitle: { 
        fontSize: 11, 
        fontWeight: '700', 
        marginTop: 5, 
        letterSpacing: 0.8,
        opacity: 0.85
    },
    optionsWrapper: { 
        gap: 12 
    },
    optionRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 18, 
        borderWidth: 1,
        gap: 16
    },
    iconBox: { 
        width: 42, 
        height: 42, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    optionText: { 
        fontSize: 14, 
        fontWeight: '800', 
        letterSpacing: 0.8 
    },
    cancelBtn: { 
        height: 52, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 8 
    },
    cancelText: { 
        fontSize: 13, 
        fontWeight: '800', 
        letterSpacing: 1.2 
    }
});
