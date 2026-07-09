import { memo } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface MemoizedChartProps {
  data: Array<Record<string, unknown>>;
  config: ChartConfig;
  dataKeys: string[];
  height?: number;
}

const MemoizedChart = memo(({ data, config, dataKeys, height = 300 }: MemoizedChartProps) => {
  return (
    <ChartContainer config={config} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            {Object.entries(config).map(([key, value]) => {
              const color = value.color ?? value.theme?.light ?? value.theme?.dark;
              if (!color) return null;
              return (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.3} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => `₹ ${Number(value).toLocaleString('en-IN')}`}
              />
            }
            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {dataKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`url(#gradient-${key})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              animationDuration={1500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

MemoizedChart.displayName = 'MemoizedChart';

export default MemoizedChart;
