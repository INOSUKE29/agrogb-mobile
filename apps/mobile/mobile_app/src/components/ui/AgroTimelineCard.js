import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeBlurView from './SafeBlurView';

export default function AgroTimelineCard({ event, isLast }) {
    return (
        <View style={styles.container}>
            {/* Eixo Esquerdo (Linha e Ponto) */}
            <View style={styles.leftAxis}>
                <View style={[styles.iconContainer, { backgroundColor: event.color + '20' }]}>
                    <Ionicons name={event.icon} size={20} color={event.color} />
                </View>
                {/* A linha que conecta com o próximo evento */}
                {!isLast && <View style={[styles.verticalLine, { backgroundColor: event.color + '50' }]} />}
            </View>

            {/* Conteúdo do Card (Glassmorphism) */}
            <View style={styles.cardWrapper}>
                <SafeBlurView intensity={25} tint="dark" style={[styles.card, { borderLeftColor: event.color }]}>
                    <View style={styles.header}>
                        <Text style={styles.dateText}>
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: event.color + '20' }]}>
                            <Text style={[styles.typeText, { color: event.color }]}>{event.type}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{event.title}</Text>
                    {event.subtitle ? <Text style={styles.subtitle}>{event.subtitle}</Text> : null}
                </SafeBlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: '100%',
        minHeight: 100,
    },
    leftAxis: {
        width: 60,
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2, // Fica em cima da linha
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    verticalLine: {
        width: 2,
        flex: 1,
        marginTop: -5, // Sobrepõe um pouco a bolinha
        marginBottom: -5,
        zIndex: 1
    },
    cardWrapper: {
        flex: 1,
        paddingBottom: 20,
        paddingRight: 20,
    },
    card: {
        padding: 15,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    title: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        color: '#D1FAE5',
        fontSize: 13,
        opacity: 0.8,
    }
});
