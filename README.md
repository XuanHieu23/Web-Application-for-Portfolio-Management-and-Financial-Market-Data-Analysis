# POMAFINA — Web Application for Portfolio Management and Financial Market Data Analysis

<div align="center">

![POMAFINA Banner](https://img.shields.io/badge/POMAFINA-Crypto%20Portfolio-00F0FF?style=for-the-badge&labelColor=0B0E14)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![WebSocket](https://img.shields.io/badge/Real--Time-Socket.io-black?style=for-the-badge&logo=socket.io)
![License](https://img.shields.io/badge/License-Academic-blue?style=for-the-badge)

**A unified financial terminal — combining Real-time Market Data, Portfolio Tracking, Recharts Analytics, and AI-powered Market Sentiment in a single secure workspace.**

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Environment Variables](#-environment-variables)
- [Subscription Tiers](#-subscription-tiers)
- [Author](#-author)

---

## Overview

**POMAFINA** is a comprehensive Web3-ready portfolio management platform designed for modern crypto investors. It solves the challenge of fragmented financial tracking — where users constantly switch between exchanges for live prices, news sites for market sentiment, and spreadsheets for PnL calculation — by consolidating everything into a secure, high-performance terminal.

### Why POMAFINA?

| Problem | POMAFINA's Solution |
|---|---|
| Scattered assets across multiple exchanges | A centralized dashboard aggregating total Net Worth and PnL |
| Static charts with delayed pricing | Native **Binance WebSocket** integration for sub-second live price updates |
| Overwhelming market news and noise | Automated **Fear & Greed Index** powered by Groq AI analyzing real-time RSS headlines |
| Lack of personalized portfolio strategy | **AI Oracle** powered by Groq (Llama-3.1) providing instant, tailored investment insights |
| Clunky and unresponsive UI | A sleek, Neon-themed **Dark Mode UI** with smooth ECharts & Recharts visualizations |

---

## Key Features

### Core Portfolio Management
- **Asset Holdings System:** Track cryptocurrency balances, average buy prices, and current real-time valuations.
- **Quick Trade Simulation:** Execute mock BUY/SELL transactions that immediately update your portfolio balance and database.
- **Profit/Loss (PnL) Tracking:** Auto-calculating algorithms to display absolute and percentage-based returns.

### Real-time Market Data & Analytics
- **Live Tickers:** Direct WebSocket connection to `wss://data-stream.binance.vision/stream` for real-time price feeds, bypassing regional ISP restrictions.
- **Advanced Visualizations (Recharts):** - Dynamic **Area Charts (7D Performance)** with built-in Graceful Fallback algorithms to ensure UI stability even during network outages.
  - Interactive **Donut Charts** for precise Asset Allocation breakdowns.

### AI Productivity & Market Intelligence
- **AI Oracle (Groq/Llama-3.1):** Premium feature that scans the user's current holdings and delivers actionable, sub-100-word wealth management advice via high-speed LPU inference. *(PRO only)*
- **Macro Sentiment Analysis:** Fetches real-time RSS news from CoinTelegraph and uses Groq AI (Llama-3.1) to generate a live Crypto Fear & Greed Index in strict JSON format. *(All tiers)*

### Authentication & Billing
- Secure JWT-based Authentication (Login/Register).
- **Stripe Checkout Integration:** Seamless upgrade path from FREE tier to PRO tier via Stripe Webhooks to unlock AI capabilities.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | High-performance REST API server |
| **TypeScript** | Type-safe backend codebase (ts-node) |
| **MongoDB + Mongoose** | NoSQL database for flexible user and portfolio schemas |
| **JSON Web Token (JWT)** | Stateless, secure authentication |
| **Stripe API** | Payment gateway & Webhook handling for subscriptions |
| **Groq Cloud SDK** | Ultra-fast Llama-3.1 inference for AI Oracle & Market Sentiment |

### Frontend
| Technology | Purpose |
|---|---|
| **React.js (Vite)** | Lightning-fast component-based SPA |
| **TypeScript** | Type-safe frontend codebase |
| **Tailwind CSS** | Utility-first styling (Custom Neon Dark Theme) |
| **Recharts** | Responsive SVG charts (AreaChart, PieChart) |
| **ECharts (echarts-for-react)** | Advanced charting for portfolio area visualization |
| **Lightweight Charts** | High-performance candlestick charts for Market page |
| **Zustand** | Lightweight global state management (auth store) |
| **react-hook-form + Zod** | Performant form handling with schema validation |
| **Socket.io-client / Native WS** | Handling internal broadcasts and Binance live data streams |
| **Axios** | HTTP client with global interceptors for auth tokens |

---

## System Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                     │
│               React SPA (Localhost / Client)              │
│         Tailwind CSS · Recharts · Native WebSocket        │
└─────────────────────────┬─────────────────────────────────┘
                          │  REST (HTTP) + WS
┌─────────────────────────▼─────────────────────────────────┐
│                   APPLICATION LAYER                       │
│              Node.js + Express.js Backend                 │
│      JWT Middleware · Subscription Guards                 │
│    Controllers: Auth, Portfolio, Market, AI, Payment      │
└──────────┬─────────────────────────┬──────────────────────┘
           │                         │
┌──────────▼──────────┐   ┌──────────▼──────────────────────┐
│     DATA LAYER      │   │      THIRD-PARTY SERVICES       │
│    MongoDB Atlas    │   │  Binance API/WS (Market Data)   │
│   (Users, Holdings, │   │  Stripe (Payments)              │
│    Transactions)    │   │  Groq / OpenRouter (AI Models)  │
└─────────────────────┘   └─────────────────────────────────┘
```
---
## Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB instance (local or Atlas)
- Stripe account (for premium billing features)
- Groq Cloud API key (for Llama-3.1 AI Oracle)
- OpenRouter API key (for Mistral Market Sentiment)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/pomafina.git
cd pomafina
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure environment variables** (see below), then start both servers:

```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (backend).

---

## Environment Variables

### Backend (`/backend/.env`)
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/financial-dashboard

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

GROQ_API_KEY=gsk_...

CLIENT_URL=http://localhost:5173
```

### Frontend (`/frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Subscription Tiers

POMAFINA operates on a strict Freemium model secured by backend middleware. 

| Feature | FREE Tier | PRO Tier ($15/mo) |
|---|:---:|:---:|
| Total Net Worth Tracking | ✅ | ✅ |
| Asset Allocation Charts | ✅ | ✅ |
| Live Binance Pricing | ✅ | ✅ |
| Market Sentiment Index | ✅ | ✅ |
| **AI Oracle (Portfolio Analysis)** | 🔒 *Locked* | ✅ *Unlocked* |

---

## Team

**University of Science and Technology of Hanoi (USTH)**  
Department of Information and Communication Technology — Bachelor Thesis 2026

* **Developer:** Đào Xuân Hiếu
* **External Supervisor:** Lê Văn Tài
* **Internal Supervisor:** Nguyễn Thị Hà Trang

---

<div align="center">
  Made by Đào Xuân Hiếu · USTH · 2026
</div>
