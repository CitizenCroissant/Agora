import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, sectionColors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1
        },
        headerStyle: {
          backgroundColor: colors.background
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: "bold",
          color: colors.primary,
          fontSize: 18
        },
        headerShadowVisible: false
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Aujourd'hui",
          tabBarLabel: "Aujourd'hui",
          headerTitle: "Agora",
          tabBarActiveTintColor: sectionColors.aujourdhui,
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
          tabBarActiveTintColor: sectionColors.votes,
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
          tabBarActiveTintColor: sectionColors.calendrier,
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
          tabBarActiveTintColor: sectionColors.explorer,
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
          tabBarActiveTintColor: sectionColors.comprendre,
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
