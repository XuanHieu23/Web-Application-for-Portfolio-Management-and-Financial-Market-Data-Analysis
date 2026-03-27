import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export const CandlestickChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Khởi tạo biểu đồ với màu sắc chuẩn Figma
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#A0AEC0',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FF9D', 
      downColor: '#FF3366', 
      borderVisible: false,
      wickUpColor: '#00FF9D',
      wickDownColor: '#FF3366',
    });
    
    // Bơm Data giả (Mock data)
    candlestickSeries.setData([
      { time: '2026-03-01', open: 65000, high: 66000, low: 64000, close: 65500 },
      { time: '2026-03-02', open: 65500, high: 67000, low: 65000, close: 66800 },
      { time: '2026-03-03', open: 66800, high: 68000, low: 66000, close: 67500 },
      { time: '2026-03-04', open: 67500, high: 67800, low: 65500, close: 66000 },
      { time: '2026-03-05', open: 66000, high: 67500, low: 65800, close: 67200 },
    ]);

    chart.timeScale().fitContent();

    // Responsive khi resize trình duyệt
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="p-4 rounded-xl bg-neon-panel backdrop-blur-md border border-gray-800">
      <h2 className="text-white text-lg font-semibold mb-4">BTC/USDT Real-Time Chart (Mock)</h2>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};