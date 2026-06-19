import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolioItem extends Document {
  userId: mongoose.Types.ObjectId;
  coinSymbol: string;
  quantity: number;
  avgPurchasePrice: number;
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

PortfolioSchema.index({ userId: 1, coinSymbol: 1 }, { unique: true });

export default mongoose.model<IPortfolioItem>('Portfolio', PortfolioSchema);
