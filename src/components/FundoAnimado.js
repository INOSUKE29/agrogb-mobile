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
  const translate = useSharedValue(-width);

  useEffect(() => {
    translate.value = withRepeat(
      withTiming(width * 1.5, {
        duration: 10000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value },
      { rotate: "-45deg" }, // Inclinação diagonal como na imagem
    ],
  }));

  return (
    <View style={styles.container}>
      {/* FUNDO BASE ULTRA DARK GREEN */}
      <LinearGradient
        colors={[
          "#010A05", // Quase preto esmeralda
          "#021810",
          "#010A05",
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* RAIO DE LUZ DIAGONAL DINÂMICO (Efeito Luxo) */}
      <Animated.View style={[styles.luzContainer, animatedStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(16, 185, 129, 0.08)", // Brilho Esmeralda Suave
              "rgba(255, 255, 255, 0.03)", // Brilho Pérola no centro do raio
              "rgba(16, 185, 129, 0.08)",
              "transparent",
            ]}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={styles.gradient}
          />
      </Animated.View>

      {/* OVERLAY DE TEXTURA (Opcional, mas traz luxo) */}
      <View style={styles.texture} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010A05'
  },
  luzContainer: {
    position: "absolute",
    width: width * 3,
    height: height * 4,
    top: -height,
    left: -width,
  },
  gradient: {
    flex: 1,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
  }
});
