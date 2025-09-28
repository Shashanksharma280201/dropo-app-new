import type { ImageSourcePropType } from "react-native";

const PRODUCT_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  // Coffee classics
  "classic-cappuccino": require("@/assets/images/coffee.png"),
  "classic-espresso": require("@/assets/images/coffee.png"),
  "silky-cappuccino": require("@/assets/images/coffee.png"),
  "vanilla-latte": require("@/assets/images/latte.png"),
  "hazelnut-mocha": require("@/assets/images/americano.png"),
  americano: require("@/assets/images/americano.png"),
  "iced-vanilla-latte": require("@/assets/images/latte.png"),
  "signature-frappe": require("@/assets/images/coldCoffee.png"),
  "cold-brew": require("@/assets/images/coldCoffee.png"),

  // Teas and warm beverages
  "herbal-green-tea": require("@/assets/images/coldCoffee.png"),
  "masala-chai": require("@/assets/images/americano.png"),
  "jasmine-green-tea": require("@/assets/images/coldCoffee.png"),
  "lemongrass-ginger-tea": require("@/assets/images/coldCoffee.png"),
  "earl-grey-supreme": require("@/assets/images/coldCoffee.png"),
  "hibiscus-iced-tea": require("@/assets/images/coldCoffee.png"),
  "mango-lassi-smoothie": require("@/assets/images/coldCoffee.png"),
  "berry-boost": require("@/assets/images/coldCoffee.png"),
  "citrus-cooler": require("@/assets/images/coldCoffee.png"),
  "coconut-water-cooler": require("@/assets/images/coldCoffee.png"),
  "peach-iced-tea-refresher": require("@/assets/images/coldCoffee.png"),
  "matcha-lemonade": require("@/assets/images/coldCoffee.png"),
  "pineapple-basil-cooler": require("@/assets/images/coldCoffee.png"),
  "salted-caramel-shake": require("@/assets/images/coldCoffee.png"),
  "watermelon-slush": require("@/assets/images/coldCoffee.png"),
  "dark-chocolate-shake": require("@/assets/images/coldCoffee.png"),
  "kokum-fizz": require("@/assets/images/coldCoffee.png"),

  // Snacks
  "veg-puff": require("@/assets/images/puff.png"),
  "veggie-sandwich": require("@/assets/images/pasta.png"),
  "sourdough-sandwich": require("@/assets/images/pasta.png"),
  "chicken-tikka-wrap": require("@/assets/images/pasta.png"),
  "paneer-bhurji-slider": require("@/assets/images/pasta.png"),
  "falafel-bowl": require("@/assets/images/pasta.png"),
  "chocolate-chunk-cookie": require("@/assets/images/croissant.png"),
  "herb-garlic-bread": require("@/assets/images/pasta.png"),
  "cheese-nachos": require("@/assets/images/fries.png"),
  "french-fries": require("@/assets/images/fries.png"),
  "almond-croissant": require("@/assets/images/croissant.png"),

  // Generic fallbacks
  coffee: require("@/assets/images/coffee.png"),
  latte: require("@/assets/images/latte.png"),
  vietnamese: require("@/assets/images/vietCoffee.png"),
  "viet-coffee": require("@/assets/images/vietCoffee.png"),
  "iced-coffee": require("@/assets/images/coldCoffee.png"),
  beverages: require("@/assets/images/coldCoffee.png"),
  tea: require("@/assets/images/coldCoffee.png"),
  snacks: require("@/assets/images/pasta.png"),
};

const DEFAULT_PRODUCT_IMAGE = require("@/assets/images/coffee.png");

type GetProductImageArgs = {
  slug?: string | null;
  imageUrl?: string | null;
  fallback?: ImageSourcePropType;
};

export const getProductImageSource = ({
  slug,
  imageUrl,
  fallback,
}: GetProductImageArgs): ImageSourcePropType => {
  if (slug) {
    const normalizedSlug = slug.toLowerCase();
    const mapped = PRODUCT_IMAGE_MAP[normalizedSlug];
    if (mapped) {
      return mapped;
    }
  }

  if (imageUrl) {
    return { uri: imageUrl };
  }

  if (fallback) {
    return fallback;
  }

  return DEFAULT_PRODUCT_IMAGE;
};

export const productImageMap = PRODUCT_IMAGE_MAP;
export const defaultProductImage = DEFAULT_PRODUCT_IMAGE;
