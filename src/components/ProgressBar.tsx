import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  progress: number; // 0–1
  height?: number;
}

const ProgressBar: React.FC<Props> = ({ progress, height = 4 }) => {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.border, height, borderRadius: radius.full },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor:
              clamped >= 1 ? colors.success : colors.accent,
            width: `${clamped * 100}%`,
            height,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});

export default ProgressBar;
