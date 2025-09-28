import { Alert, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { Icon } from "@/components/Icon";
import { ColoredStatusBar } from "@/components/StatusBar";
import { COLORS } from "@/constants/Colors";
import { SIZES } from "@/constants/sizes";
import api from "@/lib/api";
import { getMockProfile } from "@/lib/mockData";
import type { ProfileResponse } from "@/lib/types";
import { useUserStore } from "@/stores";

export default function ProfileScreen() {
  const clearSession = useUserStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data } = await api.get<ProfileResponse>("/users/me");
        return data;
      } catch {
        return getMockProfile();
      }
    },
    initialData: getMockProfile(),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout", {});
      } catch {
        // fallback silently
      }
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      router.replace("/(auth)/phone");
    },
    onError: () => {
      Alert.alert("Unable to logout", "Please try again.");
    },
  });

  const profile = profileQuery.data;
  const storedName = useUserStore((state) => state.name);
  const storedPhone = useUserStore((state) => state.phoneNumber);

  const displayName = storedName ?? profile?.name ?? "Friend";
  const displayPhone = profile?.phoneNumber ?? storedPhone ?? "";

  return (
    <>
      <ColoredStatusBar color={COLORS.primary200} />
      <SafeAreaView style={styles.safeArea}>
        <Header name={displayName} phone={displayPhone} />
        <Settings
          name={displayName}
          addressCount={profile?.addresses.length ?? 0}
          onAddresses={() => router.push("/(protected)/addresses")}
          onOrders={() => router.push("/(protected)/orders")}
          onSupport={() => Alert.alert("Support", "WhatsApp support coming soon")}
          onLogout={() => logoutMutation.mutate()}
        />
      </SafeAreaView>
    </>
  );
}

const Header = ({ name, phone }: { name: string; phone: string }) => {
  return (
    <View style={styles.headerContainer}>
      <ProfileImage />
      <View style={styles.headerContent}>
        <View style={styles.headerCard}>
          <Image
            style={styles.avatarImage}
            source={require("../../assets/images/user.png")}
          />
        </View>
        <View style={styles.headerDetails}>
          <Text style={styles.headerName}>{name}</Text>
          {phone ? <Text style={styles.headerPhone}>{phone}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const ProfileImage = () => {
  return (
    <Pressable
      style={({ pressed }) => ({
        padding: SIZES.padding.sm,
        alignSelf: "flex-start",
        borderRadius: SIZES.radius.full,
        backgroundColor: pressed ? `${COLORS.primary300}22` : "transparent",
      })}
      onPress={() => router.back()}
    >
      <Icon size={24} icon="back" style={{ alignSelf: "flex-start" }} />
    </Pressable>
  );
};

const Settings = ({
  name,
  addressCount,
  onAddresses,
  onOrders,
  onSupport,
  onLogout,
}: {
  name: string;
  addressCount: number;
  onAddresses: () => void;
  onOrders: () => void;
  onSupport: () => void;
  onLogout: () => void;
}) => {
  return (
    <View style={styles.settingsContainer}>
      <SettingItem
        title="Your address"
        description={addressCount ? `${addressCount} saved` : "Add or edit saved addresses"}
        onPress={onAddresses}
      />
      <SettingItem
        title="Order History"
        description="Everything you have ordered so far"
        onPress={onOrders}
      />
      <SettingItem
        title="Need help?"
        description="Hit us up on WhatsApp"
        onPress={onSupport}
      />
      <SettingItem
        title="Log out"
        description={`Until we meet again ${name}`}
        onPress={onLogout}
      />
    </View>
  );
};

const SettingItem = ({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) => {
  return (
    <>
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Icon icon="chevronRight" size={24} />
      </TouchableOpacity>
      <View style={styles.settingDivider} />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary100,
  },
  headerContainer: {
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.primary200,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: SIZES.padding.lg,
    paddingBottom: SIZES.padding.xl,
    flexDirection: "row",
    gap: SIZES.padding.xxl,
    justifyContent: "center",
  },
  headerCard: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary100,
    borderRadius: SIZES.radius.full,
    padding: SIZES.padding.sm,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  headerDetails: {
    justifyContent: "center",
  },
  headerName: {
    fontFamily: "Lato",
    fontWeight: "700",
    fontSize: SIZES.font.xl,
    color: COLORS.primary300,
  },
  headerPhone: {
    fontFamily: "Lato",
    fontWeight: "400",
    fontSize: SIZES.font.md,
    color: COLORS.primary300,
    marginTop: SIZES.padding.xs,
  },
  settingsContainer: {
    padding: SIZES.padding.lg,
    gap: SIZES.padding.md,
  },
  settingItem: {
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTitle: {
    fontWeight: "500",
    fontSize: SIZES.font.lg,
    color: COLORS.primary400,
  },
  settingDescription: {
    fontWeight: "400",
    fontSize: SIZES.font.md,
    color: COLORS.primary400,
    opacity: 0.6,
    marginTop: 4,
  },
  settingDivider: {
    height: 1,
    width: "95%",
    alignSelf: "center",
    backgroundColor: COLORS.primary200,
  },
});
