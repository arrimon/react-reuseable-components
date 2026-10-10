import { useEffect, useRef } from "react";
import * as echarts from "echarts";

/**
 * BarChartBreakdown — a stacked (or grouped) bar chart that breaks each category
 * down into its parts (e.g. revenue per month split by channel).
 *
 * Built on Apache ECharts, matching the look/behaviour of BarChart and PieChart.
 */

type EChartsOption = echarts.EChartsOption;

export interface BreakdownSeries {
  name: string;
  data: number[];
  /** Optional per-series color; falls back to the `colors` palette */
  color?: string;
}

interface BarChartBreakdownProps {
  title?: string;
  subtitle?: string;
  /** X-axis labels (one per bar) */
  categories: string[];
  /** One entry per segment; each `data` array must align with `categories` */
  series: BreakdownSeries[];
  height?: number | string;
  /** Stack segments into one bar (true) or place them side by side (false) */
  stacked?: boolean;
  /** Palette used for the segments/legend */
  colors?: string[];
  /** Formats values in the tooltip (and the y-axis) */
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#8b5cf6",
];

const axisNumberFormatter = (value: number) => value.toLocaleString();

export default function BarChartBreakdown({
  title,
  subtitle,
  categories,
  series,
  height = 400,
  stacked = true,
  colors = DEFAULT_COLORS,
  valueFormatter,
}: BarChartBreakdownProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;

    const chart = echarts.init(element);

    const yFormatter = valueFormatter ?? axisNumberFormatter;

    const option: EChartsOption = {
      color: colors,
      title: {
        text: title,
        subtext: subtitle,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v: unknown) => yFormatter(Number(v)),
      },
      legend: {
        show: series.length > 1,
        top: title ? 30 : 0,
        right: 0,
        icon: "roundRect",
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: {
        top: title ? 68 : 32,
        left: 8,
        right: 8,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { formatter: (v: number) => yFormatter(v) },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
      },
      series: series.map((s) => ({
        name: s.name,
        type: "bar",
        stack: stacked ? "total" : undefined,
        data: s.data,
        itemStyle: s.color ? { color: s.color } : undefined,
        emphasis: { focus: "series" },
        barMaxWidth: 48,
      })),
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [title, subtitle, categories, series, height, stacked, colors, valueFormatter]);

  return (
    <div
      ref={chartRef}
      style={{
        width: "100%",
        height,
        minHeight: 200,
      }}
    />
  );
}
