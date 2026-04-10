import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

// Ép Mongoose phải tuân thủ interface IUser
export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tier: { 
      type: String, 
      enum: ['FREE', 'PRO'], // Ngăn lưu bậy bạ vào DB
      default: 'FREE' 
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserModel>('User', UserSchema);