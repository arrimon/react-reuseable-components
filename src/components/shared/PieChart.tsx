import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";

import {
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  type TooltipComponentOption,
  type LegendComponentOption,
  type TitleComponentOption,
} from "echarts/components";

import {
  PieChart as EChartsPieChart,
  type PieSeriesOption,
} from "echarts/charts";

import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  EChartsPieChart,
  CanvasRenderer,
]);

type EChartsOption = echarts.ComposeOption<
  | TooltipComponentOption
  | LegendComponentOption
  | TitleComponentOption
  | PieSeriesOption
>;

export interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  title?: string;
  subtitle?: string;
  data: PieChartData[];
  height?: number | string;
  showLegend?: boolean;
  radius?: string | string[];
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const formatNumber = (value: number) => value.toLocaleString();

export default function PieChart({
  title,
  subtitle,
  data,
  height = 350,
  showLegend = true,
  radius = ["52%", "76%"],
}: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartRef.current;

    if (!element) return;

    const chart = echarts.init(element);
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const buildOption = (isDark: boolean): EChartsOption => {
      const headingColor = isDark ? "#f8fafc" : "#0f172a";
      const mutedColor = "#94a3b8";
      const legendColor = isDark ? "#cbd5e1" : "#475569";
      const borderColor = isDark ? "#111827" : "#ffffff";

      return {
        color: DEFAULT_COLORS,
        title: title
          ? {
              text: title,
              subtext: subtitle,
              left: 0,
              top: 0,
              textStyle: { fontSize: 16, fontWeight: 600, color: headingColor },
              subtextStyle: { fontSize: 12, color: mutedColor },
            }
          : undefined,
        tooltip: {
          trigger: "item",
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#374151" : "#e2e8f0",
          borderWidth: 1,
          padding: [8, 12],
          textStyle: { color: headingColor, fontSize: 12 },
          extraCssText:
            "border-radius:10px;box-shadow:0 8px 24px rgba(15,23,42,0.14);",
          formatter: "{b}<br/><b>{c}</b> · {d}%",
        },
        legend: {
          show: showLegend,
          type: "scroll",
          orient: "vertical",
          right: 0,
          top: "middle",
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          itemGap: 12,
          textStyle: { color: legendColor, fontSize: 12 },
          formatter: (name: string) => {
            const item = data.find((d) => d.name === name);
            if (!item) return name;
            const pct = total ? Math.round((item.value / total) * 100) : 0;
            return `${name}   ${formatNumber(item.value)} (${pct}%)`;
          },
        },
        series: [
          {
            name: title || "Data",
            type: "pie",
            radius,
            center: showLegend ? ["36%", "52%"] : ["50%", "52%"],
            padAngle: 2,
            itemStyle: {
              borderColor,
              borderWidth: 2,
              borderRadius: 6,
            },
            label: {
              show: true,
              position: "center",
              formatter: `{value|${formatNumber(total)}}\n{caption|Total}`,
              rich: {
                value: {
                  fontSize: 24,
                  fontWeight: 700,
                  color: headingColor,
                  lineHeight: 30,
                },
                caption: { fontSize: 12, color: mutedColor, lineHeight: 18 },
              },
            },
            labelLine: { show: false },
            emphasis: {
              scale: true,
              scaleSize: 6,
              itemStyle: {
                shadowBlur: 18,
                shadowColor: isDark
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(15,23,42,0.25)",
              },
            },
            data,
          },
        ],
      };
    };

    const isDarkNow = () =>
      document.documentElement.classList.contains("dark");

    chart.setOption(buildOption(isDarkNow()));

    const themeObserver = new MutationObserver(() => {
      chart.setOption(buildOption(isDarkNow()));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(element);

    return () => {
      themeObserver.disconnect();
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [title, subtitle, data, height, showLegend, radius]);

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
