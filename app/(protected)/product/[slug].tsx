import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";

import { Icon } from "@/components/Icon";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockProductDetail } from "@/lib/mockData";
import type { ProductDetail } from "@/lib/types";

export default function ProductScreen() {
  const router = useRouter();
  const { slug: rawSlug } = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const [quantity, setQuantity] = useState(1);
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

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!selectedVariantId) throw new Error("Select a variant");
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    onSuccess: () => {
      const cartRoute: Href = "/(protected)/cart";
      Alert.alert("Added", "Item added to cart", [
        { text: "Go to cart", onPress: () => router.push(cartRoute) },
        { text: "Continue", style: "cancel" },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Unable to add item to cart right now.");
    },
  });

  const product = productQuery.data;

  useEffect(() => {
    setQuantity(1);
    setSelectedVariantId(null);
    setSelectedAddons({});
  }, [slug]);

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

  if (!slug) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Something went wrong. Try again.</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {productQuery.isLoading ? "Loading..." : "Product not found"}
        </Text>
      </View>
    );
  }

  const unitPrice = getVariantPrice(product, selectedVariantId) + getAddonPrice(product, selectedAddons);
  const totalPrice = unitPrice * quantity;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: SIZES.padding.xxl }}>
        <View style={styles.heroSection}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon icon="back" size={24} />
          </Pressable>
          <Image source={{ uri: product.imageUrl }} style={styles.heroImage} resizeMode="contain" />
          <Text style={styles.heroTitle}>{product.name}</Text>
          <Text style={styles.heroSubtitle}>{product.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a size</Text>
          <View style={styles.chipGroup}>
            {product.variants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <Pressable
                  key={variant.id}
                  onPress={() => setSelectedVariantId(variant.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? COLORS.primary300
                        : pressed
                        ? `${COLORS.primary300}55`
                        : `${COLORS.primary200}77`,
                    },
                  ]}
                >
                  <Text style={styles.chipLabel}>{variant.name}</Text>
                  <Text style={styles.chipPrice}>₹{Number(variant.price).toFixed(0)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {product.addonGroups.map((group) => (
          <View key={group.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.name}</Text>
            <View style={styles.chipGroup}>
              {group.options.map((option) => {
                const selected = selectedAddons[group.id]?.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      toggleAddonSelection(group, option.id, selectedAddons, setSelectedAddons)
                    }
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? COLORS.primary300
                          : pressed
                          ? `${COLORS.primary300}55`
                          : `${COLORS.primary200}77`,
                      },
                    ]}
                  >
                    <Text style={styles.chipLabel}>{option.name}</Text>
                    {Number(option.priceDelta) > 0 ? (
                      <Text style={styles.chipPrice}>+₹{Number(option.priceDelta).toFixed(0)}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition</Text>
          <Text style={styles.nutritionText}>
            {Object.entries(product.nutrition)
              .map(([key, value]) => `${value} ${key}`)
              .join(" · ")}
          </Text>
        </View>

        {product.suggestions.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goes well with</Text>
            <View style={{ flexDirection: "row", gap: SIZES.padding.md }}>
              {product.suggestions.slice(0, 3).map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  onPress={() =>
                    router.push({ pathname: "/(protected)/product/[slug]", params: { slug: suggestion.slug } })
                  }
                  style={styles.suggestionCard}
                >
                  <Image source={{ uri: suggestion.imageUrl }} style={styles.suggestionImage} />
                  <Text style={styles.suggestionLabel}>{suggestion.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.quantityContainer}>
          <Pressable
            onPress={() => setQuantity((qty) => Math.max(1, qty - 1))}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </Pressable>
          <Text style={styles.quantityValue}>{quantity}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addToCartButton,
            {
              backgroundColor: pressed ? COLORS.primary300 : COLORS.primary400,
            },
          ]}
          onPress={() => addToCart.mutate()}
        >
          <Text style={styles.addToCartText}>
            {addToCart.isPending ? "Adding..." : `Add • ₹${totalPrice.toFixed(0)}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function getVariantPrice(product: ProductDetail, variantId: string | null) {
  if (!variantId) return 0;
  const variant = product.variants.find((item) => item.id === variantId);
  return Number(variant?.price ?? 0);
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

function toggleAddonSelection(
  group: ProductDetail["addonGroups"][number],
  optionId: string,
  selectedAddons: Record<string, string[]>,
  setSelectedAddons: Dispatch<SetStateAction<Record<string, string[]>>>,
) {
  const current = selectedAddons[group.id] ?? [];
  if (group.selectionType === "SINGLE") {
    setSelectedAddons({
      ...selectedAddons,
      [group.id]: current.includes(optionId) ? [] : [optionId],
    });
  } else {
    const exists = current.includes(optionId);
    const next = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
    setSelectedAddons({
      ...selectedAddons,
      [group.id]: next,
    });
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  heroSection: {
    padding: SIZES.padding.xl,
    alignItems: "center",
    gap: SIZES.padding.md,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.full,
    backgroundColor: `${COLORS.primary200}55`,
  },
  heroImage: {
    width: "100%",
    height: 280,
  },
  heroTitle: {
    fontSize: SIZES.font.xxxl,
    fontFamily: "Lato",
    fontWeight: "700",
    color: COLORS.primary500,
  },
  heroSubtitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary400,
    textAlign: "center",
    opacity: 0.7,
  },
  section: {
    paddingHorizontal: SIZES.padding.xl,
    paddingBottom: SIZES.padding.lg,
  },
  sectionTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    fontWeight: "600",
    color: COLORS.primary500,
    marginBottom: SIZES.padding.sm,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.padding.sm,
  },
  chip: {
    paddingVertical: SIZES.padding.sm,
    paddingHorizontal: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    alignItems: "center",
  },
  chipLabel: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
  },
  chipPrice: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary400,
  },
  nutritionText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary400,
  },
  suggestionCard: {
    width: 120,
    borderRadius: SIZES.radius.md,
    overflow: "hidden",
    backgroundColor: `${COLORS.primary200}55`,
  },
  suggestionImage: {
    width: "100%",
    height: 80,
  },
  suggestionLabel: {
    padding: SIZES.padding.sm,
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary500,
  },
  footer: {
    padding: SIZES.padding.lg,
    paddingBottom: SIZES.padding.xl,
    backgroundColor: COLORS.primary100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.padding.md,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.padding.sm,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.primary200,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary500,
  },
  quantityValue: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary500,
  },
  addToCartButton: {
    flex: 1,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.padding.md,
    alignItems: "center",
  },
  addToCartText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary100,
    fontWeight: "600",
  },
});
