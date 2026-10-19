export const colors = {
  // Brand Palette
  navyDeep: '#07101F',
  navyDark: '#0B192C',
  navyMedium: '#0F172A',
  bluePrimary: '#1D4ED8',
  blueAccent: '#38BDF8',
  blueLight: '#E0F2FE',
  
  // Surfaces & Backgrounds
  bgDark: '#07101F',
  surfaceDark: '#0F172A',
  cardDark: '#1E293B',
  borderDark: '#334155',
  borderMuted: '#1E293B',
  
  bgLight: '#F1F5F9',
  surfaceLight: '#FFFFFF',
  cardLight: '#FFFFFF',
  borderLight: '#E2E8F0',
  
  // Text Colors
  textLight: '#F8FAFC',
  textLightMuted: '#94A3B8',
  textDark: '#0F172A',
  textDarkMuted: '#64748B',
  
  // Status Colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  ai: '#8B5CF6',
  aiLight: 'rgba(139, 92, 246, 0.15)',
  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  titleMedium: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const },
  bodyLarge: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
};
