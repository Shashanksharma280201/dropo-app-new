import { iconRegistry } from "@/constants/icons";
import { Image, ImageProps } from "react-native";

type IconType = keyof typeof iconRegistry;
type IconProps = { icon: IconType; size: number } & ImageProps;

export const Icon = (props: IconProps) => {
  const { icon, size, style, ...rest } = props;
  return (
    <Image
      {...rest}
      style={[style, { width: size, height: size }]}
      source={iconRegistry[icon]}
    />
  );
};
