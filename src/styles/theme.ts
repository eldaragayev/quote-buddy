export const Colors = {
  primary: '#000000',
  primaryLight: '#333333',
  primaryDark: '#000000',
  
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
  
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  backgroundTertiary: '#EEEEEE',
  
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  
  white: '#FFFFFF',
  black: '#000000',
  
  paid: '#34C759',
  unpaid: '#666666',
  overdue: '#FF3B30',
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};