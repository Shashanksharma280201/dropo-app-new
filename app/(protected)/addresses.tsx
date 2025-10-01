import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import api from "@/lib/api";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import { getMockProfile } from "@/lib/mockData";
import type { ProfileResponse } from "@/lib/types";

interface AddressForm {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

type AddressResponse = ProfileResponse["addresses"][number];

export default function AddressesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressForm>({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const addressesQuery = useQuery<AddressResponse[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      try {
        const { data } = await api.get<AddressResponse[]>("/users/me/addresses");
        return data;
      } catch {
        const cached = queryClient.getQueryData<AddressResponse[]>(["addresses"]);
        if (cached) return cached;
        return getMockProfile().addresses;
      }
    },
    initialData: () => getMockProfile().addresses,
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

  const addMutation = useMutation({
    mutationFn: async (payload: AddressForm) => {
      const newAddress: AddressResponse = {
        id: `addr-${Date.now()}`,
        label: payload.label || "Home",
        line1: payload.line1,
        line2: payload.line2,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        latitude: 12.9,
        longitude: 77.6,
      };

      try {
        await api.post("/users/me/addresses", {
          ...payload,
          latitude: 12.9,
          longitude: 77.6,
        });
      } catch {
        // fall back to local update only
      }

      return newAddress;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<AddressResponse[]>(["addresses"], (prev = []) => [...prev, created]);
      queryClient.setQueryData<ProfileResponse>(["profile"], (prev) => {
        if (!prev) return prev;
        const nextAddresses = [
          ...prev.addresses,
          created,
        ];
        return {
          ...prev,
          addresses: nextAddresses,
          defaultAddressId: prev.defaultAddressId ?? created.id,
        };
      });
      Alert.alert("Saved", "Address added successfully");
      setForm({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "" });
    },
    onError: () => Alert.alert("Error", "Unable to add address."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/users/me/addresses/${id}`);
      } catch {
        // fallback
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AddressResponse[]>(["addresses"], (prev = []) =>
        prev.filter((item) => item.id !== id)
      );
      queryClient.setQueryData<ProfileResponse>(["profile"], (prev) => {
        if (!prev) return prev;
        const nextAddresses = prev.addresses.filter((address) => address.id !== id);
        const nextDefault = prev.defaultAddressId === id ? nextAddresses[0]?.id ?? null : prev.defaultAddressId;
        return {
          ...prev,
          addresses: nextAddresses,
          defaultAddressId: nextDefault,
        };
      });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.patch(`/users/me/addresses/${id}/default`);
      } catch {
        // fallback
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<ProfileResponse>(["profile"], (prev) =>
        prev ? { ...prev, defaultAddressId: id } : prev
      );
    },
  });

  const defaultAddressId = profileQuery.data?.defaultAddressId ?? null;

  const onChange = (key: keyof AddressForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = form.line1 && form.city && form.state && form.postalCode && !addMutation.isPending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Your addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ gap: SIZES.padding.sm }}>
        {addressesQuery.data?.map((address) => {
          const isDefault = defaultAddressId === address.id;
          return (
            <View key={address.id} style={[styles.addressCard, isDefault && styles.addressCardActive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.addressLine}>{address.line1}</Text>
                {address.line2 ? <Text style={styles.addressLine}>{address.line2}</Text> : null}
                <Text style={styles.addressLine}>
                  {address.city}, {address.state} {address.postalCode}
                </Text>
              </View>
              <View style={styles.addressActions}>
                {!isDefault ? (
                  <Pressable onPress={() => defaultMutation.mutate(address.id)}>
                    <Text style={styles.actionText}>Set default</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.defaultBadge}>Default</Text>
                )}
                <Pressable onPress={() => deleteMutation.mutate(address.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add new address</Text>
        <TextInput
          placeholder="Label (Home, Work...)"
          style={styles.input}
          value={form.label}
          onChangeText={(text) => onChange("label", text)}
        />
        <TextInput
          placeholder="Address line 1"
          style={styles.input}
          value={form.line1}
          onChangeText={(text) => onChange("line1", text)}
        />
        <TextInput
          placeholder="Address line 2"
          style={styles.input}
          value={form.line2}
          onChangeText={(text) => onChange("line2", text)}
        />
        <TextInput
          placeholder="City"
          style={styles.input}
          value={form.city}
          onChangeText={(text) => onChange("city", text)}
        />
        <TextInput
          placeholder="State"
          style={styles.input}
          value={form.state}
          onChangeText={(text) => onChange("state", text)}
        />
        <TextInput
          placeholder="Postal code"
          style={styles.input}
          value={form.postalCode}
          onChangeText={(text) => onChange("postalCode", text)}
          keyboardType="numeric"
        />
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: canSubmit
                ? pressed
                  ? COLORS.primary300
                  : COLORS.primary400
                : COLORS.primary200,
            },
          ]}
          disabled={!canSubmit}
          onPress={() => addMutation.mutate(form)}
        >
          <Text style={styles.saveButtonText}>
            {addMutation.isPending ? "Saving..." : "Save address"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding.lg,
    gap: SIZES.padding.xl,
    backgroundColor: COLORS.primary100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.sm,
  },
  backText: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  headerTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.xl,
    color: COLORS.primary500,
  },
  addressCard: {
    backgroundColor: COLORS.primary100,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    flexDirection: "row",
    gap: SIZES.padding.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary200}aa`,
  },
  addressCardActive: {
    borderColor: COLORS.primary300,
  },
  addressLabel: {
    fontFamily: "Lato",
    fontSize: SIZES.font.md,
    color: COLORS.primary500,
    fontWeight: "600",
  },
  addressLine: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  addressActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  actionText: {
    fontFamily: "Lato",
    color: COLORS.primary400,
  },
  deleteText: {
    fontFamily: "Lato",
    color: COLORS.primary300,
  },
  defaultBadge: {
    fontFamily: "Lato",
    color: COLORS.primary500,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: COLORS.primary100,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.md,
    gap: SIZES.padding.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary200}aa`,
  },
  sectionTitle: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    fontWeight: "600",
    color: COLORS.primary500,
  },
  input: {
    backgroundColor: `${COLORS.primary200}33`,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  saveButton: {
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.padding.md,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary100,
    fontWeight: "600",
  },
});
