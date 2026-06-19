import { ColorType } from 'lightweight-charts';

export const POMAFINA_THEME = {
  colors: {

    background: '#0B0E14',
    panel: 'rgba(21, 25, 36, 0.6)',
    panelSolid: '#151924',

    cyan: '#00F0FF',
    green: '#00FF9D',
    red: '#FF3366',

    textMain: '#FFFFFF',
    textMuted: '#9CA3AF',
    border: '#1F2937',
  },

  chartLayout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#9CA3AF',
  },
  gridLines: {
    vertLines: { color: 'rgba(31, 41, 55, 0.5)' },
    horzLines: { color: 'rgba(31, 41, 55, 0.5)' },
  }
};
