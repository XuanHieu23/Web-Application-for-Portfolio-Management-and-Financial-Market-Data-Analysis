import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolioItem extends Document {
  userId: mongoose.Types.ObjectId;
  coinSymbol: string;
  quantity: number;         // Tổng số lượng coin đang giữ
  avgPurchasePrice: number; // Giá mua trung bình (Average Entry Price)
}

const PortfolioSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinSymbol: { type: String, required: true, trim: true, uppercase: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    avgPurchasePrice: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Đảm bảo 1 User chỉ có duy nhất 1 dòng bản ghi cho 1 đồng coin cụ thể
PortfolioSchema.index({ userId: 1, coinSymbol: 1 }, { unique: true });

export default mongoose.model<IPortfolioItem>('Portfolio', PortfolioSchema);