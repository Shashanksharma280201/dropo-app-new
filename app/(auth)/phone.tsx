import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { Href } from "expo-router";

import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import { useUserStore } from "@/stores";

const nextRoute: Href = "/name";

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const setSession = useUserStore((state) => state.setSession);
  const canSubmit = phoneNumber.trim().length >= 10;

  const handleContinue = () => {
    if (!canSubmit) return;
    const normalized = normalizePhoneNumber(phoneNumber);
    setSession({
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      user: {
        name: null,
        phoneNumber: normalized,
      },
    });
    router.replace(nextRoute);
  };

  return (
    <View style={styles.container}>
      <View style={{ gap: SIZES.padding.lg }}>
        <Text style={styles.title}>Welcome to Dropo</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="Your phone number"
          placeholderTextColor={COLORS.primary300}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
        <Text style={styles.helperText}>
          OTP verification is temporarily disabled. We will keep you signed in on this device.
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: canSubmit
              ? pressed
                ? COLORS.primary300
                : COLORS.primary400
              : COLORS.primary200,
          },
        ]}
        onPress={handleContinue}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function normalizePhoneNumber(raw: string) {
  const trimmed = raw.replace(/[^0-9+]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) {
    return `+91${trimmed.slice(1)}`;
  }
  if (trimmed.length === 10) {
    return `+91${trimmed}`;
  }
  return trimmed ? `+${trimmed}` : "";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: SIZES.padding.xxl,
    backgroundColor: COLORS.primary100,
  },
  title: {
    fontSize: SIZES.font.xxxl,
    fontFamily: "Lato",
    color: COLORS.primary500,
  },
  subtitle: {
    fontSize: SIZES.font.md,
    fontFamily: "Lato",
    color: COLORS.primary400,
    opacity: 0.7,
  },
  input: {
    backgroundColor: `${COLORS.primary200}55`,
    padding: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    color: COLORS.primary500,
  },
  helperText: {
    fontFamily: "Lato",
    fontSize: SIZES.font.sm,
    color: COLORS.primary400,
    opacity: 0.7,
  },
  button: {
    paddingVertical: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.primary100,
    fontFamily: "Lato",
    fontSize: SIZES.font.lg,
    fontWeight: "600",
  },
});
