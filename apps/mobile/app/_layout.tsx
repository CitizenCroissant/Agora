import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { setupNotificationHandler } from "@/lib/notifications";
import { useAppFonts } from "@/lib/useAppFonts";
import { colors, fonts } from "@/theme";

void SplashScreen.preventAutoHideAsync();

// Lazy load expo-notifications to avoid module loading errors
function getNotifications() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications");
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Setup notification handler
    setupNotificationHandler();

    // Setup notification response listener
    const Notifications = getNotifications();
    if (!Notifications) {
      return;
    }
    const sub = Notifications.addNotificationResponseReceivedListener(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        const data = response.notification.request.content.data as
          | { scrutinId?: string }
          | undefined;
        if (data?.scrutinId) {
          router.push(`/votes/${data.scrutinId}`);
        } else {
          router.push("/votes");
        }
      }
    );
    return () => sub.remove();
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: "700",
            fontFamily: fonts.headingBold,
            color: colors.primary
          },
          headerShadowVisible: false
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="sources"
          options={{
            title: "Sources",
            headerBackTitle: "Retour"
          }}
        />
      </Stack>
    </>
  );
}
