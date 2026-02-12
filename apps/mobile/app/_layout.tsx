import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { setupNotificationHandler } from "@/lib/notifications";
import { colors } from "@/theme";

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

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sources"
          options={{
            title: "Sources",
            headerBackTitle: "Retour",
          }}
        />
      </Stack>
    </>
  );
}
