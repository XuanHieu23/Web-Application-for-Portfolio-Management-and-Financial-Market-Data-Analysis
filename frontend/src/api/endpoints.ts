export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
  },
  PORTFOLIO: {
    SUMMARY: '/portfolio/summary',
    TRADE: '/portfolio/trade',
    GET_HISTORY: '/portfolio/transactions',
  },
  MARKET: {
    TICKERS: '/market/tickers',
    KLINES: '/market/klines',
    GLOBAL: '/market/global',
  },
  AI: {
    INSIGHT: '/ai/insight',
    SENTIMENT: '/ai/sentiment',
  },
  PAYMENT: {
    CHECKOUT: '/payment/create-checkout-session',
  },
};
