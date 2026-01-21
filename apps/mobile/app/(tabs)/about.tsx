import React from 'react'
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native'

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url)
  }

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
              Nous présentons l&apos;information de manière simple et accessible.
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
          onPress={() => openLink('https://data.assemblee-nationale.fr')}
        >
          <Text style={styles.linkText}>data.assemblee-nationale.fr →</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.link}
          onPress={() => openLink('https://www.assemblee-nationale.fr')}
        >
          <Text style={styles.linkText}>assemblee-nationale.fr →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Open Source</Text>
        <Text style={styles.paragraph}>
          Agora est un projet open source. Le code est disponible
          librement.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Agora v0.1.0
        </Text>
        <Text style={styles.footerText}>
          Données officielles de l&apos;Assemblée nationale
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0055a4',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0055a4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#0055a4',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
})
