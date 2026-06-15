import { colors } from '../tokens/colors';

export const lightTheme = {
  name: 'light' as const,
  colors: {
    ...colors,
    background: '#f5f7fb',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    border: 'rgba(10, 13, 26, 0.1)',
    text: '#0a0d1a',
    textMuted: 'rgba(10, 13, 26, 0.6)',
  },
};
