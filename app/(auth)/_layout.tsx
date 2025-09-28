import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Slot,
  usePathname,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";

import { COLORS } from "@/constants/Colors";
import { useUserStore } from "@/stores";
import type { Href } from "expo-router";

const PROTECTED_HOME = "/(protected)" as Href;
const NAME_SETUP = "/name" as Href;

export default function AuthLayout() {
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
    if (segments[0] !== "(auth)") return;

    let target: Href | null = null;
    if (accessToken && name) {
      target = PROTECTED_HOME;
    } else if (accessToken && !name) {
      target = NAME_SETUP;
    }

    if (!target) {
      lastRedirectRef.current = null;
      return;
    }

    if (pathname === target || lastRedirectRef.current === target) return;

    lastRedirectRef.current = target;
    const timeout = setTimeout(() => {
      router.replace(target);
    }, 0);

    return () => clearTimeout(timeout);
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

  return <Slot />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary100,
  },
});
