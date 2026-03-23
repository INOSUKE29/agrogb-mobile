import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

export default function BaseModal({
    visible,
    onClose,
    title,
    children,
    footer
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity 
                    style={styles.dismissArea} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />
                
                <View style={styles.container}>
                    {/* Indicador de Swipe (Estético) */}
                    <View style={styles.swipeIndicator} />

                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CONTENT */}
                    <View style={styles.content}>
                        {children}
                    </View>

                    {/* FOOTER (Opcional) */}
                    {footer && (
                        <View style={styles.footer}>
                            {footer}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        backgroundColor: "#111827", // Dark theme premium
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: height * 0.9,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    swipeIndicator: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        color: "#F9FAFB",
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        color: "#9CA3AF",
        fontSize: 16,
    },
    content: {
        // flexShrink: 1,
    },
    footer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    }
});
