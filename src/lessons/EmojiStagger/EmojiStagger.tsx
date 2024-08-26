import { Platform, StyleSheet, Text, View } from "react-native";

import { useChat } from "@/components/ChatProvider";
import type { MessageType } from "@/lib/mock";
import { colors } from "@/lib/theme";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

interface Props {
  message: MessageType;
}

const emojis = ["👍", "👎", "😂", "😢", "😡", "😲"];

export function EmojiStaggerLesson({ message }: Props) {
  const { currentPopupId, setCurrentPopupId } = useChat();

  const pressed = useSharedValue(false);

  const longPress = Gesture.LongPress()
    .onStart(() => {
      pressed.value = true;
      runOnJS(setCurrentPopupId)(message.id);
    })
    .onFinalize(() => {
      pressed.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(pressed.value ? 0.92 : 1),
        },
      ],
    };
  });

  return (
    <View>
      <GestureDetector gesture={longPress}>
        <Animated.View
          style={[
            styles.message,
            message.from === "me" ? styles.messageMe : styles.messageThem,
            animatedStyles,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.from === "me"
                ? styles.messageTextMe
                : styles.messageTextThem,
            ]}
          >
            {message.message}
          </Text>
        </Animated.View>
      </GestureDetector>

      {currentPopupId === message.id && (
        <Animated.View
          style={styles.emojiPopupContainer}
          entering={FadeInRight}
        >
          <Animated.View
            style={[styles.emojiPopupWrapper, styles.shadow]}
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown}
          >
            <Animated.View style={styles.emojiPopup} entering={ZoomIn}>
              {emojis.map((emoji, idx) => (
                <Animated.Text
                  style={styles.emoji}
                  key={emoji}
                  entering={ZoomIn.delay(33 * idx + 100)
                    .springify()
                    .stiffness(200)
                    .damping(10)}
                >
                  {emoji}
                </Animated.Text>
              ))}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    maxWidth: "80%",
    marginVertical: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: "white",
  },
  messageTextThem: {
    color: "black",
  },
  messageMe: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
  },
  messageThem: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emojiPopupContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emojiPopupWrapper: {
    top: -45,
    height: 50,
    backgroundColor: colors.overlay,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  emojiPopup: {
    flexDirection: "row",
    gap: 8,
  },
  emoji: {
    fontSize: 36,
    marginTop: Platform.OS === "ios" ? 2 : -1,
  },
});
