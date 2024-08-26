import { AnimatedText } from "@/components/AnimatedText";
import { Container } from "@/components/Container";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function BalloonSliderLesson() {
  const aRef = useAnimatedRef<View>();
  const x = useSharedValue(0);
  const xBalloonTop = useDerivedValue(() => {
    return withSpring(x.value);
  });
  const progress = useSharedValue(0);
  const isInteracting = useSharedValue(false);
  const scale = useDerivedValue(() => {
    return withSpring(isInteracting.value ? 2 : 1);
  });
  const balloonScale = useDerivedValue(() => {
    return interpolate(scale.value, [1, 2], [0, 1], Extrapolation.CLAMP);
  });

  const pan = Gesture.Pan()
    .onBegin(() => {
      isInteracting.value = true;
    })
    .onChange((event) => {
      const size = measure(aRef);

      x.value = clamp(x.value + event.changeX, 0, size.width);
      progress.value = clamp((x.value * 100) / size.width, 0, 100);
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
          translateX: x.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const balloonAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: balloonScale.value,
      transform: [
        {
          translateX: xBalloonTop.value,
        },
        {
          scale: balloonScale.value,
        },
        {
          translateY: interpolate(
            balloonScale.value,
            [0, 1],
            [0, -layout.indicatorSize]
          ),
        },
        {
          rotate: `${Math.atan2(
            xBalloonTop.value - x.value,
            (layout.indicatorSize * 3) / 2
          )}rad`,
        },
      ],
    };
  });

  return (
    <Container>
      <GestureDetector gesture={pan}>
        <View style={styles.slider} hitSlop={hitSlop} ref={aRef}>
          <Animated.View style={[styles.balloon, balloonAnimatedStyles]}>
            <View style={styles.textContainer}>
              <AnimatedText
                style={{ color: "white", fontWeight: "600" }}
                text={progress}
              />
            </View>
          </Animated.View>
          <Animated.View style={[styles.progress, { width: x }]} />
          <Animated.View style={[styles.knob, knobAnimatedStyles]} />
        </View>
      </GestureDetector>
    </Container>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    width: 40,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorShades.purple.base,
    position: "absolute",
    top: -layout.knobSize,
  },
  balloon: {
    alignItems: "center",
    justifyContent: "center",
    width: 4,
    height: layout.indicatorSize,
    bottom: -layout.knobSize / 2,
    borderRadius: 2,
    backgroundColor: colorShades.purple.base,
    position: "absolute",
  },
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
  slider: {
    width: "80%",
    backgroundColor: colorShades.purple.light,
    height: 5,
    justifyContent: "center",
  },
  progress: {
    height: 5,
    backgroundColor: colorShades.purple.dark,
    position: "absolute",
  },
});
