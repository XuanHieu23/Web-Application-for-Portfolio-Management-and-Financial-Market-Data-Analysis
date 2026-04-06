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
import transactionRoutes from './routes/transaction.routes'; // ĐÃ FIX LỖI THIẾU IMPORT

// Cấu hình môi trường
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors()); // Cho phép Frontend gọi API từ domain khác
app.use(express.json()); // Cho phép server đọc dữ liệu JSON

// ==========================================
// 2. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/transactions', transactionRoutes);

// Route kiểm tra server (Health Check)
app.get('/', (req: Request, res: Response) => {
  res.send('KINETIC Financial Dashboard API is running...');
});

// ==========================================
// 3. KHỞI TẠO HTTP SERVER VÀ WEBSOCKET
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Lên production sẽ đổi thành domain của Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Lắng nghe người dùng truy cập web
io.on('connection', (socket) => {
  console.log(`📡 Một Terminal Client vừa kết nối: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client ngắt kết nối: ${socket.id}`);
  });
});

// Khởi động luồng hút dữ liệu từ Binance
setupBinanceSocket(io);

// ==========================================
// 4. KẾT NỐI DATABASE & KHỞI ĐỘNG SERVER
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_dashboard';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    
    // ĐÃ FIX: Chỉ mở cổng listen khi Database đã sẵn sàng!
    server.listen(PORT, () => {
      console.log(`🚀 KINETIC Backend đang chạy tại port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Tắt server nếu không kết nối được Database
  });