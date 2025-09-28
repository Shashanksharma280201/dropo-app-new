import { useMemo } from "react";
import { Dimensions, ImageSourcePropType, Pressable, Text, View } from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { router } from "expo-router";

import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import { getProductImageSource } from "@/lib/productImages";
import type { ProductListItem } from "@/lib/types";

const Coffee = require("@/assets/images/coffee.png");
const Latte = require("@/assets/images/latte.png");
const Americano = require("@/assets/images/americano.png");
const Vietnamese = require("@/assets/images/vietCoffee.png");
const IceCoffee = require("@/assets/images/coldCoffee.png");

const fallbackImages = [Coffee, Latte, Americano, Vietnamese, IceCoffee];

const { width: windowWidth } = Dimensions.get("window");
const ITEM_WIDTH = windowWidth * 0.5;
const ITEM_SPACING = 0;
const SIDE_PADDING = (windowWidth - ITEM_WIDTH) / 2;

type Palette = {
  primary400: string;
};

interface ProductListProps {
  products: ProductListItem[];
  palette: Palette;
}

export const ProductList = ({ products, palette }: ProductListProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const data = useMemo(() => {
    if (products.length) return products;
    return fallbackImages.map((_, index) => ({
      id: `fallback-${index}`,
      slug: "coffee",
      name: "Coffee",
      imageUrl: "",
      price: 120,
    }));
  }, [products]);

  return (
    <Animated.ScrollView
      horizontal
      ref={scrollRef}
      snapToInterval={ITEM_WIDTH + ITEM_SPACING}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: SIDE_PADDING,
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      scrollEventThrottle={16}
    >
      {data.map((item, index) => (
        <ProductCard
          key={item.id}
          index={index}
          item={item}
          palette={palette}
          scrollOffset={scrollOffset}
        />
      ))}
    </Animated.ScrollView>
  );
};

const ProductCard = ({
  index,
  item,
  palette,
  scrollOffset,
}: {
  index: number;
  item: ProductListItem;
  palette: Palette;
  scrollOffset: SharedValue<number>;
}) => {
  const inputRange = [
    (ITEM_WIDTH + ITEM_SPACING) * (index - 1),
    (ITEM_WIDTH + ITEM_SPACING) * index,
    (ITEM_WIDTH + ITEM_SPACING) * (index + 1),
  ];

  const animatedImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollOffset.value, inputRange, [0, -100, 0]);
    const scale = interpolate(scrollOffset.value, inputRange, [1, 1.2, 1]);
    const opacity = interpolate(scrollOffset.value, inputRange, [0.5, 1, 0.5]);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollOffset.value, inputRange, [200, 0, 200]);
    const opacity = interpolate(scrollOffset.value, inputRange, [0, 1, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  }, []);

  const handlePress = () => {
    if (!item.slug) return;
    router.push({ pathname: "/(protected)/product/[slug]", params: { slug: item.slug } });
  };

  const fallbackImage = fallbackImages[index % fallbackImages.length];

  const source: ImageSourcePropType = getProductImageSource({
    slug: item.slug,
    imageUrl: item.imageUrl,
    fallback: fallbackImage,
  });

  return (
    <Pressable
      onPress={handlePress}
      style={{
        gap: SIZES.padding.sm,
        height: ITEM_WIDTH * 1.4 + 150,
        justifyContent: "space-between",
      }}
    >
      <Animated.Text
        style={[
          {
            alignSelf: "center",
            fontSize: SIZES.font.xxl,
            fontFamily: "Lato",
            fontWeight: "600",
            color: palette.primary400,
          },
          animatedTextStyle,
        ]}
        numberOfLines={1}
      >
        {item.name || "Coffee"}
      </Animated.Text>
      <View
        style={{
          width: ITEM_WIDTH,
          marginHorizontal: ITEM_SPACING / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.Image
          source={source}
          style={[
            {
              width: ITEM_WIDTH,
              height: ITEM_WIDTH * 1.4,
            },
            animatedImageStyle,
          ]}
          resizeMode="contain"
        />
        {typeof item.price === "number" && !Number.isNaN(item.price) ? (
          <Text
            style={{
              fontFamily: "Lato",
              fontSize: SIZES.font.lg,
              color: COLORS.primary400,
              marginTop: SIZES.padding.sm,
            }}
          >
            ₹{Number(item.price).toFixed(0)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};
