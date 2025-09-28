import { useEffect, useRef, type ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Tabs,
  usePathname,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";

import { Icon } from "@/components/Icon";
import { COLORS } from "@/constants/Colors";
import { useUserStore } from "@/stores";
import type { Href } from "expo-router";
type IconName = ComponentProps<typeof Icon>["icon"];

const TabBarIcon = ({ icon, color }: { icon: IconName; color: string }) => (
  <Icon icon={icon} size={22} style={{ tintColor: color }} />
);

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

  const hiddenScreenOptions = {
    tabBarButton: () => null,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.primary100,
          borderTopColor: `${COLORS.primary200}66`,
          paddingVertical: 8,
          height: 72,
        },
        tabBarActiveTintColor: COLORS.primary500,
        tabBarInactiveTintColor: COLORS.primary300,
        tabBarLabelStyle: {
          fontFamily: "Lato",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon icon="coffee" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <TabBarIcon icon="bag" color={color} />, // reuse bag icon
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <TabBarIcon icon="burger" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon icon="person" color={color} />,
        }}
      />
      <Tabs.Screen name="addresses" options={hiddenScreenOptions} />
      <Tabs.Screen name="checkout" options={hiddenScreenOptions} />
      <Tabs.Screen name="product/[slug]" options={hiddenScreenOptions} />
    </Tabs>
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
