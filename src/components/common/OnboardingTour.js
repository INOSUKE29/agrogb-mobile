import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '🚜',
        title: 'Bem-vindo ao AgroGB!',
        subtitle: 'Seu parceiro de confiança no campo',
        description: 'Vamos te ajudar a cuidar da sua fazenda de um jeito muito fácil e inteligente! Veja como é simples usar o aplicativo.',
        colors: ['#064E3B', '#10B981'],
        iconName: 'navigate-circle-outline'
    },
    {
        id: '2',
        emoji: '📓',
        title: 'Caderno de Campo',
        subtitle: 'O diário da sua plantação',
        description: 'Aqui você anota tudo o que faz na terra: regas, adubações e cuidados com as plantas. Suas lavouras sempre saudáveis! 🌱',
        colors: ['#1E3A8A', '#3B82F6'],
        iconName: 'book-outline'
    },
    {
        id: '3',
        emoji: '📦',
        title: 'Galpão de Estoque',
        subtitle: 'Controle de sementes e adubos',
        description: 'Saiba exatamente o que tem guardado. O aplicativo te avisa de forma automática quando algum insumo estiver acabando! ⚠️',
        colors: ['#78350F', '#F59E0B'],
        iconName: 'cube-outline'
    },
    {
        id: '4',
        emoji: '🍓',
        title: 'Colheita Farta',
        subtitle: 'O ouro da sua terra',
        description: 'Registre o fruto do seu trabalho duro de forma simples. Veja quanto colheu e tenha o controle da sua produção! 🧺',
        colors: ['#701A75', '#D946EF'],
        iconName: 'leaf-outline'
    },
    {
        id: '5',
        emoji: '💰',
        title: 'Financeiro no Azul',
        subtitle: 'Seu cofrinho inteligente',
        description: 'Acompanhe todo o dinheiro que entra nas vendas e o que sai nas compras. Mantenha as contas da fazenda sempre no azul! 🚀',
        colors: ['#065F46', '#059669'],
        iconName: 'cash-outline'
    }
];

export default function OnboardingTour({ visible, onClose }) {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const handleScroll = (event) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / width);
        if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
            setActiveIndex(index);
        }
    };

    const handleNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            const nextIndex = activeIndex + 1;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * width,
                animated: true
            });
            setActiveIndex(nextIndex);
        } else {
            onClose();
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <View style={styles.container}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={styles.scrollView}
                >
                    {SLIDES.map((slide, index) => (
                        <LinearGradient
                            key={slide.id}
                            colors={slide.colors}
                            style={styles.slide}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <SafeAreaView style={styles.safeArea}>
                                <View style={styles.slideHeader}>
                                    {index < SLIDES.length - 1 && (
                                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                                            <Text style={styles.skipText}>Pular Tour</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.contentContainer}>
                                    <View style={styles.emojiContainer}>
                                        <Text style={styles.emoji}>{slide.emoji}</Text>
                                    </View>
                                    
                                    <Text style={styles.title}>{slide.title}</Text>
                                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                                    
                                    <View style={styles.card}>
                                        <Ionicons name={slide.iconName} size={28} color="#10B981" style={styles.cardIcon} />
                                        <Text style={styles.description}>{slide.description}</Text>
                                    </View>
                                </View>

                                <View style={styles.slideFooter} />
                            </SafeAreaView>
                        </LinearGradient>
                    ))}
                </ScrollView>

                {/* Camada fixa sobre o carrossel (indicadores e botões) */}
                <View style={styles.footerControls}>
                    <View style={styles.indicatorContainer}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.indicator,
                                    activeIndex === index ? styles.indicatorActive : null
                                ]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[
                            styles.nextButton,
                            activeIndex === SLIDES.length - 1 ? styles.startBtn : null
                        ]} 
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>
                            {activeIndex === SLIDES.length - 1 ? 'COMEÇAR AGORA! 🚀' : 'AVANÇAR 👉'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    slide: {
        width: width,
        height: height,
        justifyContent: 'space-between',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    slideHeader: {
        height: 60,
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 30 : 10,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    skipText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    emoji: {
        fontSize: 75,
    },
    title: {
        color: '#FFF',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 25,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    cardIcon: {
        marginRight: 16,
    },
    description: {
        color: '#1F2937',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 22,
        flex: 1,
    },
    slideFooter: {
        height: 140, // Espaço para os controles fixos
    },
    footerControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: 'transparent',
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    indicatorActive: {
        width: 24,
        backgroundColor: '#FFF',
    },
    nextButton: {
        backgroundColor: '#FFF',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    startBtn: {
        backgroundColor: '#10B981',
    },
    nextButtonText: {
        color: '#1F2937',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
