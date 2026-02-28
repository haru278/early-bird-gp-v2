import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Line, Circle, Rect, Text as SvgText } from "react-native-svg";
import type { DayRecord } from "@/lib/game-types";
import { GROWTH_RATE } from "@/lib/game-types";

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 16, bottom: 30, left: 44 };

interface GrowthChartProps {
  history: DayRecord[];
  width: number;
}

export function GrowthLineChart({ history, width }: GrowthChartProps) {
  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const data = useMemo(() => {
    if (history.length === 0) return [];
    let successCount = 0;
    return history.map((record, i) => {
      if (record.result === "win") successCount++;
      return {
        day: i + 1,
        growthRate: Math.pow(GROWTH_RATE, successCount),
        result: record.result,
      };
    });
  }, [history]);

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height: CHART_HEIGHT }]}>
        <Text style={styles.emptyText}>
          2日以上のデータが必要です
        </Text>
      </View>
    );
  }

  const maxGrowth = Math.max(...data.map((d) => d.growthRate), 1.005);
  const minGrowth = 1;

  const getX = (i: number) =>
    CHART_PADDING.left + (i / (data.length - 1)) * chartWidth;
  const getY = (val: number) =>
    CHART_PADDING.top +
    chartHeight -
    ((val - minGrowth) / (maxGrowth - minGrowth)) * chartHeight;

  // Build path
  const pathD = data
    .map((d, i) => {
      const x = getX(i);
      const y = getY(d.growthRate);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Area fill path
  const areaD =
    pathD +
    ` L ${getX(data.length - 1)} ${CHART_PADDING.top + chartHeight}` +
    ` L ${getX(0)} ${CHART_PADDING.top + chartHeight} Z`;

  // Grid lines
  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) =>
    minGrowth + (i / gridLines) * (maxGrowth - minGrowth)
  );

  return (
    <View style={[styles.container, { width }]}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Grid */}
        {gridValues.map((val, i) => (
          <React.Fragment key={i}>
            <Line
              x1={CHART_PADDING.left}
              y1={getY(val)}
              x2={width - CHART_PADDING.right}
              y2={getY(val)}
              stroke="#2A3A4E"
              strokeWidth={0.5}
            />
            <SvgText
              x={CHART_PADDING.left - 6}
              y={getY(val) + 4}
              fill="#8892A0"
              fontSize={9}
              textAnchor="end"
            >
              {((val - 1) * 100).toFixed(1)}%
            </SvgText>
          </React.Fragment>
        ))}

        {/* Area fill */}
        <Path d={areaD} fill="rgba(102, 187, 106, 0.1)" />

        {/* Line */}
        <Path
          d={pathD}
          fill="none"
          stroke="#66BB6A"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(d.growthRate)}
            r={3}
            fill={d.result === "win" ? "#66BB6A" : "#FF5252"}
            stroke="#0D1B2A"
            strokeWidth={1.5}
          />
        ))}
      </Svg>
    </View>
  );
}

export function WakeTimeChart({ history, width }: GrowthChartProps) {
  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const data = useMemo(() => {
    return history
      .filter((r) => r.actualTime)
      .map((r, i) => {
        const [th, tm] = r.targetTime.split(":").map(Number);
        const [ah, am] = (r.actualTime as string).split(":").map(Number);
        return {
          day: i + 1,
          target: th * 60 + tm,
          actual: ah * 60 + am,
          result: r.result,
        };
      });
  }, [history]);

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height: CHART_HEIGHT }]}>
        <Text style={styles.emptyText}>
          2日以上のデータが必要です
        </Text>
      </View>
    );
  }

  const allTimes = data.flatMap((d) => [d.target, d.actual]);
  const maxTime = Math.max(...allTimes) + 15;
  const minTime = Math.min(...allTimes) - 15;

  const getX = (i: number) =>
    CHART_PADDING.left + (i / (data.length - 1)) * chartWidth;
  const getY = (val: number) =>
    CHART_PADDING.top +
    ((val - minTime) / (maxTime - minTime)) * chartHeight; // inverted: earlier = higher

  const targetPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.target)}`)
    .join(" ");

  const actualPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.actual)}`)
    .join(" ");

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) =>
    minTime + (i / gridLines) * (maxTime - minTime)
  );

  return (
    <View style={[styles.container, { width }]}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Grid */}
        {gridValues.map((val, i) => (
          <React.Fragment key={i}>
            <Line
              x1={CHART_PADDING.left}
              y1={getY(val)}
              x2={width - CHART_PADDING.right}
              y2={getY(val)}
              stroke="#2A3A4E"
              strokeWidth={0.5}
            />
            <SvgText
              x={CHART_PADDING.left - 6}
              y={getY(val) + 4}
              fill="#8892A0"
              fontSize={9}
              textAnchor="end"
            >
              {formatTime(Math.round(val))}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Target line (dashed) */}
        <Path
          d={targetPath}
          fill="none"
          stroke="#FFD700"
          strokeWidth={1.5}
          strokeDasharray="4,4"
          opacity={0.6}
        />

        {/* Actual line */}
        <Path
          d={actualPath}
          fill="none"
          stroke="#64B5F6"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(d.actual)}
            r={3}
            fill={d.result === "win" ? "#66BB6A" : "#FF5252"}
            stroke="#0D1B2A"
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#64B5F6" }]} />
          <Text style={styles.legendText}>実際の起床時間</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FFD700" }]} />
          <Text style={styles.legendText}>目標時間</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  emptyText: {
    color: "#8892A0",
    fontSize: 14,
    textAlign: "center",
    marginTop: 80,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#8892A0",
    fontSize: 10,
  },
});
