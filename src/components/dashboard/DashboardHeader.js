import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardHeader({ userName, propertyName, onProfilePress, onNotifyPress }) {
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <LinearGradient 
            colors={[theme?.colors?.primary || '#10B981', theme?.colors?.primaryDeep || '#059669']} 
            style={styles.container}
        >
            <View style={styles.topRow}>
                <TouchableOpacity onPress={onProfilePress} style={styles.profileContainer}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{userName?.charAt(0) || 'U'}</Text>
                    </View>
                    <View>
                        <Text style={styles.greeting}>{greeting()},</Text>
                        <Text style={styles.userName}>{userName || 'Produtor'}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={onNotifyPress}>
                        <Ionicons name="notifications-outline" size={24} color="#FFF" />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="calendar-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.propertySelector}>
                <View style={styles.propertyInfo}>
                    <Ionicons name="business" size={18} color="#FFF" style={{ marginRight: 8, opacity: 0.8 }} />
                    <Text style={styles.propertyName}>{propertyName || 'Selecionar Propriedade'}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#FFF" style={{ opacity: 0.8 }} />
            </TouchableOpacity>

            <View style={styles.periodRow}>
                {['Mês', 'Safra', 'Ano'].map((p, i) => (
                    <TouchableOpacity key={i} style={[styles.periodBtn, i === 0 && styles.periodBtnActive]}>
                        <Text style={[styles.periodText, i === 0 && styles.periodTextActive]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    greeting: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F87171',
        borderWidth: 1,
        borderColor: '#059669',
    },
    propertySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 12,
        borderRadius: 15,
        marginBottom: 20,
    },
    propertyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    propertyName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    periodRow: {
        flexDirection: 'row',
        gap: 10,
    },
    periodBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    periodBtnActive: {
        backgroundColor: '#FFF',
    },
    periodText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    periodTextActive: {
        color: '#059669',
    }
});
