import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SelectProfileScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleSelectProfile = (role) => {
        // Redireciona para o passo de dados pessoais passando a role escolhida
        navigation.navigate('PersonalData', { role });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', '#F8F9FA']}
                style={styles.atmosphere}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
            
            <SafeAreaView style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Bem-vindo ao AgroGB</Text>
                    <Text style={styles.subtitle}>Como você deseja utilizar a plataforma?</Text>

                    <TouchableOpacity 
                        style={styles.card} 
                        activeOpacity={0.8}
                        onPress={() => handleSelectProfile('CLIENTE')}
                    >
                        <LinearGradient colors={['#FFFFFF', '#F1F8E9']} style={styles.cardGrad}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="tractor" size={32} color="#2E7D32" />
                            </View>
                            <View style={styles.cardTextContainer}>
                                <Text style={styles.cardTitle}>Sou Produtor Rural</Text>
                                <Text style={styles.cardDesc}>Quero receber recomendações, gerenciar minha fazenda e acompanhar a produção.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#A5D6A7" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.card} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ValidateAgronomist')}
                    >
                        <LinearGradient colors={['#FFFFFF', '#E8F5E9']} style={styles.cardGrad}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="clipboard-check-outline" size={32} color="#1565C0" />
                            </View>
                            <View style={styles.cardTextContainer}>
                                <Text style={styles.cardTitle}>Sou Engenheiro Agrônomo</Text>
                                <Text style={styles.cardDesc}>Quero cadastrar clientes, enviar prescrições técnicas e acompanhar aplicações.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#90CAF9" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    atmosphere: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    header: { padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
    title: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 10 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 40, fontWeight: '500' },
    
    card: { 
        marginBottom: 20, 
        borderRadius: 20, 
        shadowColor: '#000', 
        shadowOpacity: 0.08, 
        shadowRadius: 15, 
        elevation: 8,
        overflow: 'hidden'
    },
    cardGrad: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 25 
    },
    iconCircle: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: '#FFF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 20,
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 3
    },
    cardTextContainer: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#263238', marginBottom: 5 },
    cardDesc: { fontSize: 13, color: '#78909C', lineHeight: 18 }
});
