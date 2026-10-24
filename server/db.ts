import mongoose from 'mongoose';
import { 
  DEFAULT_USERS, 
  INITIAL_ROOMS, 
  INITIAL_OUTPASS_REQUESTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_NOTICES, 
  WEEKLY_MESS_MENU, 
  INITIAL_FEE_RECORDS, 
  INITIAL_ATTENDANCE 
} from '../src/data/mockData';
import {
  UserModel,
  RoomModel,
  OutpassModel,
  ComplaintModel,
  NoticeModel,
  MessMenuModel,
  FeeModel,
  AttendanceModel
} from './models/index';

// In-Memory store fallback
let memStore = {
  users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
  rooms: JSON.parse(JSON.stringify(INITIAL_ROOMS)),
  outpasses: JSON.parse(JSON.stringify(INITIAL_OUTPASS_REQUESTS)),
  complaints: JSON.parse(JSON.stringify(INITIAL_COMPLAINTS)),
  notices: JSON.parse(JSON.stringify(INITIAL_NOTICES)),
  messMenu: JSON.parse(JSON.stringify(WEEKLY_MESS_MENU)),
  fees: JSON.parse(JSON.stringify(INITIAL_FEE_RECORDS)),
  attendance: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE)),
};

let isConnectedToMongo = false;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('localhost') || uri.includes('MY_MONGODB')) {
    console.log('[MERN Server] Running with built-in document store (MongoDB URI optional in .env)');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnectedToMongo = true;
    console.log('[MERN Server] Connected to MongoDB Atlas successfully.');
    await seedMongoDatabase();
  } catch (err: any) {
    isConnectedToMongo = false;
    console.warn('[MERN Server] MongoDB connection deferred (using in-memory document store):', err.message);
  }
}

async function seedMongoDatabase() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('[MERN Server] Seeding MongoDB with initial LBRCE collections...');
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
      console.log('[MERN Server] Seeding complete.');
    }
  } catch (err) {
    console.error('[MERN Server] Seed check error:', err);
  }
}

export const db = {
  isMongo: () => isConnectedToMongo,

  // Users
  findUserByEmailOrRoll: async (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    if (isConnectedToMongo) {
      return await UserModel.findOne({
        $or: [
          { email: clean },
          { rollNo: clean },
          { id: clean }
        ]
      }).lean();
    }
    for (const key in memStore.users) {
      const item = memStore.users[key];
      if (
        key.toLowerCase() === clean ||
        item.user.email.toLowerCase() === clean ||
        item.user.rollNo?.toLowerCase() === clean ||
        (clean === 'admin' && item.user.role === 'admin')
      ) {
        return { ...item.user, passwordHash: item.passwordHash };
      }
    }
    return null;
  },

  // Rooms
  getRooms: async () => {
    if (isConnectedToMongo) return await RoomModel.find().lean();
    return memStore.rooms;
  },

  allocateBed: async (roomId: string, bedNumber: number, student: any) => {
    if (isConnectedToMongo) {
      const room = await RoomModel.findOne({ id: roomId });
      if (room) {
        const bed = room.beds.find((b: any) => b.bedNumber === bedNumber);
        if (bed) {
          bed.studentId = student.id;
          bed.studentName = student.name;
          bed.rollNo = student.rollNo;
          bed.branch = student.branch;
          bed.phone = student.phone;
        }
        room.occupied = room.beds.filter((b: any) => !!b.studentId).length;
        await room.save();
        return await RoomModel.find().lean();
      }
    }
    memStore.rooms = memStore.rooms.map((r: any) => {
      if (r.id !== roomId) return r;
      const beds = r.beds.map((b: any) => {
        if (b.bedNumber === bedNumber) {
          return {
            ...b,
            studentId: student.id,
            studentName: student.name,
            rollNo: student.rollNo,
            branch: student.branch,
            phone: student.phone,
          };
        }
        return b;
      });
      const occupied = beds.filter((b: any) => !!b.studentId).length;
      return { ...r, beds, occupied };
    });
    return memStore.rooms;
  },

  vacateBed: async (roomId: string, bedNumber: number) => {
    if (isConnectedToMongo) {
      const room = await RoomModel.findOne({ id: roomId });
      if (room) {
        const bed = room.beds.find((b: any) => b.bedNumber === bedNumber);
        if (bed) {
          bed.studentId = undefined;
          bed.studentName = undefined;
          bed.rollNo = undefined;
          bed.branch = undefined;
          bed.phone = undefined;
        }
        room.occupied = room.beds.filter((b: any) => !!b.studentId).length;
        await room.save();
        return await RoomModel.find().lean();
      }
    }
    memStore.rooms = memStore.rooms.map((r: any) => {
      if (r.id !== roomId) return r;
      const beds = r.beds.map((b: any) => (b.bedNumber === bedNumber ? { bedNumber } : b));
      const occupied = beds.filter((b: any) => !!b.studentId).length;
      return { ...r, beds, occupied };
    });
    return memStore.rooms;
  },

  updateResidentEverywhere: async (oldStudent: any, newStudent: any) => {
    const oldRoll = (oldStudent.rollNo || '').toLowerCase();
    const oldName = (oldStudent.name || '').toLowerCase();

    // Rooms
    memStore.rooms = memStore.rooms.map((r: any) => {
      const beds = r.beds.map((b: any) => {
        if (
          (oldRoll && b.rollNo?.toLowerCase() === oldRoll) ||
          (oldName && b.studentName?.toLowerCase() === oldName) ||
          (newStudent.roomId && (r.id === newStudent.roomId || r.roomNo === newStudent.roomId) && b.bedNumber === newStudent.bedNumber)
        ) {
          return {
            ...b,
            studentName: newStudent.name,
            rollNo: newStudent.rollNo,
            branch: newStudent.branch || b.branch,
            phone: newStudent.phone || b.phone
          };
        }
        return b;
      });
      return { ...r, beds };
    });

    // Outpasses
    memStore.outpasses = memStore.outpasses.map((o: any) => {
      if ((oldRoll && o.rollNo?.toLowerCase() === oldRoll) || (oldName && o.studentName?.toLowerCase() === oldName)) {
        return {
          ...o,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return o;
    });

    // Complaints
    memStore.complaints = memStore.complaints.map((c: any) => {
      if ((oldRoll && c.rollNo?.toLowerCase() === oldRoll) || (oldName && c.studentName?.toLowerCase() === oldName)) {
        return {
          ...c,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return c;
    });

    // Fees
    memStore.fees = memStore.fees.map((f: any) => {
      if ((oldRoll && f.rollNo?.toLowerCase() === oldRoll) || (oldName && f.studentName?.toLowerCase() === oldName)) {
        return {
          ...f,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return f;
    });

    // Attendance
    memStore.attendance = memStore.attendance.map((a: any) => {
      if ((oldRoll && a.rollNo?.toLowerCase() === oldRoll) || (oldName && a.studentName?.toLowerCase() === oldName)) {
        return {
          ...a,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return a;
    });

    return { success: true };
  },

  // Outpasses
  getOutpasses: async () => {
    if (isConnectedToMongo) return await OutpassModel.find().sort({ createdAt: -1 }).lean();
    return memStore.outpasses;
  },

  createOutpass: async (data: any) => {
    const newId = `OP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    const doc = {
      ...data,
      id: newId,
      status: 'pending',
      appliedAt: dateStr,
    };
    if (isConnectedToMongo) {
      const created = await OutpassModel.create(doc);
      return created.toObject();
    }
    memStore.outpasses = [doc, ...memStore.outpasses];
    return doc;
  },

  updateOutpassStatus: async (id: string, status: string, approvedBy?: string, rejectionReason?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    const gatePassId = status === 'approved' ? `LBRCE-GP-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

    if (isConnectedToMongo) {
      await OutpassModel.findOneAndUpdate({ id }, {
        status,
        approvedBy: status === 'approved' ? approvedBy : undefined,
        approvedAt: status === 'approved' ? dateStr : undefined,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        gatePassId,
      });
      return await OutpassModel.find().sort({ createdAt: -1 }).lean();
    }
    memStore.outpasses = memStore.outpasses.map((item: any) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          approvedBy: status === 'approved' ? approvedBy : undefined,
          approvedAt: status === 'approved' ? dateStr : undefined,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined,
          gatePassId,
        };
      }
      return item;
    });
    return memStore.outpasses;
  },

  // Complaints
  getComplaints: async () => {
    if (isConnectedToMongo) return await ComplaintModel.find().sort({ createdAt: -1 }).lean();
    return memStore.complaints;
  },

  createComplaint: async (data: any) => {
    const newId = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    const doc = {
      ...data,
      id: newId,
      status: 'Pending',
      createdAt: dateStr,
    };
    if (isConnectedToMongo) {
      const created = await ComplaintModel.create(doc);
      return created.toObject();
    }
    memStore.complaints = [doc, ...memStore.complaints];
    return doc;
  },

  updateComplaintStatus: async (id: string, status: string, adminRemarks?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    if (isConnectedToMongo) {
      await ComplaintModel.findOneAndUpdate({ id }, {
        status,
        adminRemarks,
        resolvedAt: status === 'Resolved' ? dateStr : undefined,
      });
      return await ComplaintModel.find().sort({ createdAt: -1 }).lean();
    }
    memStore.complaints = memStore.complaints.map((c: any) => {
      if (c.id === id) {
        return {
          ...c,
          status,
          adminRemarks: adminRemarks !== undefined ? adminRemarks : c.adminRemarks,
          resolvedAt: status === 'Resolved' ? dateStr : c.resolvedAt,
        };
      }
      return c;
    });
    return memStore.complaints;
  },

  // Notices
  getNotices: async () => {
    if (isConnectedToMongo) return await NoticeModel.find().sort({ createdAt: -1 }).lean();
    return memStore.notices;
  },

  createNotice: async (data: any) => {
    const newId = `NOT-${Math.floor(100 + Math.random() * 900)}`;
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-GB', options);
    const doc = {
      ...data,
      id: newId,
      date: dateStr,
    };
    if (isConnectedToMongo) {
      const created = await NoticeModel.create(doc);
      return created.toObject();
    }
    memStore.notices = [doc, ...memStore.notices];
    return doc;
  },

  // Mess Menu
  getMessMenu: async () => {
    if (isConnectedToMongo) return await MessMenuModel.find().lean();
    return memStore.messMenu;
  },

  updateMessMenu: async (day: string, data: any) => {
    if (isConnectedToMongo) {
      await MessMenuModel.findOneAndUpdate({ day }, data, { upsert: true });
      return await MessMenuModel.find().lean();
    }
    memStore.messMenu = memStore.messMenu.map((m: any) => (m.day.toLowerCase() === day.toLowerCase() ? data : m));
    return memStore.messMenu;
  },

  // Fees
  getFees: async () => {
    if (isConnectedToMongo) return await FeeModel.find().lean();
    return memStore.fees;
  },

  payFee: async (id: string, amount: number) => {
    if (isConnectedToMongo) {
      const fee = await FeeModel.findOne({ id });
      if (fee) {
        const newPaid = fee.paidAmount + amount;
        const newDue = Math.max(0, fee.totalFee - newPaid);
        fee.paidAmount = newPaid;
        fee.dueAmount = newDue;
        fee.status = newDue === 0 ? 'Paid' : 'Partial';
        fee.lastPaymentDate = new Date().toISOString().slice(0, 10);
        fee.receiptNumber = `LBRCE/HST/26-REC${Math.floor(100 + Math.random() * 900)}`;
        await fee.save();
        return await FeeModel.find().lean();
      }
    }
    memStore.fees = memStore.fees.map((fee: any) => {
      if (fee.id === id) {
        const newPaid = fee.paidAmount + amount;
        const newDue = Math.max(0, fee.totalFee - newPaid);
        return {
          ...fee,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newDue === 0 ? 'Paid' : 'Partial',
          lastPaymentDate: new Date().toISOString().slice(0, 10),
          receiptNumber: `LBRCE/HST/26-REC${Math.floor(100 + Math.random() * 900)}`,
        };
      }
      return fee;
    });
    return memStore.fees;
  },

  // Attendance
  getAttendance: async () => {
    if (isConnectedToMongo) return await AttendanceModel.find().lean();
    return memStore.attendance;
  },

  toggleAttendance: async (id: string, nextStatus: string) => {
    const timeNow = nextStatus === 'Present' ? '20:30 PM' : nextStatus === 'Late' ? '20:55 PM' : '—';
    if (isConnectedToMongo) {
      await AttendanceModel.findOneAndUpdate({ id }, { status: nextStatus, checkInTime: timeNow });
      return await AttendanceModel.find().lean();
    }
    memStore.attendance = memStore.attendance.map((a: any) =>
      a.id === id ? { ...a, status: nextStatus, checkInTime: timeNow } : a
    );
    return memStore.attendance;
  },

  updateAttendanceRecord: async (record: any) => {
    if (isConnectedToMongo) {
      await AttendanceModel.findOneAndUpdate({ id: record.id }, record, { upsert: true });
      return await AttendanceModel.find().lean();
    }
    const idx = memStore.attendance.findIndex((a: any) => a.id === record.id || a.rollNo === record.rollNo);
    if (idx >= 0) {
      memStore.attendance[idx] = { ...memStore.attendance[idx], ...record };
    } else {
      memStore.attendance.push(record);
    }
    return memStore.attendance;
  },

  markAllAttendance: async (status: string, date?: string) => {
    const timeNow = status === 'Present' ? '20:30 PM' : '—';
    if (isConnectedToMongo) {
      await AttendanceModel.updateMany({}, { status, checkInTime: timeNow });
      return await AttendanceModel.find().lean();
    }
    memStore.attendance = memStore.attendance.map((a: any) => ({
      ...a,
      status,
      checkInTime: timeNow,
      ...(date ? { date } : {})
    }));
    return memStore.attendance;
  },

  resetAll: () => {
    memStore = {
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
