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
import { useTheme } from "../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function FundoAnimado({ children }) {
  const { isDarkMode } = useTheme();
  const intensity = useSharedValue(0.5);

  useEffect(() => {
    intensity.value = withRepeat(
      withTiming(0.8, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: intensity.value,
  }));

  // TEMA CLARO (Verde suave no topo)
  if (!isDarkMode) {
    return (
      <View style={styles.containerLight}>
        <LinearGradient
          colors={["#0D5C3E", "#15803D", "#F8FAF8"]} // Degradê verde para branco
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
        {children}
      </View>
    );
  }

  // TEMA ESCURO (Dark Emerald Deep)
  return (
    <View style={styles.containerDark}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0D0D0D" }]} />
      <Animated.View style={[styles.glow, animatedGlow]}>
        <LinearGradient
          colors={["rgba(0, 255, 157, 0.15)", "transparent"]}
          style={{ flex: 1 }}
        />
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  containerLight: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },
  containerDark: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
  },
  glow: {
    position: "absolute",
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
});
