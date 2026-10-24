import mongoose, { Schema, Document } from 'mongoose';

export interface IBed {
  bedNumber: number;
  studentId?: string;
  studentName?: string;
  rollNo?: string;
  phone?: string;
  branch?: string;
}

export interface IRoom extends Document {
  id: string;
  roomNo: string;
  block: string;
  floor: number;
  capacity: number;
  occupied: number;
  type: 'AC' | 'Non-AC';
  gender: 'Boys' | 'Girls';
  beds: IBed[];
  createdAt?: Date;
  updatedAt?: Date;
}

const BedSchema = new Schema(
  {
    bedNumber: { type: Number, required: true },
    studentId: { type: String },
    studentName: { type: String },
    rollNo: { type: String },
    phone: { type: String },
    branch: { type: String },
  },
  { _id: false }
);

const RoomSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    roomNo: { type: String, required: true },
    block: { type: String, required: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true },
    occupied: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ['AC', 'Non-AC'], required: true },
    gender: { type: String, enum: ['Boys', 'Girls'], required: true },
    beds: [BedSchema],
  },
  { timestamps: true }
);

export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
