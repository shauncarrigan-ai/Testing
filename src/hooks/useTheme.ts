import { useColorScheme } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { useStore } from '../store';

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const theme = useStore((s) => s.settings.theme);

  const scheme =
    theme === 'system' ? (systemScheme ?? 'light') : theme;

  return {
    colors: COLORS[scheme],
    spacing: SPACING,
    radius: RADIUS,
    isDark: scheme === 'dark',
    scheme,
  };
};
