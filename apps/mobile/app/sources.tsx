import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function SourcesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.h2}>Données officielles</Text>
        <Text style={styles.p}>
          Toutes les informations affichées sur Agora proviennent
          exclusivement des sources officielles de l&apos;Assemblée nationale.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Sources utilisées</Text>
        <View style={styles.card}>
          <Text style={styles.h3}>Open Data Assemblée nationale</Text>
          <Text style={styles.p}>
            Plateforme officielle de données ouvertes de l&apos;Assemblée
            nationale française.
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://data.assemblee-nationale.fr")
            }
          >
            <Text style={styles.link}>Visiter data.assemblee-nationale.fr →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.h3}>Site officiel de l&apos;Assemblée nationale</Text>
          <Text style={styles.p}>
            Site web officiel contenant l&apos;information institutionnelle et
            l&apos;actualité législative.
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.assemblee-nationale.fr")
            }
          >
            <Text style={styles.link}>Visiter assemblee-nationale.fr →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Fréquence de mise à jour</Text>
        <Text style={styles.p}>
          Les données sont synchronisées automatiquement chaque nuit. La date de
          dernière mise à jour est affichée avec les données.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Glossaire</Text>
        <Text style={styles.termTitle}>Séance publique</Text>
        <Text style={styles.p}>
          Réunion plénière de l&apos;Assemblée où les députés débattent et
          votent.
        </Text>
        <Text style={styles.termTitle}>Ordre du jour</Text>
        <Text style={styles.p}>
          Liste des points qui seront traités lors d&apos;une séance.
        </Text>
        <Text style={styles.termTitle}>Scrutin</Text>
        <Text style={styles.p}>
          Vote formel des députés (pour, contre, abstention, non votant).
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  p: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  link: {
    fontSize: 15,
    color: "#0055a4",
    fontWeight: "500",
  },
  termTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 12,
    marginBottom: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
});
