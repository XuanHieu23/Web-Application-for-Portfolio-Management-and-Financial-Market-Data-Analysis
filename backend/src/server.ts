import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { setupBinanceSocket } from './services/binanceSocket';

import authRoutes from './routes/auth.routes';
import portfolioRoutes from './routes/portfolio.routes';
import marketRoutes from './routes/market.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use('/api/payment', paymentRoutes);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('POMAFINA Financial Dashboard API is running...');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

setupBinanceSocket(io);

const connections = new Set<import('net').Socket>();
server.on('connection', (connection) => {
  connections.add(connection);
  connection.on('close', () => connections.delete(connection));
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_dashboard';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    const runningServer = server.listen(PORT, () => {
      console.log(`🚀 POMAFINA Backend is running on port ${PORT}`);
    });

    const gracefulShutdown = () => {
      console.log('\n🛑 [SYSTEM] Graceful shutdown initiated — destroying open connections...');

      for (const connection of connections) {
        connection.destroy();
      }

      io.close();

      runningServer.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ Port 5000 released and MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️ Shutdown timeout exceeded 3s — forcing process exit.');
        process.exit(1);
      }, 3000);
    };

    process.once('SIGUSR2', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
