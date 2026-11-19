/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Zubia brand palette - keep in sync with web/public/brand/README.md. */
export const Brand = {
  /** Primary Green - buttons, highlights, the house icon. */
  primary: '#1A6B4A',
  /** Deep green - secondary house details, navigation accents, hovers. */
  primaryDark: '#11513A',
  /** Ink - the Zubia wordmark, headlines and key text. */
  ink: '#10291F',
  /** Mint - accents on the dark green panels, where primary is too dark. */
  mint: '#74CCA4',
  /** Clay - eyebrows, tags, "featured". */
  clay: '#A8441F',
  /** Warm gray - taglines and secondary text. */
  gray: '#6B6560',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    text: Brand.ink,
    background: Brand.white,
    // Warm, not blue-tinted: the old #F4F7FC / #E3E9F2 are what made every
    // "neutral" surface read as blue.
    backgroundElement: '#FAF8F5',
    backgroundSelected: '#F2ECE1',
    textSecondary: Brand.gray,
    tint: Brand.primary,
  },
  dark: {
    text: Brand.white,
    background: Brand.ink,
    backgroundElement: '#1C4A36',
    backgroundSelected: '#21543D',
    textSecondary: '#B7CCC1',
    tint: Brand.mint,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
