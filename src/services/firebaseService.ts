import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  User,
  Room,
  OutpassRequest,
  Complaint,
  Notice,
  MealSchedule,
  FeeRecord,
  AttendanceRecord
} from '../types';
import {
  DEFAULT_USERS,
  INITIAL_ROOMS,
  INITIAL_OUTPASS_REQUESTS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTICES,
  WEEKLY_MESS_MENU,
  INITIAL_FEE_RECORDS,
  INITIAL_ATTENDANCE
} from '../data/mockData';

export interface AuditLogItem {
  id?: string;
  timestamp: string;
  action: string;
  actorUid: string;
  actorName: string;
  role: string;
  details: string;
}

// ----------------- AUDIT LOGGING -----------------
export async function recordAuditLog(
  action: string,
  actor: { uid?: string; name: string; role: string },
  details: string
): Promise<void> {
  try {
    const logsRef = collection(db, 'auditLogs');
    const logDoc: AuditLogItem = {
      timestamp: new Date().toISOString(),
      action,
      actorUid: actor.uid || 'anonymous',
      actorName: actor.name,
      role: actor.role,
      details
    };
    await addDoc(logsRef, {
      ...logDoc,
      serverTime: serverTimestamp()
    });
  } catch (err) {
    console.warn('[Firebase] Audit log write deferred:', err);
  }
}

export function subscribeAuditLogs(callback: (logs: AuditLogItem[]) => void) {
  const logsRef = collection(db, 'auditLogs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const logs: AuditLogItem[] = [];
    snapshot.forEach((d) => {
      logs.push({ id: d.id, ...(d.data() as Omit<AuditLogItem, 'id'>) });
    });
    callback(logs);
  }, (err) => {
    console.warn('[Firebase] Audit log subscription error:', err);
  });
}

// ----------------- SEED CHECK -----------------
export async function checkAndSeedFirestore(): Promise<void> {
  try {
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    if (roomsSnap.empty) {
      console.log('[Firebase] Initializing Cloud Firestore with LBRCE collections...');
      
      // Rooms
      for (const room of INITIAL_ROOMS) {
        await setDoc(doc(db, 'rooms', room.id), room);
      }
      // Outpasses
      for (const op of INITIAL_OUTPASS_REQUESTS) {
        await setDoc(doc(db, 'outpasses', op.id), op);
      }
      // Complaints
      for (const cmp of INITIAL_COMPLAINTS) {
        await setDoc(doc(db, 'complaints', cmp.id), cmp);
      }
      // Notices
      for (const notif of INITIAL_NOTICES) {
        await setDoc(doc(db, 'notices', notif.id), notif);
      }
      // Mess
      for (const m of WEEKLY_MESS_MENU) {
        await setDoc(doc(db, 'messMenu', m.day.toLowerCase()), m);
      }
      // Fees
      for (const f of INITIAL_FEE_RECORDS) {
        await setDoc(doc(db, 'fees', f.id), f);
      }
      // Attendance
      for (const att of INITIAL_ATTENDANCE) {
        await setDoc(doc(db, 'attendance', att.id), att);
      }
      // Users
      for (const key of Object.keys(DEFAULT_USERS)) {
        const u = DEFAULT_USERS[key].user;
        await setDoc(doc(db, 'users', u.id), u);
      }

      await recordAuditLog(
        'SYSTEM_SEED',
        { name: 'System', role: 'admin' },
        'Initial LBRCE hostel dataset seeded to Cloud Firestore'
      );
      console.log('[Firebase] Cloud Firestore seeding completed.');
    }
  } catch (err) {
    console.warn('[Firebase] Seeding check deferred:', err);
  }
}

// ----------------- ROOMS -----------------
export function subscribeRooms(callback: (rooms: Room[]) => void) {
  const ref = collection(db, 'rooms');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_ROOMS);
      return;
    }
    const list: Room[] = [];
    snap.forEach((d) => list.push(d.data() as Room));
    callback(list);
  }, () => {
    callback(INITIAL_ROOMS);
  });
}

export async function allocateBedInFirestore(
  roomId: string,
  bedNumber: number,
  student: { id: string; name: string; rollNo: string; branch: string; phone: string },
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    const room = snap.data() as Room;
    const updatedBeds = room.beds.map((b) => {
      if (b.bedNumber === bedNumber) {
        return {
          ...b,
          studentId: student.id,
          studentName: student.name,
          rollNo: student.rollNo,
          branch: student.branch,
          phone: student.phone
        };
      }
      return b;
    });
    const occupied = updatedBeds.filter((b) => !!b.studentId).length;
    await updateDoc(roomRef, { beds: updatedBeds, occupied });
    await recordAuditLog(
      'ROOM_ALLOCATION',
      actor,
      `Allocated Bed #${bedNumber} in ${room.roomNo} (${room.block}) to ${student.name} [${student.rollNo}]`
    );
  } else {
    const localRoom = INITIAL_ROOMS.find((r) => r.id === roomId || r.roomNo === roomId);
    if (localRoom) {
      const updatedBeds = localRoom.beds.map((b) => {
        if (b.bedNumber === bedNumber) {
          return {
            ...b,
            studentId: student.id,
            studentName: student.name,
            rollNo: student.rollNo,
            branch: student.branch,
            phone: student.phone
          };
        }
        return b;
      });
      const occupied = updatedBeds.filter((b) => !!b.studentId).length;
      await setDoc(roomRef, { ...localRoom, beds: updatedBeds, occupied });
      await recordAuditLog(
        'ROOM_ALLOCATION',
        actor,
        `Allocated Bed #${bedNumber} in ${localRoom.roomNo} (${localRoom.block}) to ${student.name} [${student.rollNo}]`
      );
    }
  }
}

export async function vacateBedInFirestore(
  roomId: string,
  bedNumber: number,
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    const room = snap.data() as Room;
    const prevBed = room.beds.find((b) => b.bedNumber === bedNumber);
    const updatedBeds = room.beds.map((b) => (b.bedNumber === bedNumber ? { bedNumber } : b));
    const occupied = updatedBeds.filter((b) => !!b.studentId).length;
    await updateDoc(roomRef, { beds: updatedBeds, occupied });
    await recordAuditLog(
      'ROOM_VACATE',
      actor,
      `Vacated Bed #${bedNumber} in ${room.roomNo} (${room.block}), formerly assigned to ${prevBed?.studentName || 'Student'}`
    );
  } else {
    const localRoom = INITIAL_ROOMS.find((r) => r.id === roomId || r.roomNo === roomId);
    if (localRoom) {
      const prevBed = localRoom.beds.find((b) => b.bedNumber === bedNumber);
      const updatedBeds = localRoom.beds.map((b) => (b.bedNumber === bedNumber ? { bedNumber } : b));
      const occupied = updatedBeds.filter((b) => !!b.studentId).length;
      await setDoc(roomRef, { ...localRoom, beds: updatedBeds, occupied });
      await recordAuditLog(
        'ROOM_VACATE',
        actor,
        `Vacated Bed #${bedNumber} in ${localRoom.roomNo} (${localRoom.block}), formerly assigned to ${prevBed?.studentName || 'Student'}`
      );
    }
  }
}

export async function updateResidentEverywhereInFirestore(
  roomId: string,
  bedNumber: number,
  oldStudent: { rollNo?: string; name?: string; studentId?: string },
  newStudent: { name: string; rollNo: string; branch?: string; phone?: string; roomNo?: string; block?: string },
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  try {
    // 1. Update Room Doc
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const room = snap.data() as Room;
      const updatedBeds = room.beds.map((b) => {
        if (b.bedNumber === bedNumber) {
          return {
            ...b,
            studentName: newStudent.name,
            rollNo: newStudent.rollNo,
            branch: newStudent.branch || b.branch || 'CSE',
            phone: newStudent.phone || b.phone || '+91 98480 00000',
          };
        }
        return b;
      });
      await updateDoc(roomRef, { beds: updatedBeds });
    }

    // 2. Query and update Outpasses
    const outpassSnap = await getDocs(collection(db, 'outpasses'));
    for (const d of outpassSnap.docs) {
      const o = d.data() as OutpassRequest;
      const match = !!(
        (oldStudent.rollNo && o.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && o.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        await updateDoc(d.ref, {
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        });
      }
    }

    // 3. Query and update Complaints
    const compSnap = await getDocs(collection(db, 'complaints'));
    for (const d of compSnap.docs) {
      const c = d.data() as Complaint;
      const match = !!(
        (oldStudent.rollNo && c.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && c.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        await updateDoc(d.ref, {
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        });
      }
    }

    // 4. Query and update Fees
    const feeSnap = await getDocs(collection(db, 'fees'));
    for (const d of feeSnap.docs) {
      const f = d.data() as FeeRecord;
      const match = !!(
        (oldStudent.rollNo && f.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && f.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        await updateDoc(d.ref, {
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        });
      }
    }

    // 5. Query and update Attendance
    const attSnap = await getDocs(collection(db, 'attendance'));
    for (const d of attSnap.docs) {
      const a = d.data() as AttendanceRecord;
      const match = !!(
        (oldStudent.rollNo && a.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && a.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        await updateDoc(d.ref, {
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        });
      }
    }

    // 6. Query and update Users
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) {
      const u = d.data() as User;
      const match = !!(
        (oldStudent.rollNo && u.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && u.name?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        await updateDoc(d.ref, {
          name: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.branch ? { branch: newStudent.branch } : {}),
          ...(newStudent.phone ? { phone: newStudent.phone } : {}),
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        });
      }
    }

    // 7. Record immutable audit log
    await recordAuditLog(
      'STUDENT_UPDATED_EVERYWHERE',
      actor,
      `Resident profile updated from "${oldStudent.name || 'Student'}" (${oldStudent.rollNo || ''}) to "${newStudent.name}" (${newStudent.rollNo}) across Rooms, Outpasses, Complaints, Attendance, and Fees.`
    );
  } catch (err) {
    console.warn('[Firebase] Error propagating resident update:', err);
  }
}

// ----------------- OUTPASSES -----------------
export function subscribeOutpasses(callback: (outpasses: OutpassRequest[]) => void) {
  const ref = collection(db, 'outpasses');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_OUTPASS_REQUESTS);
      return;
    }
    const list: OutpassRequest[] = [];
    snap.forEach((d) => list.push(d.data() as OutpassRequest));
    // Sort descending by appliedAt
    list.sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
    callback(list);
  }, () => {
    callback(INITIAL_OUTPASS_REQUESTS);
  });
}

export async function createOutpassInFirestore(
  data: Omit<OutpassRequest, 'id' | 'status' | 'appliedAt'>,
  actor: { uid?: string; name: string; role: string }
): Promise<OutpassRequest> {
  const newId = `OP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
  const newOutpass: OutpassRequest = {
    ...data,
    id: newId,
    status: 'pending',
    appliedAt: dateStr
  };
  await setDoc(doc(db, 'outpasses', newId), newOutpass);
  await recordAuditLog(
    'OUTPASS_APPLIED',
    actor,
    `New outpass requested by ${data.studentName} [${data.rollNo}] for '${data.purpose}' (${data.type})`
  );
  return newOutpass;
}

export async function updateOutpassStatusInFirestore(
  id: string,
  status: 'approved' | 'rejected',
  actor: { uid?: string; name: string; role: string },
  rejectionReason?: string
): Promise<void> {
  const outpassRef = doc(db, 'outpasses', id);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
  const gatePassId = status === 'approved' ? `LBRCE-GP-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

  const updates: Partial<OutpassRequest> = {
    status,
    approvedBy: status === 'approved' ? actor.name : undefined,
    approvedAt: status === 'approved' ? dateStr : undefined,
    rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    gatePassId
  };

  await updateDoc(outpassRef, updates);
  await recordAuditLog(
    status === 'approved' ? 'OUTPASS_APPROVED' : 'OUTPASS_REJECTED',
    actor,
    `Outpass ${id} ${status.toUpperCase()} by ${actor.name}. Gate Pass ID: ${gatePassId || 'N/A'}. Reason: ${rejectionReason || 'None'}`
  );
}

// ----------------- COMPLAINTS -----------------
export function subscribeComplaints(callback: (complaints: Complaint[]) => void) {
  const ref = collection(db, 'complaints');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_COMPLAINTS);
      return;
    }
    const list: Complaint[] = [];
    snap.forEach((d) => list.push(d.data() as Complaint));
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(list);
  }, () => {
    callback(INITIAL_COMPLAINTS);
  });
}

export async function createComplaintInFirestore(
  data: Omit<Complaint, 'id' | 'status' | 'createdAt'>,
  actor: { uid?: string; name: string; role: string }
): Promise<Complaint> {
  const newId = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
  const newComplaint: Complaint = {
    ...data,
    id: newId,
    status: 'Pending',
    createdAt: dateStr
  };
  await setDoc(doc(db, 'complaints', newId), newComplaint);
  await recordAuditLog(
    'COMPLAINT_FILED',
    actor,
    `Complaint ${newId} (${data.category}): '${data.title}' lodged for Room ${data.roomNo}`
  );
  return newComplaint;
}

export async function updateComplaintStatusInFirestore(
  id: string,
  status: 'Pending' | 'In Progress' | 'Resolved',
  actor: { uid?: string; name: string; role: string },
  adminRemarks?: string
): Promise<void> {
  const cmpRef = doc(db, 'complaints', id);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

  const updates: Partial<Complaint> = {
    status,
    adminRemarks,
    resolvedAt: status === 'Resolved' ? dateStr : undefined
  };

  await updateDoc(cmpRef, updates);
  await recordAuditLog(
    'COMPLAINT_UPDATED',
    actor,
    `Complaint ${id} status set to '${status}'. Remarks: ${adminRemarks || 'None'}`
  );
}

// ----------------- NOTICES -----------------
export function subscribeNotices(callback: (notices: Notice[]) => void) {
  const ref = collection(db, 'notices');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_NOTICES);
      return;
    }
    const list: Notice[] = [];
    snap.forEach((d) => list.push(d.data() as Notice));
    callback(list);
  }, () => {
    callback(INITIAL_NOTICES);
  });
}

export async function publishNoticeInFirestore(
  data: Omit<Notice, 'id' | 'date'>,
  actor: { uid?: string; name: string; role: string }
): Promise<Notice> {
  const newId = `NOT-${Math.floor(100 + Math.random() * 900)}`;
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const dateStr = new Date().toLocaleDateString('en-GB', options);
  const newNotice: Notice = {
    ...data,
    id: newId,
    date: dateStr
  };
  await setDoc(doc(db, 'notices', newId), newNotice);
  await recordAuditLog(
    'NOTICE_PUBLISHED',
    actor,
    `Circular published: '${data.title}' [Audience: ${data.targetAudience}]`
  );
  return newNotice;
}

// ----------------- MESS MENU -----------------
export function subscribeMessMenu(callback: (menu: MealSchedule[]) => void) {
  const ref = collection(db, 'messMenu');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(WEEKLY_MESS_MENU);
      return;
    }
    const list: MealSchedule[] = [];
    snap.forEach((d) => list.push(d.data() as MealSchedule));
    callback(list);
  }, () => {
    callback(WEEKLY_MESS_MENU);
  });
}

export async function updateMessDayInFirestore(
  day: string,
  data: MealSchedule,
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const ref = doc(db, 'messMenu', day.toLowerCase());
  await setDoc(ref, data);
  await recordAuditLog(
    'MESS_MENU_UPDATED',
    actor,
    `Mess schedule updated for ${day}`
  );
}

// ----------------- FEES -----------------
export function subscribeFees(callback: (fees: FeeRecord[]) => void) {
  const ref = collection(db, 'fees');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_FEE_RECORDS);
      return;
    }
    const list: FeeRecord[] = [];
    snap.forEach((d) => list.push(d.data() as FeeRecord));
    callback(list);
  }, () => {
    callback(INITIAL_FEE_RECORDS);
  });
}

export async function recordFeePaymentInFirestore(
  id: string,
  amount: number,
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const feeRef = doc(db, 'fees', id);
  const snap = await getDoc(feeRef);
  if (snap.exists()) {
    const fee = snap.data() as FeeRecord;
    const newPaid = fee.paidAmount + amount;
    const newDue = Math.max(0, fee.totalFee - newPaid);
    const receiptNo = `LBRCE/HST/26-REC${Math.floor(100 + Math.random() * 900)}`;

    await updateDoc(feeRef, {
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newDue === 0 ? 'Paid' : 'Partial',
      lastPaymentDate: new Date().toISOString().slice(0, 10),
      receiptNumber: receiptNo
    });

    await recordAuditLog(
      'FEE_PAYMENT',
      actor,
      `Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${fee.studentName} [${fee.rollNo}]. Receipt: ${receiptNo}`
    );
  }
}

// ----------------- ATTENDANCE -----------------
export function subscribeAttendance(callback: (records: AttendanceRecord[]) => void) {
  const ref = collection(db, 'attendance');
  return onSnapshot(ref, (snap) => {
    if (snap.empty) {
      callback(INITIAL_ATTENDANCE);
      return;
    }
    const list: AttendanceRecord[] = [];
    snap.forEach((d) => list.push(d.data() as AttendanceRecord));
    callback(list);
  }, () => {
    callback(INITIAL_ATTENDANCE);
  });
}

export async function toggleAttendanceInFirestore(
  id: string,
  status: AttendanceRecord['status'],
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const ref = doc(db, 'attendance', id);
  const timeNow = status === 'Present' ? '20:30 PM' : status === 'Late' ? '20:55 PM' : '—';
  await updateDoc(ref, { status, checkInTime: timeNow });
  await recordAuditLog(
    'ATTENDANCE_ROLLCALL',
    actor,
    `Roll call status toggled to '${status}' for record ID ${id}`
  );
}

export async function setAttendanceRecordInFirestore(
  record: AttendanceRecord,
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const ref = doc(db, 'attendance', record.id);
  await setDoc(ref, record, { merge: true });
  await recordAuditLog(
    'ATTENDANCE_ROLLCALL',
    actor,
    `Night roll call: ${record.studentName} [${record.rollNo}] marked ${record.status.toUpperCase()} (${record.checkInTime || '8:30 PM'})`
  );
}

export async function markAllAttendanceInFirestore(
  records: AttendanceRecord[],
  status: AttendanceRecord['status'],
  actor: { uid?: string; name: string; role: string }
): Promise<void> {
  const timeNow = status === 'Present' ? '20:30 PM' : '—';
  for (const r of records) {
    const ref = doc(db, 'attendance', r.id);
    await setDoc(ref, { ...r, status, checkInTime: timeNow }, { merge: true });
  }
  await recordAuditLog(
    'ROLLCALL_BULK_UPDATE',
    actor,
    `Bulk marked all ${records.length} hostellers as '${status}' in Night Roll Call`
  );
}

export async function syncAttendanceWithRoomsInFirestore(
  rooms: Room[],
  date: string,
  actor: { uid?: string; name: string; role: string }
): Promise<AttendanceRecord[]> {
  try {
    const attRef = collection(db, 'attendance');
    const snap = await getDocs(attRef);
    const existing = snap.docs.map((d) => d.data() as AttendanceRecord);

    const synced: AttendanceRecord[] = [...existing];
    for (const room of rooms) {
      for (const bed of room.beds) {
        if (bed.studentId && bed.rollNo) {
          const found = synced.find((a) => a.rollNo?.toLowerCase() === bed.rollNo?.toLowerCase());
          if (!found) {
            const newRec: AttendanceRecord = {
              id: `ATT-${bed.rollNo.toUpperCase()}-${date.replace(/\D/g, '') || '20261024'}`,
              date,
              rollNo: bed.rollNo,
              studentName: bed.studentName || 'Student',
              roomNo: room.roomNo,
              block: room.block,
              status: 'Present',
              checkInTime: '20:30 PM',
              remarks: 'Auto-synced from room allocation'
            };
            synced.push(newRec);
            await setDoc(doc(db, 'attendance', newRec.id), newRec);
          }
        }
      }
    }
    return synced;
  } catch (err) {
    console.warn('[Firebase] syncAttendanceWithRooms error:', err);
    return [];
  }
}

