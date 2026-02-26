import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/theme';

export default function MenuCadastrosScreen({ navigation }) {

    const MENU_ITEMS = [
        {
            title: "PRODUTOS / INSUMOS",
            subtitle: "Defensivos, Fertilizantes, Embalagens...",
            icon: "cube-outline",
            description: "Gerenciar catálogo de itens usados no campo.",
            route: "Cadastro",
            color: COLORS.primaryLight
        },
        {
            title: "CLIENTES / COMPRADORES",
            subtitle: "Mercados, Feirantes, Consumidor final...",
            icon: "people-outline",
            description: "Gerenciar quem compra sua produção.",
            route: "Clientes",
            color: "#60A5FA" // Blue Light
        },
        {
            title: "ÁREAS / TALHÕES",
            subtitle: "Setores da propriedade...",
            icon: "map-outline",
            description: "Gerenciar locais de plantio.",
            route: "Culturas",
            color: "#FBBF24" // Amber Light
        },
        {
            title: "FORNECEDORES",
            subtitle: "Lojas agrícolas, parceiros...",
            icon: "briefcase-outline",
            description: "Gerenciar quem fornece insumos.",
            route: "Clientes",
            color: "#9CA3AF" // Gray Light
        }
    ];

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MENU DE CADASTROS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Centralize todas as informações do seu negócio.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => navigation.navigate(item.route)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name={item.icon} size={32} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, { color: item.color }]}>{item.title}</Text>
                            <Text style={styles.cardSub}>{item.subtitle}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.glassBorder} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },

    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.2)' // Subtle header bg 
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5, flex: 1, textAlign: 'center' },
    headerSub: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 13 },

    content: { padding: 20, paddingBottom: 50 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface, // Dark Surface
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.glassBorder
    },
    iconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    textContainer: { flex: 1 },
    cardTitle: { fontSize: 13, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
    cardSub: { fontSize: 13, fontWeight: 'bold', color: COLORS.white, marginBottom: 2 },
    cardDesc: { fontSize: 11, color: COLORS.gray500 }
});
