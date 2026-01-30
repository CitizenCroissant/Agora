import React from "react";
import { Tabs } from "expo-router";

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
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Calendrier",
          tabBarLabel: "Calendrier",
          headerTitle: "Calendrier",
        }}
      />
      <Tabs.Screen
        name="votes"
        options={{
          title: "Scrutins",
          tabBarLabel: "Scrutins",
          headerTitle: "Scrutins",
        }}
      />
      <Tabs.Screen
        name="groupes"
        options={{
          title: "Groupes",
          tabBarLabel: "Groupes",
          headerTitle: "Groupes politiques",
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "À propos",
          tabBarLabel: "À propos",
          headerTitle: "À propos",
        }}
      />
    </Tabs>
  );
}
