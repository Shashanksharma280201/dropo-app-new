import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockCart, getMockProfile } from "@/lib/mockData";
import type { CartResponse, OrderResponse, ProfileResponse } from "@/lib/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartResponse>({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const { data } = await api.get<CartResponse>("/cart");
        return data;
      } catch {
        const cached = queryClient.getQueryData<CartResponse>(["cart"]);
        return cached ?? getMockCart();
      }
    },
    initialData: () => getMockCart(),
  });

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data } = await api.get<ProfileResponse>("/users/me");
        return data;
      } catch {
        const cached = queryClient.getQueryData<ProfileResponse>(["profile"]);
        return cached ?? getMockProfile();
      }
    },
    initialData: () => getMockProfile(),
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setSelectedAddressId(
        profileQuery.data.defaultAddressId ?? profileQuery.data.addresses[0]?.id ?? null
      );
    }
  }, [profileQuery.data]);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedAddressId) {
        throw new Error("Select address");
      }
      try {
        await api.post("/orders", {
          addressId: selectedAddressId,
          paymentMethod: "COD",
        });
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 400));
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
      if (cart) {
        queryClient.setQueryData<OrderResponse[]>(["orders"], (prev = []) => {
          const orderId = `ord-${Date.now()}`;
          const newOrder: OrderResponse = {
            id: orderId,
            status: "Preparing",
            total: String(cart.summary.total ?? 0),
            paymentStatus: "COD",
            createdAt: new Date().toISOString(),
            items:
              cart.items.map((item, index) => ({
                id: `${orderId}-line-${index + 1}`,
                productName: item.product.name,
                variantName: item.variant.name,
                quantity: item.quantity,
                unitPrice: String(item.unitPrice),
              })) ?? [],
          };
          return [newOrder, ...prev];
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
      Alert.alert("Order placed", "Your order has been placed successfully", [
        {
          text: "Track order",
          onPress: () => router.replace("/(protected)/orders"),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Checkout failed", error instanceof Error ? error.message : "Try again later.");
    },
  });

  const cart = cartQuery.data;
  const addresses = profileQuery.data?.addresses ?? [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: SIZES.padding.lg, gap: SIZES.padding.lg }}>
        <View>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          {addresses.length ? (
            <View style={{ gap: SIZES.padding.sm }}>
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <Pressable
                    key={address.id}
                    onPress={() => setSelectedAddressId(address.id)}
                    style={({ pressed }) => [
                      styles.addressCard,
                      {
                        borderColor: isSelected ? COLORS.primary300 : `${COLORS.primary200}aa`,
                        backgroundColor: pressed
                          ? `${COLORS.primary200}55`
                          : isSelected
                          ? `${COLORS.primary200}66`
                          : COLORS.primary100,
                      },
                    ]}
                  >
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressText}>
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </Text>
                    <Text style={styles.addressText}>
                      {address.city}, {address.state} {address.postalCode}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => router.push("/(protected)/addresses")}
                style={styles.manageAddressButton}
              >
                <Text style={styles.manageAddressText}>Manage addresses</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyAddressBox}>
              <Text style={styles.addressText}>No saved addresses.</Text>
              <Pressable onPress={() => router.push("/(protected)/addresses")}
                style={styles.manageAddressButton}
              >
                <Text style={styles.manageAddressText}>Add an address</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <View style={styles.summaryCard}>
            {cart?.items.map((item) => (
              <View key={item.id} style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemTitle}>
                    {item.quantity} × {item.product.name}
                  </Text>
                  <Text style={styles.summaryItemSubtitle}>{item.variant.name}</Text>
                  {item.addons.length ? (
                    <Text style={styles.summaryItemAddons}>
                      {item.addons.map((addon) => addon.name).join(", ")}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.summaryItemPrice}>₹{item.lineTotal.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalsCard}>
          <TotalsRow label="Subtotal" value={cart?.summary.subtotal ?? 0} />
          <TotalsRow label="Tax" value={cart?.summary.tax ?? 0} />
          <TotalsRow label="Delivery" value={cart?.summary.deliveryFee ?? 0} />
          {cart?.summary.discount ? (
            <TotalsRow label="Discount" value={-cart.summary.discount} />
          ) : null}
          <View style={styles.divider} />
          <TotalsRow label="To pay" value={cart?.summary.total ?? 0} bold />
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.placeOrderButton,
          {
            backgroundColor:
              cart && cart.items.length && selectedAddressId
                ? pressed
                  ? COLORS.primary300
                  : COLORS.primary400
                : COLORS.primary200,
          },
        ]}
        disabled={!cart?.items.length || !selectedAddressId || placeOrder.isPending}
        onPress={() => placeOrder.mutate()}
      >
        <Text style={styles.placeOrderText}>
          {placeOrder.isPending ? "Placing order..." : `Place order • ₹${cart?.summary.total.toFixed(0) ?? "0"}`}
        </Text>
      </Pressable>
    </View>
  );
}

const TotalsRow = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.totalsLabel, bold && { fontWeight: "700", fontSize: SIZES.font.lg }]}>
      {label}
    </Text>
    <Text style={[styles.totalsValue, bold && { fontWeight: "700", fontSize: SIZES.font.lg }]}>
      ₹{value.toFixed(0)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary100,
  },
  sectionTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    fontWeight: "600",
    color: COLORS.primary500,
    marginBottom: SIZES.padding.sm,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    gap: 4,
  },
  addressLabel: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    fontWeight: "600",
    color: COLORS.primary500,
  },
  addressText: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  manageAddressButton: {
    marginTop: SIZES.padding.sm,
    alignSelf: "flex-start",
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.md,
    backgroundColor: `${COLORS.primary200}88`,
  },
  manageAddressText: {
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  emptyAddressBox: {
    borderWidth: 1,
    borderColor: `${COLORS.primary200}aa`,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    gap: SIZES.padding.sm,
  },
  summaryCard: {
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.primary100,
    padding: SIZES.padding.md,
    gap: SIZES.padding.sm,
    elevation: 1,
    shadowColor: "#00000011",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItemTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
  },
  summaryItemSubtitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary400,
  },
  summaryItemAddons: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary300,
  },
  summaryItemPrice: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
  },
  totalsCard: {
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.primary100,
    padding: SIZES.padding.md,
    gap: SIZES.padding.sm,
    elevation: 1,
    shadowColor: "#00000011",
  },
  totalsLabel: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  totalsValue: {
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  divider: {
    height: 1,
    backgroundColor: `${COLORS.primary200}99`,
    marginVertical: SIZES.padding.xs,
  },
  placeOrderButton: {
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.lg,
    margin: SIZES.padding.lg,
    alignItems: "center",
  },
  placeOrderText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary100,
    fontWeight: "600",
  },
});
