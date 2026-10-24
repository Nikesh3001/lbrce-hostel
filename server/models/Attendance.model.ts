import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  id: string;
  date: string;
  rollNo: string;
  studentName: string;
  roomNo: string;
  block: string;
  status: 'Present' | 'Absent' | 'On Outpass' | 'Late';
  checkInTime?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    rollNo: { type: String, required: true },
    studentName: { type: String, required: true },
    roomNo: { type: String, required: true },
    block: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'On Outpass', 'Late'], required: true },
    checkInTime: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const AttendanceModel = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
