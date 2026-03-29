import React from "react";
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { colors, spacing, typography, fonts } from "@/theme";

export interface EmptyStateProps {
  message: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ message, title, style }: EmptyStateProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={title ? `${title}. ${message}` : message}
    >
      {title != null && title.length > 0 && (
        <Text style={styles.title}>{title}</Text>
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxxl,
    alignItems: "center"
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: fonts.heading,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center"
  },
  message: {
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    fontFamily: fonts.body,
    textAlign: "center"
  }
});
