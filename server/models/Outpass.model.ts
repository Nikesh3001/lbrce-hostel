import mongoose, { Schema, Document } from 'mongoose';

export interface IOutpass extends Document {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNo: string;
  block: string;
  type: string;
  purpose: string;
  departureTime: string;
  expectedReturnTime: string;
  parentPhone: string;
  parentConsentReceived: boolean;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  gatePassId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OutpassSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    roomNo: { type: String, required: true },
    block: { type: String, required: true },
    type: { type: String, required: true },
    purpose: { type: String, required: true },
    departureTime: { type: String, required: true },
    expectedReturnTime: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentConsentReceived: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedAt: { type: String, required: true },
    approvedBy: { type: String },
    approvedAt: { type: String },
    rejectionReason: { type: String },
    gatePassId: { type: String },
  },
  { timestamps: true }
);

export const OutpassModel = mongoose.models.Outpass || mongoose.model<IOutpass>('Outpass', OutpassSchema);
