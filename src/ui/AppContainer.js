import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK } from '../styles/darkTheme';

export default function AppContainer({ children, style }) {
    return (
        <LinearGradient
            colors={DARK.bgGradient}
            style={[styles.root, style]}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
