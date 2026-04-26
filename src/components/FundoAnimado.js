import React, { useEffect } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function FundoAnimado({ children }) {
  const glow1 = useSharedValue(0.4);
  const glow2 = useSharedValue(0.2);

  useEffect(() => {
    glow1.value = withRepeat(withTiming(0.8, { duration: 6000, easing: Easing.inOut(Easing.ease) }), -1, true);
    glow2.value = withRepeat(withTiming(0.5, { duration: 9000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedGlow1 = useAnimatedStyle(() => ({ opacity: glow1.value }));
  const animatedGlow2 = useAnimatedStyle(() => ({ opacity: glow2.value }));

  return (
    <View style={styles.container}>
      {/* FUNDO BASE DARK (Como na imagem) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111312' }]} />

      {/* GRANDE EXPLOSÃO DE LUZ ESMERALDA NO CANTO SUPERIOR DIREITO */}
      <Animated.View style={[styles.glowTop, animatedGlow1]}>
        <LinearGradient
          colors={['rgba(0, 255, 157, 0.35)', 'transparent']}
          style={styles.full}
        />
      </Animated.View>

      {/* LUZ ESMERALDA NO CANTO INFERIOR ESQUERDO */}
      <Animated.View style={[styles.glowBottom, animatedGlow2]}>
        <LinearGradient
          colors={['rgba(0, 255, 157, 0.2)', 'transparent']}
          style={styles.full}
        />
      </Animated.View>

      {/* RAIO DE LUZ DIAGONAL QUE CRUZA A TELA */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 255, 157, 0.05)', 'transparent']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111312'
  },
  full: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -height * 0.3,
    right: -width * 0.5,
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -height * 0.2,
    left: -width * 0.4,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
  }
});
