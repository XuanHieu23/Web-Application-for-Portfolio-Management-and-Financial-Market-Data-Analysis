import React, { useEffect, useRef } from 'react';
import { createChart, type Time } from 'lightweight-charts';
import { KINETIC_THEME } from '../../constants/theme';
import { X } from 'lucide-react'; // Icon nút X để đóng

// Định nghĩa Props: Nhận vào tên Coin và Hàm đóng cửa sổ
interface CandlestickChartProps {
  symbol: string;
  onClose: () => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ symbol, onClose }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true, 
      layout: KINETIC_THEME.chartLayout,
      grid: KINETIC_THEME.gridLines,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: KINETIC_THEME.colors.green,
      downColor: KINETIC_THEME.colors.red,
      borderVisible: false,
      wickUpColor: KINETIC_THEME.colors.green,
      wickDownColor: KINETIC_THEME.colors.red,
    });

    let isMounted = true;

    // LẤY DỮ LIỆU ĐÚNG ĐỒNG COIN ĐANG ĐƯỢC CHỌN
    fetch(`http://localhost:5000/api/market/klines?symbol=${symbol}&interval=1d&limit=100`)
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        
        // Nhớ truy cập vào resData.data vì Backend của ta bọc kết quả trong field 'data'
        const formattedData = resData.data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent(); 
      })
      .catch(err => console.error('Lỗi tải dữ liệu nến từ Backend:', err));

    return () => {
      isMounted = false;
      chart.remove(); 
    };
  }, [symbol]); // Render lại biểu đồ nếu user đổi symbol khác

  return (
    // Lớp phủ đen mờ (Backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Khung chứa biểu đồ */}
      <div className="w-full max-w-5xl bg-[#0B0E14] border border-gray-800 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.1)] overflow-hidden flex flex-col">
        
        {/* Header của Popup */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#151924]">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-widest">{symbol} <span className="text-gray-500 font-normal">/ Market Chart</span></h3>
            <span className="text-[10px] bg-cyan-950/50 text-neon-cyan px-2 py-1 rounded border border-neon-cyan/20 font-mono">Daily (1D)</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-neon-red hover:bg-red-950/30 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Khu vực vẽ nến */}
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>
    </div>
  );
};