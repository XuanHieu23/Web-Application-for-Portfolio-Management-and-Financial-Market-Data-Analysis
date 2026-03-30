import mongoose, { Document, Schema } from 'mongoose';

// 1. Định nghĩa Interface của TypeScript để quản lý kiểu dữ liệu chặt chẽ
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string; // Lưu mật khẩu đã mã hóa, tuyệt đối không lưu password gốc
  createdAt: Date;
  updatedAt: Date;
}

// 2. Định nghĩa Schema của Mongoose
const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Tự động tạo 2 trường createdAt và updatedAt
  }
);

// 3. Export Model để sử dụng ở các file khác
export default mongoose.model<IUser>('User', UserSchema);