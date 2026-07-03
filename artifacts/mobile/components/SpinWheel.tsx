import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const SLICE_COLORS = ["#7B5EF6", "#FF6B6B", "#22C77A", "#FFB84D", "#4CC2FF", "#FF7FD1", "#A78BFA", "#F97362"];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

interface SpinWheelProps {
  options: string[];
  spinning: boolean;
  targetIndex: number | null;
  onSpinEnd: () => void;
  size?: number;
}

export function SpinWheel({ options, spinning, targetIndex, onSpinEnd, size = 280 }: SpinWheelProps) {
  const colors = useColors();
  const rotation = useRef(new Animated.Value(0)).current;
  const totalRotation = useRef(0);

  const n = options.length;
  const sliceAngle = 360 / n;
  const radius = size / 2;

  useEffect(() => {
    if (!spinning || targetIndex === null) return;

    const sliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
    const extraSpins = 5 * 360;
    const finalAngle = extraSpins + (360 - sliceCenter);

    const newTotal = totalRotation.current + finalAngle;
    totalRotation.current = newTotal;

    Animated.timing(rotation, {
      toValue: newTotal,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onSpinEnd();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1deg"],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {options.map((opt, i) => {
              const start = i * sliceAngle;
              const end = start + sliceAngle;
              const mid = start + sliceAngle / 2;
              const labelPos = polarToCartesian(radius, radius, radius * 0.62, mid);
              return (
                <G key={i}>
                  <Path
                    d={describeSlice(radius, radius, radius - 4, start, end)}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                    stroke={colors.card}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="#fff"
                    fontSize={n > 8 ? 10 : 13}
                    fontWeight="600"
                    textAnchor="middle"
                    rotation={mid}
                    origin={`${labelPos.x}, ${labelPos.y}`}
                  >
                    {opt.length > 14 ? `${opt.slice(0, 12)}\u2026` : opt}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      <View style={[styles.hub, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.hubEmoji}>{"\u{1F3AF}"}</Text>
      </View>

      <View style={[styles.pointer, { borderTopColor: colors.foreground }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  hub: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  hubEmoji: { fontSize: 18 },
  pointer: {
    position: "absolute",
    top: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "180deg" }],
  },
});
