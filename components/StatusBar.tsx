import { COLORS } from "@/constants/Colors";
import { StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ColoredStatusBar = ({
  color = COLORS.primary100,
}: {
  color?: string;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar translucent />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: color,
          zIndex: 1,
        }}
      />
    </>
  );
};
