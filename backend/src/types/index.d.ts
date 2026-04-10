import { Types } from 'mongoose';

// 1. Định nghĩa chuẩn cho User
export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  tier: 'FREE' | 'PRO'; 
  createdAt: Date;
  updatedAt: Date;
}

// 2. Dạy cho Express biết req.user là gì
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tier: 'FREE' | 'PRO';
      };
    }
  }
}