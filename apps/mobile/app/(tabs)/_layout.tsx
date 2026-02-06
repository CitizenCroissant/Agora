import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0055a4",
        tabBarInactiveTintColor: "#666",
        headerStyle: {
          backgroundColor: "#0055a4",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
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
          ),
        }}
      />
      <Tabs.Screen
        name="mon-depute"
        options={{
          title: "Mon député",
          tabBarLabel: "Mon député",
          headerTitle: "Mon député",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
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
          ),
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
          ),
        }}
      />
      <Tabs.Screen
        name="groupes"
        options={{
          title: "Groupes",
          tabBarLabel: "Groupes",
          headerTitle: "Groupes politiques",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="circonscriptions"
        options={{
          title: "Circonscriptions",
          tabBarLabel: "Circonscriptions",
          headerTitle: "Circonscriptions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
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
          ),
        }}
      />
    </Tabs>
  );
}
