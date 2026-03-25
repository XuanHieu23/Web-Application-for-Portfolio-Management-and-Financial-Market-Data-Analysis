import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Cấu hình để đọc file .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Cho phép Frontend gọi API từ domain khác
app.use(express.json()); // Cho phép server đọc dữ liệu JSON từ request body

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_dashboard';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Route kiểm tra server (Health Check)
app.get('/', (req: Request, res: Response) => {
  res.send('Financial Dashboard API is running...');
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});