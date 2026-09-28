export const Colors = {
  // Base background & surfaces (Dark Golden Obsidian Glassmorphism palette)
  background: '#0A0B10',
  cardBackground: '#13151F',
  cardBackgroundAlt: '#1A1D2B',
  cardBackgroundLight: '#202436',
  glassBackground: 'rgba(20, 22, 33, 0.78)',
  glassBackgroundAlt: 'rgba(28, 31, 46, 0.65)',
  glassSurface: 'rgba(255, 255, 255, 0.04)',

  // Text hierarchy
  text: '#F8FAFC', // Crisp Off-White
  textSecondary: '#CBD5E1', // Silver
  textMuted: '#94A3B8', // Slate 400
  textLight: '#64748B', // Slate 500

  // Brand colors (Luxury Gold / Amber Metallic)
  primary: '#F59E0B', // Pure Gold
  primaryDark: '#D97706', // Deep Gold
  primaryDeep: '#B45309', // Dark Bronze Gold
  primaryLight: '#FBBF24', // Champagne Gold
  primaryMuted: 'rgba(245, 158, 11, 0.14)',

  // Gold accents
  gold: '#F59E0B',
  goldBright: '#FDE047',
  goldLight: 'rgba(245, 158, 11, 0.15)',
  goldBadge: 'rgba(251, 191, 36, 0.18)',
  goldDark: '#B45309',
  goldGradient: ['#FDE047', '#F59E0B', '#D97706'] as const,
  goldDarkGradient: ['#D97706', '#B45309', '#78350F'] as const,
  obsidianGlassGradient: ['rgba(35, 27, 10, 0.9)', 'rgba(20, 18, 14, 0.95)', 'rgba(12, 11, 10, 0.98)'] as const,

  // Purple/Mint aliases mapped to golden palette for backwards compatibility
  purple: '#F59E0B',
  purpleLight: 'rgba(245, 158, 11, 0.14)',
  purpleDark: '#D97706',
  purpleBadge: 'rgba(245, 158, 11, 0.18)',

  mint: '#F59E0B',
  mintLight: 'rgba(245, 158, 11, 0.14)',
  mintDark: '#D97706',

  rose: '#EF4444',
  roseLight: 'rgba(239, 68, 68, 0.16)',
  roseDark: '#DC2626',

  blue: '#38BDF8',
  blueLight: 'rgba(56, 189, 248, 0.15)',

  orange: '#FB923C',
  orangeLight: 'rgba(251, 146, 60, 0.15)',

  border: 'rgba(245, 158, 11, 0.22)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderDark: 'rgba(245, 158, 11, 0.38)',

  success: '#10B981',
  danger: '#EF4444',
};
