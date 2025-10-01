import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockOrders } from "@/lib/mockData";
import type { OrderResponse } from "@/lib/types";

export default function OrdersScreen() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery<OrderResponse[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const { data } = await api.get<OrderResponse[]>("/orders");
        return data;
      } catch {
        const cached = queryClient.getQueryData<OrderResponse[]>(["orders"]);
        return cached ?? getMockOrders();
      }
    },
    initialData: () => getMockOrders(),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order history</Text>
      <FlatList
        data={ordersQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: SIZES.padding.md }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.cardTitle}>Order #{item.id.slice(-6)}</Text>
              <Text style={styles.cardStatus}>{item.status}</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {item.items.map((line) => (
              <Text key={line.id} style={styles.lineItem}>
                {line.quantity} × {line.productName}
              </Text>
            ))}
            <View style={styles.cardFooter}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{Number(item.total).toFixed(0)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          ordersQuery.isLoading ? null : (
            <Text style={styles.emptyState}>No orders yet. Start by placing your first order.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary100,
    padding: SIZES.padding.lg,
  },
  title: {
    fontFamily: "Lato",
    fontSize: SIZES.font.xl,
    color: COLORS.primary500,
    marginBottom: SIZES.padding.md,
  },
  card: {
    backgroundColor: COLORS.primary100,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    gap: 4,
    elevation: 1,
    shadowColor: "#00000011",
  },
  cardTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
    fontWeight: "600",
  },
  cardStatus: {
    fontFamily: "Lato",
    color: COLORS.primary300,
  },
  cardSubtitle: {
    fontFamily: "Lato",
    color: COLORS.primary400,
    marginBottom: SIZES.padding.xs,
  },
  lineItem: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.padding.sm,
  },
  totalLabel: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  totalValue: {
    fontFamily: "Lato",
    color: COLORS.primary500,
    fontWeight: "600",
  },
  emptyState: {
    textAlign: "center",
    marginTop: SIZES.padding.xl,
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
});
