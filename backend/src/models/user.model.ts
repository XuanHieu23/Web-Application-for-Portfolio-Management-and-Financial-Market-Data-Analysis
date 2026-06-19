import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tier: {
      type: String,
      enum: ['FREE', 'PRO'],
      default: 'FREE'
    },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUserModel>('User', UserSchema);
