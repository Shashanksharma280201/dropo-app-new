import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { Icon } from "@/components/Icon";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockCart } from "@/lib/mockData";
import type { CartItem, CartResponse } from "@/lib/types";

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartResponse>({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const { data } = await api.get<CartResponse>("/cart");
        return data;
      } catch {
        return getMockCart();
      }
    },
    initialData: getMockCart(),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      try {
        await api.patch(`/cart/${id}`, { quantity });
      } catch {
        // fallback to local update only
      }
      return { id, quantity };
    },
    onSuccess: ({ id, quantity }) => {
      queryClient.setQueryData<CartResponse>(["cart"], (previous) => {
        if (!previous) return previous;
        const items = previous.items.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity,
                lineTotal: item.unitPrice * quantity,
              }
            : item
        );
        return {
          items,
          summary: calculateSummary(items),
        };
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/cart/${id}`);
      } catch {
        // ignore, we'll update cache manually
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<CartResponse>(["cart"], (previous) => {
        if (!previous) return previous;
        const items = previous.items.filter((item) => item.id !== id);
        return {
          items,
          summary: calculateSummary(items),
        };
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.delete("/cart");
      } catch {
        // local fallback
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<CartResponse>(["cart"], {
        items: [],
        summary: {
          subtotal: 0,
          tax: 0,
          deliveryFee: 0,
          discount: 0,
          total: 0,
        },
      });
    },
  });

  const cart = cartQuery.data;

  const handleDecrease = (id: string, currentQty: number) => {
    const nextQty = Math.max(1, currentQty - 1);
    updateItemMutation.mutate({ id, quantity: nextQty });
  };

  const handleIncrease = (id: string, currentQty: number) => {
    updateItemMutation.mutate({ id, quantity: currentQty + 1 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text style={styles.title}>Your Cart</Text>
        <Pressable onPress={() => clearCartMutation.mutate()} disabled={!cart?.items.length}>
          <Text style={[styles.clearText, !cart?.items.length && { opacity: 0.3 }]}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={cart?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: SIZES.padding.md, padding: SIZES.padding.lg }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardTitle}>{item.product.name}</Text>
              <Text style={styles.cardSubtitle}>{item.variant.name}</Text>
              {item.addons.length ? (
                <Text style={styles.cardAddons}>
                  {item.addons.map((addon) => addon.name).join(", ")}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <View style={styles.quantityControls}>
                <Pressable onPress={() => handleDecrease(item.id, item.quantity)} style={styles.qtyButton}>
                  <Text style={styles.qtySymbol}>-</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable onPress={() => handleIncrease(item.id, item.quantity)} style={styles.qtyButton}>
                  <Text style={styles.qtySymbol}>+</Text>
                </Pressable>
              </View>
              <Text style={styles.linePrice}>₹{item.lineTotal.toFixed(0)}</Text>
              <Pressable onPress={() => removeItemMutation.mutate(item.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          cartQuery.isLoading ? null : (
            <Text style={styles.emptyState}>Your cart is empty. Explore the menu to add items.</Text>
          )
        }
      />

      <View style={styles.summaryContainer}>
        <SummaryRow label="Subtotal" value={cart?.summary.subtotal ?? 0} />
        <SummaryRow label="Tax" value={cart?.summary.tax ?? 0} />
        <SummaryRow label="Delivery" value={cart?.summary.deliveryFee ?? 0} />
        {cart?.summary.discount ? (
          <SummaryRow label="Discount" value={-cart.summary.discount} />
        ) : null}
        <View style={styles.summaryDivider} />
        <SummaryRow label="Total" value={cart?.summary.total ?? 0} bold />
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            {
              backgroundColor:
                cart && cart.items.length
                  ? pressed
                    ? COLORS.primary300
                    : COLORS.primary400
                  : COLORS.primary200,
            },
          ]}
          disabled={!cart?.items.length}
          onPress={() => router.push("/(protected)/checkout")}
        >
          <Text style={styles.checkoutText}>Proceed to checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SummaryRow = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, bold && { fontWeight: "700", fontSize: SIZES.font.lg }]}>
      {label}
    </Text>
    <Text style={[styles.summaryValue, bold && { fontWeight: "700", fontSize: SIZES.font.lg }]}>
      ₹{value.toFixed(0)}
    </Text>
  </View>
);

const calculateSummary = (items: CartItem[]): CartResponse["summary"] => {
  if (!items.length) {
    return {
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
    };
  }

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = 20;
  const discount = 0;
  const total = subtotal + tax + deliveryFee - discount;

  return { subtotal, tax, deliveryFee, discount, total };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary100,
  },
  header: {
    paddingHorizontal: SIZES.padding.lg,
    paddingTop: SIZES.padding.xl,
    paddingBottom: SIZES.padding.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.full,
    backgroundColor: `${COLORS.primary200}55`,
  },
  title: {
    fontSize: SIZES.font.xl,
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  clearText: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  card: {
    backgroundColor: COLORS.primary100,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    flexDirection: "row",
    gap: SIZES.padding.md,
    elevation: 2,
    shadowColor: "#00000022",
  },
  cardTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary500,
  },
  cardSubtitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary400,
  },
  cardAddons: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary300,
    opacity: 0.7,
  },
  cardActions: {
    alignItems: "flex-end",
    gap: SIZES.padding.sm,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.padding.xs,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.primary200,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySymbol: {
    fontFamily: "Lato",
    color: COLORS.primary500,
    fontSize: SIZES.font.md,
  },
  qtyValue: {
    fontFamily: "Lato",
    color: COLORS.primary500,
    fontSize: SIZES.font.md,
  },
  linePrice: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
  },
  removeText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary300,
  },
  emptyState: {
    textAlign: "center",
    marginTop: SIZES.padding.xl,
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  summaryContainer: {
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.primary100,
    gap: SIZES.padding.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  summaryValue: {
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: `${COLORS.primary200}88`,
    marginVertical: SIZES.padding.xs,
  },
  checkoutButton: {
    marginTop: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.padding.md,
    alignItems: "center",
  },
  checkoutText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary100,
    fontWeight: "600",
  },
});
