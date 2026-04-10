import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Services
import { setupBinanceSocket } from './services/binanceSocket';

// Import Routes
import authRoutes from './routes/auth.routes';
import portfolioRoutes from './routes/portfolio.routes';
import marketRoutes from './routes/market.routes';
import paymentRoutes from './routes/payment.routes'; // THÊM ROUTE THANH TOÁN
import aiRoutes from './routes/ai.routes'; 

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// ==========================================
// 1. WEBHOOK ROUTE (PHẢI ĐỨNG ĐẦU TIÊN)
// ==========================================
// Tuyệt đối không dùng express.json() ở trên dòng này
app.use('/api/payment', paymentRoutes);

// ==========================================
// 2. MIDDLEWARE CHUNG
// ==========================================
app.use(express.json()); // Đọc body dạng JSON cho các API khác

// ==========================================
// 3. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('POMAFINA Financial Dashboard API is running...');
});

// ==========================================
// 4. WEBSOCKET & DATABASE BOOTSTRAP
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

setupBinanceSocket(io);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_dashboard';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => console.log(`🚀 POMAFINA Backend is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); 
  });