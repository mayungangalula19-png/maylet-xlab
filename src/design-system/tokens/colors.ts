export const colors = {
  primary: '#7c5fe6',
  primaryHover: '#6a4fd4',
  secondary: '#2fd4ff',
  success: '#48bb78',
  warning: '#f6c90e',
  error: '#fc8181',
  background: '#0a0d1a',
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceRaised: 'rgba(0, 0, 0, 0.22)',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#e8e8f0',
  textMuted: 'rgba(255, 255, 255, 0.55)',
  textInverse: '#0a0d1a',
} as const;

export type ColorToken = keyof typeof colors;
