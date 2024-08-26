import { Container } from "@/components/Container";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function CircleGesturesLesson() {
  const xPosition = useSharedValue(0);
  const isInteracting = useSharedValue(false);
  const scale = useDerivedValue(() => {
    return withSpring(isInteracting.value ? 3 : 1);
  });

  const pan = Gesture.Pan()
    .onBegin(() => {
      isInteracting.value = true;
    })
    .onChange((event) => {
      xPosition.value += event.changeX;
    })
    .onEnd(() => {
      xPosition.value = withSpring(0);
    })
    .onFinalize(() => {
      isInteracting.value = false;
    });

  const knobAnimatedStyles = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        scale.value,
        [1, 2],
        [layout.knobSize / 2, 2],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: xPosition.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  return (
    <Container>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.knob, knobAnimatedStyles]}
            hitSlop={hitSlop}
          />
        </GestureDetector>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  knob: {
    width: layout.knobSize,
    height: layout.knobSize,
    borderRadius: layout.knobSize / 2,
    backgroundColor: "#fff",
    borderWidth: layout.knobSize / 2,
    borderColor: colorShades.purple.base,
    position: "absolute",
    left: -layout.knobSize / 2,
  },
});
