import React from 'react'
import { View, ViewStyle } from 'react-native'
import { colors } from '@/theme'

interface ScreenContainerProps {
  children: React.ReactNode
  style?: ViewStyle
}

/** Full-screen container with standard background. Use as root of a screen. */
export function ScreenContainer({ children, style }: ScreenContainerProps) {
  return <View style={[{ flex: 1, backgroundColor: colors.backgroundAlt }, style]}>{children}</View>
}
