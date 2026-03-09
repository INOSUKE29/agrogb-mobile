import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

let toastRef = null;

export const showToast = (message) => { toastRef?.show(message); };

export default function Toast() {
    const opacity = useRef(new Animated.Value(0)).current;
    const [msg, setMsg] = React.useState('');

    useEffect(() => { toastRef = { show: (m) => { setMsg(m); Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.delay(2000), Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })]).start(); } }; }, []);

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <Text style={styles.text}>{msg}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 25, zIndex: 9999 },
    text: { color: '#FFF', fontWeight: 'bold' }
});
