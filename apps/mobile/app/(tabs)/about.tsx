import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Config } from "../../config";
import {
  isPushSupported,
  getPushSupportError,
  getExpoPushTokenAsync,
  registerPushToken,
  unregisterPushToken,
  FAVORITE_DEPUTY_KEY,
  type PushTopic,
} from "../../lib/notifications";

const PUSH_ENABLED_KEY = "@agora_push_enabled";
const PUSH_TOKEN_KEY = "@agora_push_token";
const PUSH_TOPIC_KEY = "@agora_push_topic";

export default function AboutScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushTopic, setPushTopic] = useState<PushTopic>("all");
  const [favoriteDeputyRef, setFavoriteDeputyRef] = useState<string | null>(
    null
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const loadStoredPushPref = useCallback(async () => {
    try {
      const [enabled, , topic, deputy] = await Promise.all([
        AsyncStorage.getItem(PUSH_ENABLED_KEY),
        AsyncStorage.getItem(PUSH_TOKEN_KEY),
        AsyncStorage.getItem(PUSH_TOPIC_KEY),
        AsyncStorage.getItem(FAVORITE_DEPUTY_KEY),
      ]);
      setPushEnabled(enabled === "true");
      setPushTopic((topic === "my_deputy" ? "my_deputy" : "all") as PushTopic);
      setFavoriteDeputyRef(deputy || null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStoredPushPref();
  }, [loadStoredPushPref]);

  const doRegister = useCallback(
    async (token: string, topic: PushTopic, deputyRef: string | null) => {
      return registerPushToken(token, {
        apiUrl: Config.API_URL,
        topic,
        deputyActeurRef: topic === "my_deputy" ? deputyRef : null,
      });
    },
    []
  );

  const handlePushToggle = useCallback(
    async (value: boolean) => {
      if (!isPushSupported()) return;
      setPushLoading(true);
      setPushError(null);
      try {
        if (value) {
          const result = await getExpoPushTokenAsync();
          if (!result.token) {
            setPushError(
              result.error ??
                "Permission refusée ou appareil non pris en charge."
            );
            setPushLoading(false);
            return;
          }
          const token = result.token;
          const topic = pushTopic;
          const deputyRef = topic === "my_deputy" ? favoriteDeputyRef : null;
          if (topic === "my_deputy" && !deputyRef) {
            setPushError("Choisissez votre député dans l'onglet Mon député.");
            setPushLoading(false);
            return;
          }
          const registerResult = await doRegister(token, topic, deputyRef);
          if (!registerResult.ok) {
            setPushError(registerResult.error ?? "Échec de l'enregistrement");
            setPushLoading(false);
            return;
          }
          await AsyncStorage.multiSet([
            [PUSH_ENABLED_KEY, "true"],
            [PUSH_TOKEN_KEY, token],
            [PUSH_TOPIC_KEY, topic],
          ]);
          setPushEnabled(true);
        } else {
          const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
          if (token) {
            await unregisterPushToken(token, Config.API_URL);
          }
          await AsyncStorage.multiRemove([
            PUSH_ENABLED_KEY,
            PUSH_TOKEN_KEY,
            PUSH_TOPIC_KEY,
          ]);
          setPushEnabled(false);
        }
      } catch (e) {
        setPushError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setPushLoading(false);
      }
    },
    [pushTopic, favoriteDeputyRef, doRegister]
  );

  const handleTopicChange = useCallback(
    async (topic: PushTopic) => {
      setPushTopic(topic);
      await AsyncStorage.setItem(PUSH_TOPIC_KEY, topic);
      if (!pushEnabled) return;
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (!token) return;
      const deputyRef = topic === "my_deputy" ? favoriteDeputyRef : null;
      if (topic === "my_deputy" && !deputyRef) return;
      setPushLoading(true);
      setPushError(null);
      try {
        const result = await doRegister(token, topic, deputyRef);
        if (!result.ok) setPushError(result.error ?? "Échec de la mise à jour");
      } finally {
        setPushLoading(false);
      }
    },
    [pushEnabled, favoriteDeputyRef, doRegister]
  );

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Notre mission</Text>
        <Text style={styles.paragraph}>
          Agora a pour objectif de rendre l&apos;activité de l&apos;Assemblée
          nationale plus accessible et transparente pour tous les citoyens.
        </Text>
        <Text style={styles.paragraph}>
          Nous croyons que chacun devrait pouvoir consulter facilement ce que
          font ses représentants aujourd&apos;hui, cette semaine, et au-delà.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Comment ça marche ?</Text>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Collecte des données</Text>
            <Text style={styles.stepText}>
              Nous récupérons automatiquement les données officielles de
              l&apos;Assemblée nationale via leurs sources ouvertes.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Organisation</Text>
            <Text style={styles.stepText}>
              Les données sont organisées pour faciliter la navigation et la
              compréhension.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Présentation claire</Text>
            <Text style={styles.stepText}>
              Nous présentons l&apos;information de manière simple et
              accessible.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Sources de données</Text>
        <Text style={styles.paragraph}>
          Toutes les informations proviennent directement des sources
          officielles de l&apos;Assemblée nationale.
        </Text>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink("https://data.assemblee-nationale.fr")}
        >
          <Text style={styles.linkText}>data.assemblee-nationale.fr →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink("https://www.assemblee-nationale.fr")}
        >
          <Text style={styles.linkText}>assemblee-nationale.fr →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { marginTop: 12 }]}
          onPress={() => router.push("/sources")}
        >
          <Text style={styles.linkText}>
            Sources, méthodologie et glossaire →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Notifications</Text>
        {!isPushSupported() ? (
          <View>
            <Text style={styles.paragraph}>
              Les notifications push nécessitent un development build. Expo Go
              ne les supporte pas.
            </Text>
            <Text
              style={[
                styles.paragraph,
                { marginTop: 8, fontStyle: "italic", color: "#666" },
              ]}
            >
              {getPushSupportError() ??
                "Les notifications push ne sont pas disponibles."}
            </Text>
            <Text style={[styles.paragraph, { marginTop: 12 }]}>
              Pour tester les notifications push, créez un development build
              avec:
            </Text>
            <Text
              style={[
                styles.paragraph,
                { fontFamily: "monospace", fontSize: 12, marginTop: 4 },
              ]}
            >
              eas build --platform android --profile development
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.paragraph}>
              Recevez une alerte lorsqu&apos;il y a de nouveaux scrutins à
              l&apos;Assemblée nationale. Nous enregistrons uniquement votre
              jeton de notification et, si vous choisissez l&apos;option Mon
              député, l&apos;identifiant de ce député. Vous pouvez désactiver à
              tout moment.
            </Text>
            <View style={styles.pushRow}>
              <Text style={styles.pushLabel}>Notifications push</Text>
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                disabled={pushLoading}
                trackColor={{ false: "#ccc", true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            {pushEnabled && (
              <View style={styles.topicRow}>
                <Text style={styles.topicLabel}>
                  Recevoir des notifications pour
                </Text>
                <View style={styles.topicButtons}>
                  <TouchableOpacity
                    style={[
                      styles.topicButton,
                      pushTopic === "all" && styles.topicButtonActive,
                    ]}
                    onPress={() => handleTopicChange("all")}
                    disabled={pushLoading}
                  >
                    <Text
                      style={[
                        styles.topicButtonText,
                        pushTopic === "all" && styles.topicButtonTextActive,
                      ]}
                    >
                      Tous les scrutins
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.topicButton,
                      pushTopic === "my_deputy" && styles.topicButtonActive,
                    ]}
                    onPress={() => handleTopicChange("my_deputy")}
                    disabled={pushLoading}
                  >
                    <Text
                      style={[
                        styles.topicButtonText,
                        pushTopic === "my_deputy" &&
                          styles.topicButtonTextActive,
                      ]}
                    >
                      Uniquement mon député
                    </Text>
                  </TouchableOpacity>
                </View>
                {pushTopic === "my_deputy" && !favoriteDeputyRef && (
                  <Text style={styles.topicHint}>
                    Choisissez votre député dans l&apos;onglet Mon député.
                  </Text>
                )}
              </View>
            )}
            {pushError && <Text style={styles.pushError}>{pushError}</Text>}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Open Source</Text>
        <Text style={styles.paragraph}>
          Agora est un projet open source. Le code est disponible librement.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Agora v0.1.0</Text>
        <Text style={styles.footerText}>
          Données officielles de l&apos;Assemblée nationale
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  step: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLight,
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  pushRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pushLabel: {
    fontSize: 16,
    color: colors.text,
  },
  pushError: {
    fontSize: 14,
    color: colors.error,
    marginTop: 8,
  },
  topicRow: {
    marginTop: 16,
  },
  topicLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  topicButtons: {
    flexDirection: "row",
    gap: 8,
  },
  topicButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  topicButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  topicButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  topicButtonTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  topicHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
});
