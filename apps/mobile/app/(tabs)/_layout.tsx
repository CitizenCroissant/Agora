import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerStyle: {
          backgroundColor: colors.primary
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: "bold"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Aujourd'hui",
          tabBarLabel: "Aujourd'hui",
          headerTitle: "Agora",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="votes"
        options={{
          title: "Scrutins",
          tabBarLabel: "Scrutins",
          headerTitle: "Scrutins",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Calendrier",
          tabBarLabel: "Calendrier",
          headerTitle: "Calendrier",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="explorer"
        options={{
          title: "Explorer",
          tabBarLabel: "Explorer",
          headerTitle: "Explorer",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "À propos",
          tabBarLabel: "À propos",
          headerTitle: "À propos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="mon-depute"
        options={{
          title: "Mon député",
          headerTitle: "Mon député",
          href: null
        }}
      />
      <Tabs.Screen
        name="groupes"
        options={{
          title: "Groupes",
          headerTitle: "Groupes politiques",
          href: null
        }}
      />
      <Tabs.Screen
        name="circonscriptions"
        options={{
          title: "Circonscriptions",
          headerTitle: "Circonscriptions",
          href: null
        }}
      />
    </Tabs>
  );
}
