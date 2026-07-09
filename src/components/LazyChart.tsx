import { lazy, Suspense } from 'react';
import type { ChartConfig } from "@/components/ui/chart";

const Chart = lazy(() => import('./MemoizedChart'));

interface LazyChartProps {
  data: Array<Record<string, unknown>>;
  config: ChartConfig;
  dataKeys: string[];
  height?: number;
}

const LazyChart = (props: LazyChartProps) => {
  return (
    <Suspense fallback={
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <Chart {...props} />
    </Suspense>
  );
};

export default LazyChart;
