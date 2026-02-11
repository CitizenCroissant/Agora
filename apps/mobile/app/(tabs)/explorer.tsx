import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LINKS = [
  {
    href: "/mon-depute",
    label: "Mon député",
    description: "Trouver et suivre votre député",
    icon: "person" as const,
  },
  {
    href: "/groupes",
    label: "Groupes politiques",
    description: "Voir les groupes et leurs positions",
    icon: "people" as const,
  },
  {
    href: "/circonscriptions",
    label: "Circonscriptions",
    description: "Carte et liste des circonscriptions",
    icon: "map" as const,
  },
];

export default function ExplorerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Explorer les députés, groupes et circonscriptions.
      </Text>
      {LINKS.map((item) => (
        <TouchableOpacity
          key={item.href}
          style={styles.card}
          onPress={() => router.push(item.href)}
          activeOpacity={0.7}
        >
          <Ionicons name={item.icon} size={28} color="#0055a4" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  intro: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
