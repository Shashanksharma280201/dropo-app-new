import { Redirect, router } from "expo-router";
import type { Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Icon } from "@/components/Icon";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import { useUserStore } from "@/stores";
import type { ProfileResponse } from "@/lib/types";

const PROTECTED_HOME = "/(protected)" as Href;

export default function Name() {
  const hydrated = useUserStore((state) => state.hydrated);
  const accessToken = useUserStore((state) => state.accessToken);
  const storedName = useUserStore((state) => state.name);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const onSubmitHandler = () => {
    const trimmed = name.trim();
    if (!trimmed.length) return;
    updateProfile({ name: trimmed });
    queryClient.setQueryData<ProfileResponse>(["profile"], (prev) =>
      prev ? { ...prev, name: trimmed } : prev
    );
    router.replace(PROTECTED_HOME);
  };

  if (!hydrated) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={COLORS.primary400} />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/(auth)/phone" />;
  }

  if (storedName) {
    return <Redirect href={PROTECTED_HOME} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View>
            <Text style={styles.text}>Hello friend,</Text>
            <Text style={styles.text}>What is your name?</Text>
            <TextInput
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.primary300}
              style={styles.textInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSubmitHandler}
            />
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: name
                ? pressed
                  ? COLORS.primary200
                  : `${COLORS.primary200}88`
                : `${COLORS.primary200}22`,
            },
          ]}
          onPress={onSubmitHandler}
          disabled={!name.trim().length}
        >
          <Icon
            icon="chevronRight"
            size={24}
            style={{
              opacity: name ? 1 : 0.2,
            }}
          />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary100,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: "Lato",
    fontSize: SIZES.font.xxl,
  },
  iconButton: {
    alignSelf: "flex-end",
    borderRadius: SIZES.radius.full,
    padding: SIZES.padding.lg,
    margin: SIZES.padding.xxl,
  },
  textInput: {
    fontFamily: "Lato",
    marginTop: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.md,
    backgroundColor: `${COLORS.primary200}88`,
    fontSize: SIZES.font.lg,
    color: COLORS.primary500,
  },
});
