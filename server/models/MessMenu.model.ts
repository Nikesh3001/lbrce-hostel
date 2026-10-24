import mongoose, { Schema, Document } from 'mongoose';

export interface IMessMenu extends Document {
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  specialNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessMenuSchema = new Schema(
  {
    day: { type: String, required: true, unique: true },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    snacks: { type: String, required: true },
    dinner: { type: String, required: true },
    specialNote: { type: String },
  },
  { timestamps: true }
);

export const MessMenuModel = mongoose.models.MessMenu || mongoose.model<IMessMenu>('MessMenu', MessMenuSchema);
