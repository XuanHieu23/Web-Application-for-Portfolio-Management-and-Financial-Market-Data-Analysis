import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  coinSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinSymbol: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, coinSymbol: 1, timestamp: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
