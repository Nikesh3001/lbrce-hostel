import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNo: string;
  block: string;
  category: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAtStr: string;
  resolvedAt?: string;
  adminRemarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ComplaintSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    roomNo: { type: String, required: true },
    block: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Emergency'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    createdAtStr: { type: String, required: true },
    resolvedAt: { type: String },
    adminRemarks: { type: String },
  },
  { timestamps: true }
);

export const ComplaintModel = mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
