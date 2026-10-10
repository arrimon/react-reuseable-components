import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type EChartsOption = echarts.EChartsOption;

export interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  title?: string;
  subtitle?: string;
  data: BarChartData[];
  height?: number | string;
  zoomSize?: number;
  barColor?: string;
  onBarClick?: (item: BarChartData, index: number) => void;
}

export default function BarChart({
  title = "Bar Chart",
  subtitle = "Gradient Color, Shadow, and Click-to-Zoom",
  data,
  height = 400,
  zoomSize = 6,
  barColor = "#188df0",
  onBarClick,
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartRef.current;

    if (!element) return;

    const chart = echarts.init(element);

    const labels = data.map((item) => item.label);
    const values = data.map((item) => item.value);

    const option: EChartsOption = {
      title: {
        text: title,
        subtext: subtitle,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          inside: true,
          color: "#fff",
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        z: 10,
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#999",
        },
      },
      dataZoom: [
        {
          type: "inside",
        },
      ],
      series: [
        {
          type: "bar",
          showBackground: true,
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: barColor },
              { offset: 1, color: barColor },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#2378f7" },
                { offset: 0.7, color: "#2378f7" },
                { offset: 1, color: "#83bff6" },
              ]),
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleClick = (params: { dataIndex: number }) => {
      const index = params.dataIndex;

      if (index < 0 || index >= data.length) return;

      onBarClick?.(data[index], index);

      const startIndex = Math.max(
        Math.floor(index - zoomSize / 2),
        0
      );
      const endIndex = Math.min(
        Math.ceil(index + zoomSize / 2),
        data.length - 1
      );

      chart.dispatchAction({
        type: "dataZoom",
        startValue: labels[startIndex],
        endValue: labels[endIndex],
      });
    };

    chart.on("click", "series.bar", handleClick);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.off("click", handleClick);
      chart.dispose();
    };
  }, [title, subtitle, data, height, zoomSize, barColor, onBarClick]);

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