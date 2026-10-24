import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  DEFAULT_USERS, 
  INITIAL_ROOMS, 
  INITIAL_OUTPASS_REQUESTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_NOTICES, 
  WEEKLY_MESS_MENU, 
  INITIAL_FEE_RECORDS, 
  INITIAL_ATTENDANCE 
} from '../../src/data/mockData';
import {
  UserModel,
  RoomModel,
  OutpassModel,
  ComplaintModel,
  NoticeModel,
  MessMenuModel,
  FeeModel,
  AttendanceModel
} from '../models/index';

dotenv.config();

let isConnected = false;

// High-fidelity In-Memory Database store with real document references
let memoryStore = {
  users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
  rooms: JSON.parse(JSON.stringify(INITIAL_ROOMS)),
  outpasses: JSON.parse(JSON.stringify(INITIAL_OUTPASS_REQUESTS)),
  complaints: JSON.parse(JSON.stringify(INITIAL_COMPLAINTS)),
  notices: JSON.parse(JSON.stringify(INITIAL_NOTICES)),
  messMenu: JSON.parse(JSON.stringify(WEEKLY_MESS_MENU)),
  fees: JSON.parse(JSON.stringify(INITIAL_FEE_RECORDS)),
  attendance: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE)),
};

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('localhost') || uri.includes('MY_MONGODB')) {
    console.log('[MERN Database] Operating on In-Memory MongoDB Document Store (Mongoose Schema Validated)');
    return false;
  }

  try {
    mongoose.connection.on('connected', () => console.log('[MERN Database] Mongoose event: Connected to MongoDB Atlas'));
    mongoose.connection.on('error', (err) => console.warn('[MERN Database] Mongoose event: Connection error', err));
    mongoose.connection.on('disconnected', () => console.log('[MERN Database] Mongoose event: Disconnected'));

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('[MERN Database] Successfully connected to MongoDB Atlas cluster.');
    await seedMongo();
    return true;
  } catch (err: any) {
    isConnected = false;
    console.warn('[MERN Database] MongoDB Atlas connection deferred, using In-Memory Document Store:', err.message);
    return false;
  }
}

export async function seedMongo() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('[MERN Database] Seeding initial collections in MongoDB...');
      const userDocs = Object.keys(DEFAULT_USERS).map((k) => ({
        ...DEFAULT_USERS[k].user,
        passwordHash: DEFAULT_USERS[k].passwordHash,
      }));
      await UserModel.insertMany(userDocs);
      await RoomModel.insertMany(INITIAL_ROOMS);
      await OutpassModel.insertMany(INITIAL_OUTPASS_REQUESTS);
      await ComplaintModel.insertMany(INITIAL_COMPLAINTS);
      await NoticeModel.insertMany(INITIAL_NOTICES);
      await MessMenuModel.insertMany(WEEKLY_MESS_MENU);
      await FeeModel.insertMany(INITIAL_FEE_RECORDS);
      await AttendanceModel.insertMany(INITIAL_ATTENDANCE);
      console.log('[MERN Database] MongoDB collections seeded successfully.');
    }
  } catch (err) {
    console.error('[MERN Database] Error seeding MongoDB:', err);
  }
}

export const mernDb = {
  isMongoActive: () => isConnected,
  getMemoryStore: () => memoryStore,
  resetMemoryStore: () => {
    memoryStore = {
      users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
      rooms: JSON.parse(JSON.stringify(INITIAL_ROOMS)),
      outpasses: JSON.parse(JSON.stringify(INITIAL_OUTPASS_REQUESTS)),
      complaints: JSON.parse(JSON.stringify(INITIAL_COMPLAINTS)),
      notices: JSON.parse(JSON.stringify(INITIAL_NOTICES)),
      messMenu: JSON.parse(JSON.stringify(WEEKLY_MESS_MENU)),
      fees: JSON.parse(JSON.stringify(INITIAL_FEE_RECORDS)),
      attendance: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE)),
    };
  }
};
