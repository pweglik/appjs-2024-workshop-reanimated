import { ContactsListHeader } from "@/components/ContactsListHeader";
import { ContactsListItem } from "@/components/ContactsListItem";
import { Container } from "@/components/Container";
import { alphabet, contacts } from "@/lib/mock";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  measure,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import sectionListGetItemLayout from "react-native-section-list-get-item-layout";

type AlphabetLetterProps = {
  index: number;
  letter: string;
  scrollableIndex: SharedValue<number>;
};

const AlphabetLetter = ({
  index,
  letter,
  scrollableIndex,
}: AlphabetLetterProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollableIndex.value,
        [index - 2, index, index + 2],
        [0.2, 1, 0.2],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            scrollableIndex.value,
            [index - 2, index, index + 2],
            [1, 1.5, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
        animatedStyle,
      ]}
    >
      <Animated.Text
        style={[
          {
            position: "absolute",
            fontFamily: "Menlo",
            left: -20,
            fontWeight: "900",
          },
        ]}
      >
        {letter.toUpperCase()}
      </Animated.Text>
    </Animated.View>
  );
};

export function ScrollAnimationLesson() {
  const y = useSharedValue(0);
  const isInteracting = useSharedValue(false);
  const knobScale = useDerivedValue(() => {
    return withSpring(isInteracting.value ? 1 : 0);
  });

  const alphabetRef = useAnimatedRef<View>();
  // float value (used for animation)
  const scrollableIndex = useSharedValue(0);
  // rounded value (used to snap to position)
  const activeScrollIndex = useSharedValue(0);

  const sectionListRef = useRef<SectionList>();

  const getItemLayout = useMemo(() => {
    return sectionListGetItemLayout({
      getItemHeight: () => layout.contactListItemHeight,
      getSectionHeaderHeight: () => layout.contactListSectionHeaderHeight,
    });
  }, []);

  const snapIndicatorTo = (index: number) => {
    runOnUI(() => {
      if (scrollableIndex.value === index || isInteracting.value) {
        return;
      }

      const alphabetLayout = measure(alphabetRef);
      if (!alphabetLayout) {
        return;
      }
      const snapBy =
        (alphabetLayout.height - layout.knobSize) / (alphabet.length - 1);
      const snapTo = index * snapBy;
      y.value = withTiming(snapTo);
      scrollableIndex.value = withTiming(index);
    })();
  };

  const scrollToLocation = (index: number) => {
    sectionListRef.current?.scrollToLocation({
      animated: false,
      itemIndex: 0,
      sectionIndex: index,
    });
  };

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onBegin(() => {
      isInteracting.value = true;
    })
    .onChange((ev) => {
      const alphabetLayout = measure(alphabetRef);
      if (!alphabetLayout) {
        return;
      }
      y.value = clamp(
        (y.value += ev.changeY),
        alphabetLayout.y, // take into account the knob size
        alphabetLayout.height - layout.knobSize
      );

      // This is snapTo by the same interval. This will snap to the nearest
      // letter based on the knob position.
      const snapBy =
        (alphabetLayout.height - layout.knobSize) / (alphabet.length - 1);

      scrollableIndex.value = y.value / snapBy;
      const snapToIndex = Math.round(y.value / snapBy);

      // Ensure that we don't trigger scroll to the same index.
      if (snapToIndex === activeScrollIndex.value) {
        return;
      }

      activeScrollIndex.value = snapToIndex;

      runOnJS(scrollToLocation)(snapToIndex);
    })
    .onEnd(() => {
      runOnJS(snapIndicatorTo)(activeScrollIndex.value);
    })
    .onFinalize(() => {
      isInteracting.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        knobScale.value,
        [0, 1],
        [layout.knobSize / 2, 2],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: y.value,
        },
        {
          scale: knobScale.value + 1,
        },
      ],
    };
  });
  // By now, the knob will change scroll inside the SectionList (we can call this Alphabet -> SectionList) but we would like to control the knob position or active letter while scrolling inside SectionList (SectionList → Alphabet). To do so, we’re going to hook to the onViewableItemsChange prop exposed by SectionList (Check onViewableItemsChange method signature.) and get the middle element that visible on the screen, get his section index and use snapIndicatorTo to animate the knob new position.

  // ⚠️ Hint: The section index might be missing
  return (
    <Container centered={false}>
      <View style={{ flex: 1 }}>
        <SectionList
          ref={sectionListRef}
          contentContainerStyle={{ paddingHorizontal: layout.spacing * 2 }}
          stickySectionHeadersEnabled={false}
          // @ts-ignore
          getItemLayout={getItemLayout}
          sections={contacts}
          renderSectionHeader={({ section: { title } }) => {
            return <ContactsListHeader title={title} />;
          }}
          renderItem={({ item }) => {
            return <ContactsListItem item={item} />;
          }}
          onViewableItemsChanged={({ changed, viewableItems }) => {
            const middleItem =
              viewableItems[Math.floor(viewableItems.length / 2)];
            const section = middleItem?.section;
            if (!section) {
              return;
            }
            snapIndicatorTo(section.index);
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 0,
            top: layout.indicatorSize,
            bottom: layout.indicatorSize,
          }}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.knob, animatedStyle]}
              hitSlop={hitSlop}
            />
          </GestureDetector>
          <View
            style={{
              transform: [{ translateX: -layout.indicatorSize / 4 }],
              flex: 1,
              width: 20,
              justifyContent: "space-around",
            }}
            pointerEvents="box-none"
            ref={alphabetRef}
          >
            {[...Array(alphabet.length).keys()].map((i) => {
              return (
                <AlphabetLetter
                  key={i}
                  letter={alphabet.charAt(i)}
                  index={i}
                  scrollableIndex={scrollableIndex}
                />
              );
            })}
          </View>
        </View>
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
