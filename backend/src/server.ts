import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
// Import Services
import { setupBinanceSocket } from './services/binanceSocket';

// Import Routes
import authRoutes from './routes/auth.routes';
import portfolioRoutes from './routes/portfolio.routes';
import marketRoutes from './routes/market.routes';
import paymentRoutes from './routes/payment.routes'; // THÊM ROUTE THANH TOÁN
import aiRoutes from './routes/ai.routes'; 


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

// 🚨 BÍ KÍP SAAS: THEO DÕI VÀ ÉP CHẾT CÁC KẾT NỐI KEEP-ALIVE NGẦM
const connections = new Set<import('net').Socket>();
server.on('connection', (connection) => {
  connections.add(connection);
  connection.on('close', () => connections.delete(connection)); // Xóa khi kết nối tự đóng
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_dashboard';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    const runningServer = server.listen(PORT, () => {
      console.log(`🚀 POMAFINA Backend is running on port ${PORT}`);
    });

    // ==========================================
    // 🚨 SHUTDOWN TRIỆT ĐỂ 100%
    // ==========================================
    const gracefulShutdown = () => {
      console.log('\n🛑 [SYSTEM] Đang bóp cò hủy diệt các kết nối treo...');
      
      // 1. Phá hủy ngay lập tức toàn bộ các TCP Sockets đang ngủ đông (Keep-Alive)
      for (const connection of connections) {
        connection.destroy();
      }

      // 2. Đóng WebSocket
      io.close();

      // 3. Đóng Server & DB
      runningServer.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ Đã dọn sạch Port 5000 và nhả MongoDB.');
          process.exit(0);
        } catch (err) {
          process.exit(1);
        }
      });

      // Timeout ép chết sau 3 giây (Hard kill)
      setTimeout(() => {
        console.error('⚠️ Quá 3 giây! Ép buộc đóng tiến trình.');
        process.exit(1);
      }, 3000);
    };

    // Nodemon trên Windows sử dụng SIGUSR2 để báo hiệu Restart
    process.once('SIGUSR2', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); 
  });