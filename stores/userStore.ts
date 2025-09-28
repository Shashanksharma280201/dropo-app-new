import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Address } from "@/lib/types";

type UserStoreState = {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  name: string | null;
  phoneNumber: string | null;
  defaultAddressId: string | null;
  addresses: Address[];
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: {
      id?: string;
      name: string | null;
      phoneNumber: string;
      defaultAddressId?: string | null;
      addresses?: Address[];
    };
  }) => void;
  updateProfile: (payload: { name?: string | null }) => void;
  setAddresses: (addresses: Address[], defaultAddressId?: string | null) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
};

// MMKV storage adapter (lazy-loaded)
const createMMKVStorage = () => {
  try {
    const { MMKV } = require("react-native-mmkv");
    const mmkv = new MMKV({ id: "user-storage" });
    return {
      getItem: (name: string) => mmkv.getString(name) ?? null,
      setItem: (name: string, value: string) => mmkv.set(name, value),
      removeItem: (name: string) => mmkv.delete(name),
    };
  } catch {
    // We’re in Expo Go or JSI is unavailable
    return null;
  }
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      accessToken: null,
      refreshToken: null,
      name: null,
      phoneNumber: null,
      defaultAddressId: null,
      addresses: [],
      setSession: ({ accessToken, refreshToken, user }) => {
        set({
          accessToken,
          refreshToken,
          name: user.name ?? null,
          phoneNumber: user.phoneNumber,
          defaultAddressId: user.defaultAddressId ?? null,
          addresses: user.addresses ?? get().addresses,
        });
      },
      updateProfile: ({ name }) => {
        set({ name: name ?? null });
      },
      setAddresses: (addresses, defaultAddressId) => {
        set({
          addresses,
          defaultAddressId: defaultAddressId ?? get().defaultAddressId,
        });
      },
      clearSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          name: null,
          phoneNumber: null,
          addresses: [],
          defaultAddressId: null,
        });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => {
        const mmkvStorage = createMMKVStorage();
        return mmkvStorage || AsyncStorage;
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
