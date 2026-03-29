import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp
} from "react-native";
import { colors, radius, shadows, spacing } from "@/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When set, the card is pressable (same surface as static card). */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Default elevated (shadow). Use flat for bordered list rows without shadow. */
  variant?: "elevated" | "flat";
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = "elevated"
}: CardProps) {
  const surfaceStyle = [
    variant === "elevated" ? styles.surface : styles.surfaceFlat,
    style
  ];
  if (onPress) {
    return (
      <TouchableOpacity
        style={surfaceStyle}
        onPress={onPress}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={surfaceStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  surfaceFlat: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg
  }
});
