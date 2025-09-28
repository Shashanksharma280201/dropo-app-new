import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { COLORS } from "@/constants/Colors";
import { useUserStore } from "@/stores";

const selectHydrated = (state: ReturnType<typeof useUserStore.getState>) =>
  state.hydrated;

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrated = useUserStore(selectHydrated);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.flex}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: COLORS.primary100,
                },
              }}
            />
            {!hydrated && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator color={COLORS.primary400} />
              </View>
            )}
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary100,
  },
});
