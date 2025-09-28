import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Stack,
  usePathname,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";

import { COLORS } from "@/constants/Colors";
import { useUserStore } from "@/stores";
import type { Href } from "expo-router";

export default function ProtectedLayout() {
  const hydrated = useUserStore((state) => state.hydrated);
  const accessToken = useUserStore((state) => state.accessToken);
  const name = useUserStore((state) => state.name);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const lastRedirectRef = useRef<Href | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!navigationState?.key) return;
    if (segments[0] !== "(protected)") return;

    let target: Href | null = null;
    if (!accessToken) {
      target = "/(auth)/phone";
    } else if (!name) {
      target = "/name";
    }

    if (!target) {
      lastRedirectRef.current = null;
      return;
    }

    if (pathname === target || lastRedirectRef.current === target) return;

    lastRedirectRef.current = target;
    router.replace(target);
  }, [
    hydrated,
    segments,
    accessToken,
    name,
    navigationState?.key,
    pathname,
    router,
  ]);

  if (!hydrated) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={COLORS.primary400} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.primary100 },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="product/[slug]" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary100,
  },
});
