import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native-gesture-handler";

import { Icon } from "@/components/Icon";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockProductDetail } from "@/lib/mockData";
import { getProductImageSource } from "@/lib/productImages";
import { calculateCartSummary, createEmptyCartSummary } from "@/lib/cartUtils";
import type { CartItem, CartResponse, ProductAddonGroup, ProductDetail, ProductVariant } from "@/lib/types";

const { height: ScreenHeight } = Dimensions.get("window");

const ProductDetails = () => {
  const insets = useSafeAreaInsets();
  const { slug: rawSlug } = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const posY = useSharedValue(70);
  const opacity = useSharedValue(0);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});

  const productQuery = useQuery<ProductDetail>({
    queryKey: ["product", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) {
        throw new Error("Missing product");
      }
      try {
        const { data } = await api.get<ProductDetail>(`/catalog/products/${slug}`);
        return data;
      } catch {
        const fallback = getMockProductDetail(slug);
        if (!fallback) {
          throw new Error("Product not found");
        }
        return fallback;
      }
    },
  });

  useEffect(() => {
    posY.value = withTiming(7, {
      duration: 1000,
    });
    opacity.value = withTiming(1, {
      duration: 1000,
    });
  }, [opacity, posY]);

  useEffect(() => {
    setSelectedVariantId(null);
    setSelectedAddons({});
  }, [slug]);

  const product = productQuery.data;

  useEffect(() => {
    if (!product) return;

    const defaultVariant =
      product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;
    setSelectedVariantId(defaultVariant?.id ?? null);

    const defaults: Record<string, string[]> = {};
    product.addonGroups.forEach((group) => {
      const defaultOptions = group.options
        .filter((option) => option.isDefault)
        .map((option) => option.id);
      if (defaultOptions.length) {
        defaults[group.id] = defaultOptions;
      }
    });
    setSelectedAddons(defaults);
  }, [product]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const queryClient = useQueryClient();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={1}
        disappearsOnIndex={-1}
        appearsOnIndex={2}
      />
    ),
    []
  );

  const addToCart = useMutation({
    mutationFn: async (): Promise<CartItem> => {
      if (!product) {
        throw new Error("Missing product");
      }
      if (!selectedVariantId) {
        throw new Error("Select a variant");
      }

      const variant =
        product.variants.find((item) => item.id === selectedVariantId) ?? product.variants[0];
      if (!variant) {
        throw new Error("Variant unavailable");
      }

      const selectedAddonItems = product.addonGroups.flatMap((group) => {
        const selections = selectedAddons[group.id] ?? [];
        return group.options
          .filter((option) => selections.includes(option.id))
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: Number(option.priceDelta ?? 0),
            group: { id: group.id, name: group.name },
          }));
      });

      const unitPrice = getVariantPrice(product, variant.id) + getAddonPrice(product, selectedAddons);

      const cartItem: CartItem = {
        id: `local-cart-${Date.now()}`,
        quantity: 1,
        notes: null,
        unitPrice,
        lineTotal: unitPrice,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
        },
        variant: {
          id: variant.id,
          name: variant.name,
          price: Number(variant.price ?? 0),
        },
        addons: selectedAddonItems,
      };

      try {
        await api.post("/cart", {
          productId: product.id,
          variantId: variant.id,
          addons: selectedAddonItems.map((addon) => addon.id),
        });
      } catch {
        // fall back to local cart update if the API is unavailable
      }

      return cartItem;
    },
    onSuccess: (cartItem) => {
      queryClient.setQueryData<CartResponse>(["cart"], (previous) => {
        const base = previous ?? {
          items: [] as CartItem[],
          summary: createEmptyCartSummary(),
        };
        const items = [...base.items, cartItem];
        return {
          items,
          summary: calculateCartSummary(items),
        };
      });

      Alert.alert("Added", "Item added to cart", [
        {
          text: "Go to cart",
          onPress: () => router.push("/(protected)/cart" as const),
        },
        { text: "Continue", style: "cancel" },
      ]);
      bottomSheetModalRef.current?.dismiss();
    },
    onError: () => {
      Alert.alert("Error", "Unable to add item to cart right now.");
    },
  });

  const rStyles = useAnimatedStyle(() => {
    return {
      top: `${posY.value}%`,
      opacity: opacity.value,
    };
  }, []);

  const onPressAdd = () => {
    if (!product) return;
    bottomSheetModalRef.current?.present("80%");
  };

  const onToggleAddon = useCallback(
    (group: ProductAddonGroup, optionId: string) => {
      setSelectedAddons((prev) => {
        const current = prev[group.id] ?? [];
        if (group.selectionType === "SINGLE") {
          return {
            ...prev,
            [group.id]: current.includes(optionId) ? [] : [optionId],
          };
        }
        const exists = current.includes(optionId);
        const next = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
        return {
          ...prev,
          [group.id]: next,
        };
      });
    },
    []
  );

  const onSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const variantPrice = useMemo(() => {
    if (!product) return 0;
    return getVariantPrice(product, selectedVariantId);
  }, [product, selectedVariantId]);

  const addonPrice = useMemo(() => {
    if (!product) return 0;
    return getAddonPrice(product, selectedAddons);
  }, [product, selectedAddons]);

  const totalPrice = variantPrice + addonPrice;

  const highestVariantPrice = useMemo(() => {
    if (!product?.variants?.length) return null;
    const values = product.variants.map((item) => Number(item.price ?? 0));
    if (!values.length) return null;
    return Math.max(...values);
  }, [product]);

  const heroImageSource = useMemo(() => {
    if (!product) return require("@/assets/images/coffee.png");
    return getProductImageSource({ slug: product.slug, imageUrl: product.imageUrl });
  }, [product]);

  if (!slug) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Something went wrong. Try again.</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          {productQuery.isLoading ? "Loading..." : "Product not found"}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <LinearGradient
          colors={[COLORS.primary100, COLORS.primary300, COLORS.primary400]}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
        <View
          style={[
            styles.screen,
            {
              padding: SIZES.padding.xl,
              paddingTop: insets.top + SIZES.padding.xl,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()}>
              <Icon icon="back" size={24} />
            </Pressable>

            <Pressable style={styles.cartButton} onPress={() => router.push("/(protected)/cart")}
            >
              <Icon icon="bag" size={24} />
            </Pressable>
          </View>

          <Image source={heroImageSource} style={styles.heroImage} />
          <Animated.Text style={[styles.heroTitle, rStyles]}>{product.name}</Animated.Text>
          <DetailCard
            product={product}
            totalPrice={totalPrice}
            compareAtPrice={highestVariantPrice && highestVariantPrice > totalPrice ? highestVariantPrice : null}
            onAddToCart={onPressAdd}
          />
        </View>
      </View>
      <BottomSheetModalProvider>
        <BottomSheetModal
          backdropComponent={renderBackdrop}
          snapPoints={["85%"]}
          backgroundStyle={styles.bottomSheetBackground}
          animationConfigs={{ duration: 300 }}
          handleComponent={null}
          ref={bottomSheetModalRef}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{product.name}</Text>
              <Pressable
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? `${COLORS.primary300}aa` : COLORS.primary100,
                  borderRadius: SIZES.radius.full,
                  padding: SIZES.padding.sm,
                })}
              >
                <Icon icon="close" size={24} />
              </Pressable>
            </View>
            <View style={styles.bottomSheetBody}>
              <View style={styles.sheetSections}>
                {product.variants.length ? (
                  <VariantOptions
                    variants={product.variants}
                    selectedVariantId={selectedVariantId}
                    onSelect={onSelectVariant}
                  />
                ) : null}
                {product.addonGroups.map((group) => (
                  <AddonGroupOptions
                    key={group.id}
                    group={group}
                    selectedAddons={selectedAddons[group.id] ?? []}
                    onToggle={(optionId) => onToggleAddon(group, optionId)}
                  />
                ))}
                {product.suggestions.length ? (
                  <Suggestions suggestions={product.suggestions} />
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? COLORS.primary200 : COLORS.primary300,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: SIZES.padding.lg,
                  borderRadius: SIZES.radius.md,
                })}
                onPress={() => addToCart.mutate()}
                disabled={addToCart.isPending}
              >
                <Text style={styles.addToCartText}>
                  {addToCart.isPending ? "Adding..." : "ADD TO CART"}
                </Text>
                <Text style={styles.addToCartText}>₹{totalPrice.toFixed(0)}</Text>
              </Pressable>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </>
  );
};

const VariantOptions = ({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}) => {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.optionLabel}>What size do you prefer</Text>
      <View style={styles.segmentedGroup}>
        {variants.map((variant, index) => {
          const isActive = selectedVariantId === variant.id;
          return (
            <Pressable
              key={variant.id}
              onPress={() => onSelect(variant.id)}
              style={({ pressed }) => [
                styles.selectionButton,
                index === 0 && styles.selectionButtonLeft,
                index === variants.length - 1 && styles.selectionButtonRight,
                {
                  backgroundColor: isActive
                    ? COLORS.primary300
                    : pressed
                    ? `${COLORS.primary300}55`
                    : COLORS.primary200,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionKey,
                  { color: isActive ? COLORS.primary100 : COLORS.primary500 },
                ]}
              >
                {variant.name}
              </Text>
              <Text
                style={[
                  styles.optionValue,
                  { color: isActive ? COLORS.primary100 : COLORS.primary500 },
                ]}
              >
                ₹{Number(variant.price).toFixed(0)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const AddonGroupOptions = ({
  group,
  selectedAddons,
  onToggle,
}: {
  group: ProductAddonGroup;
  selectedAddons: string[];
  onToggle: (optionId: string) => void;
}) => {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.optionLabel}>{group.name}</Text>
      <View style={styles.segmentedGroup}>
        {group.options.map((option, index) => {
          const selected = selectedAddons.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={({ pressed }) => [
                styles.selectionButton,
                index === 0 && styles.selectionButtonLeft,
                index === group.options.length - 1 && styles.selectionButtonRight,
                {
                  backgroundColor: selected
                    ? COLORS.primary300
                    : pressed
                    ? `${COLORS.primary300}55`
                    : COLORS.primary200,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionKey,
                  { color: selected ? COLORS.primary100 : COLORS.primary500 },
                ]}
              >
                {option.name}
              </Text>
              {Number(option.priceDelta) > 0 ? (
                <Text
                  style={[
                    styles.optionValue,
                    { color: selected ? COLORS.primary100 : COLORS.primary500 },
                  ]}
                >
                  +₹{Number(option.priceDelta).toFixed(0)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const Suggestions = ({
  suggestions,
}: {
  suggestions: ProductDetail["suggestions"];
}) => {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.optionLabel}>Goes well with</Text>
      <FlatList
        data={suggestions}
        horizontal
        contentContainerStyle={styles.suggestionsList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            key={item.id}
            style={styles.suggestionCard}
            onPress={() =>
              router.push({ pathname: "/(protected)/product/[slug]", params: { slug: item.slug } })
            }
          >
            <Image
              source={getProductImageSource({
                slug: item.slug,
                imageUrl: item.imageUrl,
              })}
              style={styles.suggestionImage}
            />
            <View style={styles.suggestionOverlay}>
              <View />
              <View>
                <Text style={[styles.suggestionText, { fontSize: SIZES.font.md }]}>
                  {item.name}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const DetailCard = ({
  product,
  totalPrice,
  compareAtPrice,
  onAddToCart,
}: {
  product: ProductDetail;
  totalPrice: number;
  compareAtPrice: number | null;
  onAddToCart: () => void;
}) => {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{product.name}</Text>
      <View style={styles.divider} />
      <View style={styles.detailBody}>
        <Text style={styles.detailDescription}>{product.description}</Text>
        <View style={styles.nutritionRow}>
          <Icon icon="veg" size={16} style={styles.nutritionIcon} />
          {Object.entries(product.nutrition).map(([key, value], index) => (
            <Text
              key={key}
              style={[
                styles.nutritionText,
                { opacity: key === "calories" ? 0.7 : 0.5 },
              ]}
            >
              {`${value} ${key}`}
              {index === Object.keys(product.nutrition).length - 1 ? "" : " · "}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.priceRow}>
        <View style={styles.priceColumn}>
          {compareAtPrice ? (
            <Text style={styles.priceOriginal}>₹{compareAtPrice.toFixed(0)}</Text>
          ) : null}
          <Text style={styles.priceDiscounted}>₹{totalPrice.toFixed(0)}</Text>
        </View>
        <Pressable
          onPress={onAddToCart}
          style={({ pressed }) => ({
            paddingHorizontal: SIZES.padding.xxl,
            paddingVertical: SIZES.padding.sm,
            borderRadius: SIZES.radius.md,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: pressed ? `${COLORS.primary300}88` : COLORS.primary200,
            transform: [
              {
                scale: pressed ? 0.98 : 1,
              },
            ],
          })}
        >
          <Text style={styles.addButtonText}>Customize</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ProductDetails;

function getVariantPrice(product: ProductDetail, variantId: string | null) {
  if (!variantId) return Number(product.variants[0]?.price ?? 0);
  const variant = product.variants.find((item) => item.id === variantId);
  return Number(variant?.price ?? product.variants[0]?.price ?? 0);
}

function getAddonPrice(product: ProductDetail, selectedAddons: Record<string, string[]>) {
  let total = 0;
  product.addonGroups.forEach((group) => {
    const selected = selectedAddons[group.id] ?? [];
    group.options.forEach((option) => {
      if (selected.includes(option.id)) {
        total += Number(option.priceDelta ?? 0);
      }
    });
  });
  return total;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    zIndex: -2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: SIZES.padding.xl,
  },
  cartButton: {
    alignSelf: "flex-start",
  },
  heroImage: {
    height: ScreenHeight * 0.45,
    aspectRatio: 0.6,
    alignSelf: "center",
  },
  heroTitle: {
    position: "absolute",
    fontWeight: "700",
    zIndex: -1,
    fontSize: SIZES.font.xxxl * 2,
    alignSelf: "center",
    color: COLORS.primary400,
  },
  bottomSheetBackground: {
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.primary200,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: SIZES.padding.lg,
  },
  bottomSheetHeader: {
    padding: SIZES.padding.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomSheetTitle: {
    color: COLORS.primary500,
    opacity: 0.6,
    fontSize: SIZES.font.xxl,
    fontWeight: "600",
  },
  bottomSheetBody: {
    flex: 1,
    backgroundColor: COLORS.primary100,
    borderTopEndRadius: SIZES.radius.xxl,
    borderTopStartRadius: SIZES.radius.xxl,
    padding: SIZES.padding.xl,
    paddingBottom: SIZES.padding.xxl,
    justifyContent: "space-between",
  },
  sheetSections: {
    gap: SIZES.padding.lg,
  },
  detailCard: {
    flex: 1,
    padding: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.xl,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.primary100,
  },
  detailTitle: {
    fontSize: SIZES.font.xxl + 8,
    fontWeight: "700",
    color: COLORS.primary500,
    opacity: 0.6,
    alignSelf: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: SIZES.padding.lg,
    backgroundColor: COLORS.primary200,
  },
  detailBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  detailDescription: {
    fontSize: SIZES.font.md,
    fontWeight: "400",
    color: COLORS.primary500,
    opacity: 0.5,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SIZES.padding.xs,
  },
  nutritionIcon: {
    position: "absolute",
    left: 0,
  },
  nutritionText: {
    color: COLORS.primary500,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.padding.md,
  },
  priceColumn: {
    alignItems: "center",
  },
  priceOriginal: {
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
    opacity: 0.6,
    textDecorationStyle: "solid",
    textDecorationColor: COLORS.primary500,
    textDecorationLine: "line-through",
  },
  priceDiscounted: {
    fontSize: SIZES.font.lg,
    fontWeight: "600",
    color: COLORS.primary500,
    opacity: 0.6,
  },
  addButtonText: {
    fontWeight: "500",
    fontSize: SIZES.font.xl,
    color: COLORS.primary500,
    opacity: 0.6,
  },
  addToCartText: {
    fontSize: SIZES.font.md,
    color: COLORS.primary100,
    fontWeight: "700",
  },
  optionSection: {
    gap: SIZES.padding.md,
  },
  optionLabel: {
    fontSize: SIZES.font.md,
    fontWeight: "600",
    color: COLORS.primary400,
    opacity: 0.6,
  },
  segmentedGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 2,
  },
  selectionButton: {
    paddingVertical: SIZES.padding.lg,
    paddingHorizontal: SIZES.padding.md,
    alignItems: "center",
    minWidth: 96,
  },
  selectionButtonLeft: {
    borderTopLeftRadius: SIZES.radius.md,
    borderBottomLeftRadius: SIZES.radius.md,
  },
  selectionButtonRight: {
    borderTopRightRadius: SIZES.radius.md,
    borderBottomRightRadius: SIZES.radius.md,
  },
  optionKey: {
    fontSize: SIZES.font.md,
    fontWeight: "500",
    opacity: 0.8,
  },
  optionValue: {
    fontSize: SIZES.font.md,
    fontWeight: "700",
    opacity: 1,
  },
  suggestionsList: {
    gap: SIZES.padding.md,
  },
  suggestionCard: {
    borderRadius: SIZES.radius.md,
    overflow: "hidden",
  },
  suggestionImage: {
    width: 150,
    height: 150,
  },
  suggestionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    padding: SIZES.padding.md,
    justifyContent: "space-between",
    backgroundColor: "#00000044",
  },
  suggestionText: {
    fontSize: SIZES.font.lg,
    color: COLORS.primary100,
    fontWeight: "500",
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary100,
  },
  fallbackText: {
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
});
