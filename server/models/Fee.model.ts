import mongoose, { Schema, Document } from 'mongoose';

export interface IFee extends Document {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  roomNo: string;
  academicYear: string;
  hostelFee: number;
  messFee: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Overdue';
  lastPaymentDate?: string;
  receiptNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    rollNo: { type: String, required: true },
    studentName: { type: String, required: true },
    roomNo: { type: String, required: true },
    academicYear: { type: String, required: true },
    hostelFee: { type: Number, required: true },
    messFee: { type: Number, required: true },
    totalFee: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Partial', 'Overdue'], required: true },
    lastPaymentDate: { type: String },
    receiptNumber: { type: String },
  },
  { timestamps: true }
);

export const FeeModel = mongoose.models.Fee || mongoose.model<IFee>('Fee', FeeSchema);
