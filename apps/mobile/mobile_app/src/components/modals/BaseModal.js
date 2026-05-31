import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const { height } = Dimensions.get('window');

/**
 * BaseModal (V1.1 DIAMOND PRO) 💎
 * Base para todos os cadastros rápidos e ações contextuais. 🚀
 */
export default function BaseModal({ visible, onClose, title, children }) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* CONTENT */}
                    <View style={styles.content}>
                        {children}
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: height * 0.85,
        borderWidth: 1,
        borderBottomWidth: 0,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        paddingBottom: 40,
    }
});
