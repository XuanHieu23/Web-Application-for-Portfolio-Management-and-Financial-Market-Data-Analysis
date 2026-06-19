import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  tier: 'FREE' | 'PRO';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
