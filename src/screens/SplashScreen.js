import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ImageBackground, 
    Image, 
    Dimensions, 
    Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        // Simula carregamento de recursos/sessão
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3500); // 3.5 segundos para o efeito premium

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" transparent />
            <ImageBackground 
                source={require('../../assets/splash_premium.jpg')} 
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <Animatable.View 
                            animation="fadeInDown" 
                            duration={1500} 
                            style={styles.logoContainer}
                        >
                            <View style={styles.logoCircle}>
                                <Image 
                                    source={require('../../assets/icon.png')} 
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </Animatable.View>

                        <Animatable.View 
                            animation="fadeInUp" 
                            duration={1500} 
                            delay={500}
                            style={styles.textContainer}
                        >
                            <Text style={styles.title}>AgroGB</Text>
                            <Text style={styles.subtitle}>ENTERPRISE DIAMOND PRO</Text>
                            
                            <View style={styles.versionBadge}>
                                <Text style={styles.versionText}>v7.0 STABLE</Text>
                            </View>
                        </Animatable.View>

                        <Animatable.View 
                            animation="fadeIn" 
                            duration={1000} 
                            delay={2000}
                            style={styles.footer}
                        >
                            <Text style={styles.footerText}>SISTEMA DE GESTÃO RURAL INTELIGENTE</Text>
                            <View style={styles.loaderBarContainer}>
                                <Animatable.View 
                                    animation={{
                                        from: { width: 0 },
                                        to: { width: '100%' }
                                    }}
                                    duration={3000}
                                    easing="ease-in-out"
                                    style={styles.loaderBar}
                                />
                            </View>
                        </Animatable.View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
        width: width,
        height: height,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        marginBottom: 30,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    logo: {
        width: 80,
        height: 80,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
        letterSpacing: 3,
        marginTop: 5,
    },
    versionBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    versionText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        marginBottom: 15,
    },
    loaderBarContainer: {
        width: '80%',
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loaderBar: {
        height: '100%',
        backgroundColor: '#10B981',
    }
});
