export const colors = {
  primary: '#006b5f',
  primaryContainer: '#2dd4bf',
  primaryFixedDim: '#3cddc7',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00574d',
  onPrimaryFixedVariant: '#005047',
  secondary: '#545f73',
  secondaryContainer: '#d5e0f8',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#586377',
  tertiary: '#795900',
  tertiaryContainer: '#efb515',
  onTertiaryContainer: '#634900',
  tertiaryFixed: '#ffdf9f',
  tertiaryFixedDim: '#f9bd22',
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#3c4a46',
  outline: '#6b7a76',
  outlineVariant: '#bacac5',
  background: '#f7f9fb',
  onBackground: '#191c1e',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
};

export const typography = {
  headlineLg: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.02,
  },
  headlineLgMobile: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  headlineMd: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.05,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

export const spacing = {
  xs: 4,
  sm: 12,
  md: 24,
  lg: 48,
  xl: 80,
  gutter: 24,
};

export const borderRadius = {
  sm: 4,
  DEFAULT: 8,
  lg: 8,
  xl: 12,
  full: 9999,
};