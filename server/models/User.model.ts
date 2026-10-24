import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  role: 'admin' | 'student';
  phone: string;
  avatar?: string;
  designation?: string;
  roomNo?: string;
  block?: string;
  branch?: string;
  year?: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String },
    role: { type: String, enum: ['admin', 'student'], required: true },
    phone: { type: String, required: true },
    avatar: { type: String },
    designation: { type: String },
    roomNo: { type: String },
    block: { type: String },
    branch: { type: String },
    year: { type: String },
    gender: { type: String },
    parentName: { type: String },
    parentPhone: { type: String },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
