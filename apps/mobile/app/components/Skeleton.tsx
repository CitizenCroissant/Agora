import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  type ViewStyle,
  AccessibilityInfo
} from "react-native";
import { colors, radius, spacing } from "@/theme";

function usePulseLoop(enabled: boolean) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (!enabled) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, opacity]);
  return opacity;
}

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({
  width = "100%",
  height,
  borderRadius = radius.md,
  style
}: SkeletonBlockProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  const opacity = usePulseLoop(!reduceMotion);
  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Generic list placeholder when route-specific layout is not needed */
export function SkeletonListPlaceholder({ rows = 4 }: { rows?: number }) {
  return (
    <View
      style={styles.listWrap}
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement en cours"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          <SkeletonBlock height={14} width="55%" borderRadius={radius.sm} />
          <SkeletonBlock
            height={12}
            width="100%"
            borderRadius={radius.sm}
            style={{ marginTop: spacing.sm }}
          />
          <SkeletonBlock
            height={12}
            width="88%"
            borderRadius={radius.sm}
            style={{ marginTop: 6 }}
          />
        </View>
      ))}
    </View>
  );
}

export function HomeAgendaSkeleton() {
  return (
    <View
      style={styles.homeWrap}
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement de l'agenda"
    >
      <SkeletonBlock height={22} width="70%" borderRadius={radius.sm} />
      <SkeletonBlock
        height={14}
        width="40%"
        borderRadius={radius.sm}
        style={{ marginTop: spacing.md }}
      />
      {[0, 1].map((i) => (
        <View key={i} style={styles.cardMock}>
          <SkeletonBlock height={18} width="85%" borderRadius={radius.sm} />
          <SkeletonBlock
            height={14}
            width="35%"
            borderRadius={radius.sm}
            style={{ marginTop: spacing.sm }}
          />
          <SkeletonBlock
            height={12}
            width="100%"
            borderRadius={radius.sm}
            style={{ marginTop: spacing.md }}
          />
          <SkeletonBlock
            height={12}
            width="92%"
            borderRadius={radius.sm}
            style={{ marginTop: 6 }}
          />
        </View>
      ))}
    </View>
  );
}

export function VotesListSkeleton() {
  return (
    <View
      style={styles.votesContent}
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement des scrutins"
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.votesSection}>
          <SkeletonBlock height={16} width="45%" borderRadius={radius.sm} />
          <View style={styles.votesCard}>
            <View style={styles.votesCardHeader}>
              <SkeletonBlock height={22} width={72} borderRadius={radius.sm} />
              <SkeletonBlock height={14} width={100} borderRadius={radius.sm} />
            </View>
            <SkeletonBlock height={16} width="100%" borderRadius={radius.sm} />
            <SkeletonBlock
              height={16}
              width="90%"
              borderRadius={radius.sm}
              style={{ marginTop: 8 }}
            />
            <SkeletonBlock
              height={5}
              width="100%"
              borderRadius={3}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TimelineAgendaSkeleton() {
  return (
    <View
      style={styles.timelineWrap}
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement du calendrier"
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <SkeletonBlock height={16} width="50%" borderRadius={radius.sm} />
            <SkeletonBlock height={14} width={120} borderRadius={radius.sm} />
          </View>
          <View style={styles.timelineCard}>
            <SkeletonBlock height={16} width="88%" borderRadius={radius.sm} />
            <SkeletonBlock
              height={14}
              width="40%"
              borderRadius={radius.sm}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.border
  },
  listWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  listRow: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  homeWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  cardMock: {
    marginTop: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...{
      shadowColor: "#1E3A5F",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2
    }
  },
  votesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl
  },
  votesSection: {
    marginTop: 20
  },
  votesCard: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  votesCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  timelineWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl
  },
  timelineSection: {
    marginBottom: spacing.xl
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm
  },
  timelineCard: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  }
});
