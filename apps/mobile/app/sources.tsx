import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "@/theme";

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
    backgroundColor: colors.background
  },
  section: {
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  h2: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm
  },
  h3: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 6
  },
  p: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md
  },
  link: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  termTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 2
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  }
});
