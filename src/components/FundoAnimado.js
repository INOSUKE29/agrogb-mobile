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
      withTiming(width, {
        duration: 8000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value },
      { rotate: "35deg" },
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "#02100C", // Preto Esmeralda Profundo
          "#031F14",
          "#052E1E",
          "#031F14",
          "#02100C",
        ]}
        style={StyleSheet.absoluteFill}
      >
        {/* Faixa animada de brilho suave */}
        <Animated.View style={[styles.luz, animatedStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255,255,255,0.03)",
              "transparent",
            ]}
            style={styles.gradient}
          />
        </Animated.View>

        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  luz: {
    position: "absolute",
    width: width * 2,
    height: height * 2,
    top: -height / 2,
    left: -width / 2,
  },
  gradient: {
    flex: 1,
  },
});
