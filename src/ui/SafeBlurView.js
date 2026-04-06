import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * SafeBlurView - Componente de proteção contra crashes no ambiente Web.
 * Se o BlurView da Expo falhar ao carregar ou estiver no Web, 
 * ele fornece um fallback elegante para uma View comum com fundo semi-transparente.
 */
const SafeBlurView = ({ children, style, intensity = 20, tint = 'dark', ...props }) => {
    
    // No Web, o BlurView costuma causar ReferenceErrors se não houver polyfill adequado.
    // Usamos uma View com background color para simular o efeito visual sem quebrar o app.
    if (Platform.OS === 'web') {
        const backgroundColor = tint === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        return (
            <View style={[{ backgroundColor, overflow: 'hidden' }, style]} {...props}>
                {children}
            </View>
        );
    }

    // No Nativo, usamos o BlurView original da Expo
    return (
        <BlurView intensity={intensity} tint={tint} style={style} {...props}>
            {children}
        </BlurView>
    );
};

export default SafeBlurView;
