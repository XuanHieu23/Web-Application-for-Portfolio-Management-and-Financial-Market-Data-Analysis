import { ColorType } from 'lightweight-charts';

export const POMAFINA_THEME = {
  colors: {
    // Màu nền
    background: '#0B0E14',
    panel: 'rgba(21, 25, 36, 0.6)',
    panelSolid: '#151924',
    
    // Màu nhấn (Accents)
    cyan: '#00F0FF',        // Màu chủ đạo (Nút bấm, Viền sáng, Line chart)
    green: '#00FF9D',       // Màu báo Tăng giá, Lời (PnL), Nến xanh
    red: '#FF3366',         // Màu báo Giảm giá, Lỗ, Nến đỏ
    
    // Màu chữ và viền
    textMain: '#FFFFFF',
    textMuted: '#9CA3AF',   // Text phụ (Gray-400)
    border: '#1F2937',      // Viền (Gray-800)
  },
  
  // Cấu hình biểu đồ mặc định sử dụng chuẩn ColorType của thư viện
  chartLayout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#9CA3AF',
  },
  gridLines: {
    vertLines: { color: 'rgba(31, 41, 55, 0.5)' },
    horzLines: { color: 'rgba(31, 41, 55, 0.5)' },
  }
};