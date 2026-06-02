import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function ConfirmModal({ visible, title = 'Atenção', message = 'Tem certeza que deseja continuar?', onCancel, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = true }) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={isDestructive ? "warning" : "information-circle"} size={32} color={isDestructive ? colors.danger : colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.btnCancel, { backgroundColor: 'transparent', borderColor: colors.glassBorder, borderWidth: 1 }]} onPress={onCancel}>
                            <Text style={[styles.btnText, { color: colors.textSecondary }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnConfirm, { backgroundColor: isDestructive ? colors.danger : colors.primary }]} onPress={onConfirm}>
                            <Text style={[styles.btnText, { color: colors.textOnPrimary }]}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    iconContainer: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
