import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Icon } from "@/components/Icon";
import { ProductList } from "@/components/ProductList";
import { ColoredStatusBar } from "@/components/StatusBar";
import { COLORS } from "@/constants/Colors";
import { iconRegistry } from "@/constants/icons";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockCategories, getMockProducts } from "@/lib/mockData";
import type { Category, ProductListItem } from "@/lib/types";
import { useUserStore } from "@/stores";

const { height } = Dimensions.get("window");

type Palette = Category["palette"];

type ProductApiResponse = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  variants: { id: string; price: string }[];
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const name = useUserStore((state) => state.name ?? "there");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Category[]>("/catalog/categories");
        if (!data?.length) {
          throw new Error("Empty categories");
        }
        return data;
      } catch {
        return getMockCategories();
      }
    },
    staleTime: 5 * 60 * 1000,
    initialData: getMockCategories(),
  });

  useEffect(() => {
    if (!selectedCategory && categoriesQuery.data?.length) {
      setSelectedCategory(categoriesQuery.data[0].slug);
    }
  }, [categoriesQuery.data, selectedCategory]);

  const productsQuery = useQuery<ProductListItem[]>({
    queryKey: ["products", selectedCategory],
    enabled: Boolean(selectedCategory),
    queryFn: async () => {
      if (!selectedCategory) {
        return [] as ProductListItem[];
      }
      try {
        const { data } = await api.get<ProductApiResponse[]>("/catalog/products", {
          params: { category: selectedCategory },
        });
        return (
          data?.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.imageUrl,
            price: Number(product.variants[0]?.price ?? 0),
          })) ?? []
        );
      } catch {
        return getMockProducts(selectedCategory ?? undefined);
      }
    },
  });

  const palette: Palette = useMemo(() => {
    const selected = categoriesQuery.data?.find((item) => item.slug === selectedCategory);
    return {
      primary100: selected?.palette?.primary100 ?? COLORS.primary100,
      primary200: selected?.palette?.primary200 ?? COLORS.primary200,
      primary300: selected?.palette?.primary300 ?? COLORS.primary300,
      primary400: selected?.palette?.primary400 ?? COLORS.primary400,
      primary500: selected?.palette?.primary500 ?? COLORS.primary500,
    };
  }, [categoriesQuery.data, selectedCategory]);

  const products: ProductListItem[] = useMemo(() => {
    if (productsQuery.data?.length) {
      return productsQuery.data;
    }
    return getMockProducts(selectedCategory ?? undefined);
  }, [productsQuery.data, selectedCategory]);

  return (
    <>
      <ColoredStatusBar />
      <View
        style={[
          styles.container,
          {
            paddingVertical: insets.top,
            backgroundColor: palette.primary100,
          },
        ]}
      >
        <View>
          <Header palette={palette} />
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingPrimary, { color: palette.primary300 }]}>Good morning</Text>
            <Text style={[styles.greetingSecondary, { color: palette.primary400 }]}>{name}</Text>
          </View>
        </View>
        <BottomCircle palette={palette} />
        <Categories
          categories={categoriesQuery.data ?? []}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          palette={palette}
        />
        <View style={styles.productSection}>
          <ProductList products={products} palette={palette} />
          <Pressable style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: palette.primary500 }]}>View all</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const Header = ({ palette }: { palette: Palette }) => (
  <View style={styles.header}>
    <View style={styles.headerLocation}>
      <Icon icon="location" size={16} />
      <Text style={[styles.headerText, { color: palette.primary300 }]}>
        Delivering to {" "}
        <Text style={[styles.headerAccent, { color: palette.primary400 }]}>Office</Text>
      </Text>
    </View>
    <View style={styles.headerActions}>
      <Pressable
        onPress={() => router.push("/(protected)/profile")}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? palette.primary300 : palette.primary200,
          },
        ]}
      >
        <Icon icon="person" size={24} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/(protected)/cart")}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? palette.primary300 : palette.primary200,
          },
        ]}
      >
        <Icon icon="bag" size={24} />
      </Pressable>
    </View>
  </View>
);

const BottomCircle = ({ palette }: { palette: Palette }) => (
  <>
    <View
      style={[
        styles.circle,
        {
          bottom: "-10%",
          height: height * 0.7,
          width: height * 0.7,
          backgroundColor: palette.primary200,
          transform: [{ translateX: "-50%" }],
        },
      ]}
    />
    <View
      style={[
        styles.circle,
        {
          bottom: "-12%",
          height: height * 0.6,
          width: height * 0.6,
          backgroundColor: palette.primary300,
          transform: [{ translateX: "-50%" }],
        },
      ]}
    />
  </>
);

const Categories = ({
  categories,
  selectedCategory,
  onSelectCategory,
  palette,
}: {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string) => void;
  palette: Palette;
}) => {
  const items = categories.slice(0, 4);
  return (
    <View style={styles.categoriesRow}>
      {items.map((category, index) => (
        <CategoryIcon
          key={category.id ?? index}
          icon={getIconForCategory(category.slug)}
          active={selectedCategory === category.slug}
          onPress={() => onSelectCategory(category.slug)}
          palette={palette}
          style={index === 0 || index === items.length - 1 ? styles.categoryTall : undefined}
        />
      ))}
      {!items.length &&
        defaultCategoryIcons.map((icon, index) => (
          <CategoryIcon
            key={`fallback-${icon}-${index}`}
            icon={icon}
            active={index === 0}
            onPress={() => {}}
            palette={palette}
            style={index === 0 || index === defaultCategoryIcons.length - 1 ? styles.categoryTall : undefined}
          />
        ))}
    </View>
  );
};

const defaultCategoryIcons: (keyof typeof iconRegistry)[] = [
  "coffee",
  "tea",
  "juice",
  "burger",
];

const categoryIconFallback = "coffee" as keyof typeof iconRegistry;

function getIconForCategory(slug: string): keyof typeof iconRegistry {
  if (slug in iconRegistry) {
    return slug as keyof typeof iconRegistry;
  }
  if (slug.includes("tea")) return "tea";
  if (slug.includes("coffee")) return "coffee";
  if (slug.includes("juice") || slug.includes("beverage")) return "juice";
  if (slug.includes("snack") || slug.includes("burger")) return "burger";
  return categoryIconFallback;
}

const CategoryIcon = ({
  icon,
  onPress,
  palette,
  active,
  style,
}: {
  icon: keyof typeof iconRegistry;
  onPress: () => void;
  palette: Palette;
  active: boolean;
  style?: ViewStyle;
}) => (
  <View style={style}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: active
            ? palette.primary200
            : pressed
            ? `${palette.primary300}66`
            : palette.primary200,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Icon icon={icon} size={32} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding.lg,
    alignItems: "center",
  },
  headerLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: SIZES.font.lg,
    fontFamily: "Lato",
    fontWeight: "400",
  },
  headerAccent: {
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    gap: SIZES.padding.md,
  },
  iconButton: {
    borderRadius: SIZES.radius.full,
    padding: SIZES.padding.md,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingContainer: {
    alignItems: "center",
    padding: SIZES.padding.xxl + 12,
  },
  greetingPrimary: {
    fontSize: SIZES.font.xl,
    fontFamily: "Lato",
  },
  greetingSecondary: {
    fontSize: SIZES.font.xl,
    fontFamily: "Lato",
    fontWeight: "600",
  },
  circle: {
    position: "absolute",
    left: "50%",
    borderRadius: SIZES.radius.full,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding.xxl,
    alignItems: "flex-end",
    minHeight: 32 * 3 - 8,
  },
  categoryTall: {
    justifyContent: "flex-end",
  },
  productSection: {
    paddingBottom: SIZES.padding.lg,
  },
  viewAllButton: {
    alignSelf: "center",
    paddingTop: SIZES.padding.lg,
  },
  viewAllText: {
    fontSize: SIZES.font.xl,
    fontFamily: "Lato",
  },
});
