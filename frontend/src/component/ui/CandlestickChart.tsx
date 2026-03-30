import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, type Time } from 'lightweight-charts';

export const CandlestickChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Khởi tạo biểu đồ với tính năng autoSize (tự co giãn không cần code tay)
    const chart = createChart(chartContainerRef.current, {
      autoSize: true, 
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(31, 41, 55, 0.5)' },
        horzLines: { color: 'rgba(31, 41, 55, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ffcc',
      downColor: '#ff0055',
      borderVisible: false,
      wickUpColor: '#00ffcc',
      wickDownColor: '#ff0055',
    });

    let isMounted = true;

    // 2. SỬA TRIỆT ĐỂ Ở ĐÂY: Dùng data-api.binance.vision chống chặn mạng
    fetch('https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        // In ra Console để chắc chắn 100% dữ liệu đã về tới nhà
        console.log("Dữ liệu nến đã về:", data);

        const formattedData = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent(); 
      })
      .catch(err => console.error('Lỗi mạng không tải được nến:', err));

    return () => {
      isMounted = false;
      chart.remove(); // Dọn dẹp an toàn tuyệt đối
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">BTC/USDT - Market Chart</h3>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">Daily (1D)</span>
      </div>
      {/* Khung chứa phải có chiều cao tối thiểu thì nến mới có chỗ hiện ra */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};