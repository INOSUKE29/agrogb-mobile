import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function FriendlyModal({ visible, emoji, title, message, onClose, buttonText = 'Entendido 👍' }) {
    const { theme } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Emoji Header */}
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emoji}>{emoji || '🧐'}</Text>
                    </View>

                    {/* Title & Description */}
                    <Text style={styles.title}>{title || 'Ops! Algo deu errado'}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#10B981' }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    emojiContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#A7F3D0',
    },
    emoji: {
        fontSize: 45,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
        paddingHorizontal: 5,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
