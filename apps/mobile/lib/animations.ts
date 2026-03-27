import { LayoutAnimation, Platform, UIManager } from 'react-native'
import { animation } from '@/theme'

// Enable LayoutAnimation on Android — called once on module import
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

/**
 * LayoutAnimation configs built from the theme `animation` presets.
 *
 * Usage:
 *   import { LayoutAnimation } from 'react-native'
 *   import { layoutAnimationPresets } from '@/lib/animations'
 *
 *   LayoutAnimation.configureNext(layoutAnimationPresets.normal)
 *   setState(newData)
 */
export const layoutAnimationPresets = {
  /** Standard content update — 220 ms ease-in-out */
  normal: {
    duration: animation.duration.normal,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    }
  },
  /** Quick UI feedback — 120 ms ease-in-out */
  fast: {
    duration: animation.duration.fast,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    }
  },
  /** List data load with spring entry — 220 ms spring */
  spring: {
    duration: animation.duration.normal,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.7
    },
    update: { type: LayoutAnimation.Types.spring, springDamping: 0.7 },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    }
  }
}
