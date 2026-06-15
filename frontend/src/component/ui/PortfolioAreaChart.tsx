import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, type Time } from 'lightweight-charts';

export interface ChartPoint {
  time: number;
  value: number;
}

interface PortfolioAreaChartProps {
  data: ChartPoint[];
  height?: number;
}

export const PortfolioAreaChart: React.FC<PortfolioAreaChartProps> = ({ data, height = 260 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6B7280',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(31, 41, 55, 0.4)' },
        horzLines: { color: 'rgba(31, 41, 55, 0.4)' },
      },
      rightPriceScale: {
        borderColor: 'transparent',
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'transparent',
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 240, 255, 0.5)', width: 1, style: 3 },
        horzLine: { color: 'rgba(0, 240, 255, 0.5)', width: 1, style: 3 },
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#00F0FF',
      topColor: 'rgba(0, 240, 255, 0.25)',
      bottomColor: 'rgba(0, 240, 255, 0)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        minMove: 0.01,
        formatter: (price: number) => {
          if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
          if (price >= 1_000) return `$${(price / 1_000).toFixed(2)}k`;
          return `$${price.toFixed(2)}`;
        },
      },
    });

    // Đảm bảo data được sort theo time tăng dần (yêu cầu của lightweight-charts)
    const sorted = [...data].sort((a, b) => a.time - b.time);
    areaSeries.setData(sorted as { time: Time; value: number }[]);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
};
