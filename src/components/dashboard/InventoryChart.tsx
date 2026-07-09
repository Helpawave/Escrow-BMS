import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", value: 125000, products: 1240 },
  { month: "Feb", value: 132000, products: 1180 },
  { month: "Mar", value: 145000, products: 1350 },
  { month: "Apr", value: 138000, products: 1290 },
  { month: "May", value: 156000, products: 1420 },
  { month: "Jun", value: 162000, products: 1380 },
];

const chartConfig = {
  value: {
    label: "Stock Value",
    color: "hsl(var(--primary))",
  },
  products: {
    label: "Product Count",
    color: "hsl(var(--success))",
  },
};

export const InventoryChart = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Inventory Overview</CardTitle>
        <CardDescription>Stock value and product count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ fill: "var(--color-value)", strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="products"
              stroke="var(--color-products)"
              strokeWidth={2}
              dot={{ fill: "var(--color-products)", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
