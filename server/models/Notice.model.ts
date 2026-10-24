import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  id: string;
  title: string;
  category: string;
  content: string;
  targetAudience: string;
  date: string;
  isUrgent: boolean;
  postedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoticeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    targetAudience: { type: String, required: true },
    date: { type: String, required: true },
    isUrgent: { type: Boolean, default: false },
    postedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const NoticeModel = mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);
