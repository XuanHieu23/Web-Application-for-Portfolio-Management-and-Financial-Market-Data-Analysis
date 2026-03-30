import { axiosClient } from '../services/axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const portfolioApi = {
  // Hàm lấy danh sách ví
  getPortfolio: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.PORTFOLIO.GET_ALL);
    return response.data;
  },

  // Hàm thực hiện giao dịch mua/bán
  tradeCoin: async (data: { coinSymbol: string; type: 'BUY' | 'SELL'; quantity: number; price: number }) => {
    const response = await axiosClient.post(API_ENDPOINTS.PORTFOLIO.TRADE, data);
    return response.data;
  },

  // Hàm lấy lịch sử giao dịch
  getTransactions: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.PORTFOLIO.GET_HISTORY);
    return response.data;
  }
};