import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DailyItemSource } from '../types';

interface Props {
  title: string;
  completed: boolean;
  source?: DailyItemSource;
  time?: string;
  projectColor?: string;
  onToggle: () => void;
  onLongPress?: () => void;
}

const CheckItem: React.FC<Props> = ({
  title,
  completed,
  source,
  time,
  projectColor,
  onToggle,
  onLongPress,
}) => {
  const { colors, spacing, radius } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const isRollover = source === 'rollover';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={onLongPress}
        style={[
          styles.row,
          {
            backgroundColor: isRollover ? colors.rollover : colors.surface,
            borderColor: isRollover ? colors.rolloverBorder : colors.border,
            borderWidth: isRollover ? 1 : 0,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            borderRadius: radius.md,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {/* Left color bar for project tasks */}
        {projectColor && (
          <View
            style={[
              styles.colorBar,
              { backgroundColor: projectColor, borderRadius: radius.full },
            ]}
          />
        )}

        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              borderColor: completed ? colors.success : colors.border,
              backgroundColor: completed ? colors.success : 'transparent',
              borderRadius: radius.sm,
            },
          ]}
        >
          {completed && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: completed ? colors.textTertiary : colors.text,
                textDecorationLine: completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {time && !completed && (
            <Text style={[styles.time, { color: colors.textTertiary }]}>
              {time}
            </Text>
          )}
        </View>

        {/* Rollover badge */}
        {isRollover && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.rolloverBorder + '33' },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.rolloverBorder }]}>
              ↩
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  colorBar: {
    width: 3,
    height: 20,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CheckItem;
