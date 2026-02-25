import React, { useRef } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';

interface Props {
  onDragStart: () => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  color?: string;
}

const DragHandle: React.FC<Props> = ({ onDragStart, onDragMove, onDragEnd, color = '#aaa' }) => {
  // Keep callbacks in refs to avoid stale closures in the stable PanResponder
  const cbStart = useRef(onDragStart);
  const cbMove = useRef(onDragMove);
  const cbEnd = useRef(onDragEnd);
  cbStart.current = onDragStart;
  cbMove.current = onDragMove;
  cbEnd.current = onDragEnd;

  const active = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => active.current && Math.abs(gs.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gs) => active.current && Math.abs(gs.dy) > 2,
      onPanResponderGrant: () => {
        timer.current = setTimeout(() => {
          active.current = true;
          cbStart.current();
        }, 350);
      },
      onPanResponderMove: (_, gs) => {
        if (active.current) cbMove.current(gs.dy);
      },
      onPanResponderRelease: () => {
        if (timer.current) clearTimeout(timer.current);
        if (active.current) {
          active.current = false;
          cbEnd.current();
        }
      },
      onPanResponderTerminate: () => {
        if (timer.current) clearTimeout(timer.current);
        active.current = false;
      },
    })
  ).current;

  return (
    <View
      {...pan.panHandlers}
      style={styles.handle}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
    >
      <Text style={[styles.icon, { color }]}>⠿</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  handle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
});

export default DragHandle;
