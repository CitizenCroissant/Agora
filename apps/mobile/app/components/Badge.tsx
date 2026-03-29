import React from "react";
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { colors, radius, spacing, typography, fonts } from "@/theme";

export type BadgeVariant = "success" | "error" | "primary" | "neutral";

export interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<
  BadgeVariant,
  { wrap: ViewStyle; text: { color: string } }
> = {
  success: {
    wrap: { backgroundColor: colors.successBg },
    text: { color: colors.text }
  },
  error: {
    wrap: { backgroundColor: colors.errorBg },
    text: { color: colors.text }
  },
  primary: {
    wrap: { backgroundColor: colors.primaryTint },
    text: { color: colors.primary }
  },
  neutral: {
    wrap: { backgroundColor: colors.backgroundAlt },
    text: { color: colors.textLight }
  }
};

export function Badge({ children, variant = "neutral", style }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, v.wrap, style]}>
      <Text style={[styles.text, v.text]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontFamily: fonts.bodyBold
  }
});
