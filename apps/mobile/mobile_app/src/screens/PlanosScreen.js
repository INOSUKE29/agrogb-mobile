import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PlanosScreen({ navigation }) {
    const { colors, theme } = useTheme();
    const isDark = theme.id === 'dark';

    const handleSubscribe = () => {
        Alert.alert(
            "Em Desenvolvimento",
            "A integração com gateway de pagamento (Stripe/MercadoPago) será ativada na versão de Produção."
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Planos AgroGB</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
                        Leve sua fazenda para o <Text style={{ color: colors.primary }}>Próximo Nível</Text>
                    </Text>
                    <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                        O AgroGB Free já te ajuda no campo. O AgroGB PRO transforma sua safra em um negócio escalável.
                    </Text>
                </View>

                {/* Plano Free */}
                <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={styles.planHeader}>
                        <Text style={[styles.planName, { color: colors.textSecondary }]}>Básico (Atual)</Text>
                        <Text style={[styles.planPrice, { color: colors.textPrimary }]}>R$ 0</Text>
                        <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>/ para sempre</Text>
                    </View>
                    <View style={styles.featuresList}>
                        <FeatureItem text="Caderno Agrícola Local" color={colors.textSecondary} icon="checkmark" iconColor={colors.textSecondary} />
                        <FeatureItem text="Clima em Tempo Real" color={colors.textSecondary} icon="checkmark" iconColor={colors.textSecondary} />
                        <FeatureItem text="Controle de Estoque Offline" color={colors.textSecondary} icon="checkmark" iconColor={colors.textSecondary} />
                        <FeatureItem text="Sincronização em Nuvem" color={colors.textSecondary} icon="close" iconColor="#EF4444" disabled />
                        <FeatureItem text="Acesso ao Painel Desktop" color={colors.textSecondary} icon="close" iconColor="#EF4444" disabled />
                    </View>
                </View>

                {/* Plano PRO */}
                <LinearGradient
                    colors={[colors.primary || '#10B981', '#047857']}
                    style={styles.proCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>MAIS ESCOLHIDO</Text>
                    </View>
                    
                    <View style={styles.planHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="star" size={24} color="#FBBF24" style={{ marginRight: 8 }} />
                            <Text style={[styles.planName, { color: '#FFF' }]}>AgroGB PRO</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10 }}>
                            <Text style={[styles.planPrice, { color: '#FFF', fontSize: 36 }]}>R$ 49</Text>
                            <Text style={[styles.planPeriod, { color: 'rgba(255,255,255,0.8)' }]}>/ mês</Text>
                        </View>
                    </View>
                    
                    <View style={styles.featuresList}>
                        <FeatureItem text="Tudo do plano Básico" color="#FFF" icon="checkmark-circle" iconColor="#FBBF24" />
                        <FeatureItem text="Sincronização 100% em Nuvem" color="#FFF" icon="checkmark-circle" iconColor="#FBBF24" />
                        <FeatureItem text="Módulo CRM & Vendas (Funil)" color="#FFF" icon="checkmark-circle" iconColor="#FBBF24" />
                        <FeatureItem text="Acesso Total ao App Desktop" color="#FFF" icon="checkmark-circle" iconColor="#FBBF24" />
                        <FeatureItem text="Exportação de Relatórios PDF" color="#FFF" icon="checkmark-circle" iconColor="#FBBF24" />
                    </View>

                    <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
                        <Text style={[styles.subscribeBtnText, { color: colors.primary || '#10B981' }]}>Assinar AgroGB PRO</Text>
                    </TouchableOpacity>
                </LinearGradient>
                
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                    Pagamento seguro. Cancele quando quiser diretamente pelas configurações do aplicativo ou pela sua loja de aplicativos.
                </Text>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const FeatureItem = ({ text, color, icon, iconColor, disabled }) => (
    <View style={[styles.featureItem, disabled && { opacity: 0.5 }]}>
        <Ionicons name={icon} size={20} color={iconColor} style={{ marginRight: 12 }} />
        <Text style={[styles.featureText, { color: color }]}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    headerTextContainer: {
        marginBottom: 30,
        marginTop: 10,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 10,
        lineHeight: 34,
    },
    subTitle: {
        fontSize: 15,
        lineHeight: 22,
    },
    planCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
    },
    proCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: '#FBBF24',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 3,
    },
    popularText: {
        color: '#78350F',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    planHeader: {
        marginBottom: 20,
    },
    planName: {
        fontSize: 22,
        fontWeight: '800',
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 5,
    },
    planPeriod: {
        fontSize: 14,
        fontWeight: '500',
    },
    featuresList: {
        marginTop: 10,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 15,
        fontWeight: '500',
    },
    subscribeBtn: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 30,
    },
    subscribeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsText: {
        textAlign: 'center',
        fontSize: 11,
        marginTop: 10,
        paddingHorizontal: 20,
    }
});
