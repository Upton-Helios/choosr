import React from "react";
import { StyleSheet, View } from "react-native";

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

interface DieProps {
  value: number;
  size?: number;
  color: string;
  pipColor: string;
  borderColor: string;
}

export function Die({ value, size = 120, color, pipColor, borderColor }: DieProps) {
  const cell = size / 3;
  const pip = cell * 0.42;
  const positions = PIP_LAYOUT[value] ?? PIP_LAYOUT[1];

  return (
    <View
      style={[
        styles.face,
        {
          width: size,
          height: size,
          borderRadius: size * 0.18,
          backgroundColor: color,
          borderColor,
        },
      ]}
    >
      {positions.map(([row, col], i) => (
        <View
          key={i}
          style={[
            styles.pip,
            {
              width: pip,
              height: pip,
              borderRadius: pip / 2,
              backgroundColor: pipColor,
              top: row * cell + (cell - pip) / 2,
              left: col * cell + (cell - pip) / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { borderWidth: 2 },
  pip: { position: "absolute" },
});
