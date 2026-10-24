import {
  User,
  Room,
  OutpassRequest,
  Complaint,
  Notice,
  MealSchedule,
  FeeRecord,
  AttendanceRecord,
} from '../types';
import {
  DEFAULT_USERS,
  INITIAL_ROOMS,
  INITIAL_OUTPASS_REQUESTS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTICES,
  WEEKLY_MESS_MENU,
  INITIAL_FEE_RECORDS,
  INITIAL_ATTENDANCE,
} from '../data/mockData';

const KEYS = {
  CURRENT_USER: 'lbrce_hms_current_user',
  ROOMS: 'lbrce_hms_rooms',
  OUTPASSES: 'lbrce_hms_outpasses',
  COMPLAINTS: 'lbrce_hms_complaints',
  NOTICES: 'lbrce_hms_notices',
  MESS_MENU: 'lbrce_hms_mess_menu',
  FEES: 'lbrce_hms_fees',
  ATTENDANCE: 'lbrce_hms_attendance',
};

export const storageService = {
  // Current user
  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  // Rooms
  getRooms: (): Room[] => {
    try {
      const data = localStorage.getItem(KEYS.ROOMS);
      if (!data) {
        localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
        return INITIAL_ROOMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ROOMS;
    }
  },

  saveRooms: (rooms: Room[]): void => {
    localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms));
  },

  allocateBed: (roomId: string, bedNumber: number, student: { id: string; name: string; rollNo: string; branch: string; phone: string }): Room[] => {
    const rooms = storageService.getRooms();
    const updated = rooms.map((room) => {
      if (room.id !== roomId) return room;
      const beds = room.beds.map((b) => {
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
      const occupied = beds.filter((b) => !!b.studentId).length;
      return { ...room, beds, occupied };
    });
    storageService.saveRooms(updated);
    return updated;
  },

  vacateBed: (roomId: string, bedNumber: number): Room[] => {
    const rooms = storageService.getRooms();
    const updated = rooms.map((room) => {
      if (room.id !== roomId) return room;
      const beds = room.beds.map((b) => {
        if (b.bedNumber === bedNumber) {
          return { bedNumber };
        }
        return b;
      });
      const occupied = beds.filter((b) => !!b.studentId).length;
      return { ...room, beds, occupied };
    });
    storageService.saveRooms(updated);
    return updated;
  },

  updateResidentEverywhere: (
    oldStudent: { rollNo?: string; name?: string; studentId?: string },
    newStudent: { name: string; rollNo: string; branch?: string; phone?: string; roomNo?: string; block?: string; roomId?: string; bedNumber?: number }
  ) => {
    // 1. Update Rooms
    const rooms = storageService.getRooms();
    const updatedRooms = rooms.map((room) => {
      let changed = false;
      const beds = room.beds.map((b) => {
        const matchesBed = !!(newStudent.roomId && (room.id === newStudent.roomId || room.roomNo === newStudent.roomId) && b.bedNumber === newStudent.bedNumber);
        const matchesStudent = !!(
          (oldStudent.rollNo && b.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
          (oldStudent.studentId && b.studentId === oldStudent.studentId) ||
          (oldStudent.name && b.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
        );

        if (matchesBed || matchesStudent) {
          changed = true;
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
      return changed ? { ...room, beds } : room;
    });
    storageService.saveRooms(updatedRooms);

    // 2. Update Outpasses
    const outpasses = storageService.getOutpasses();
    const updatedOutpasses = outpasses.map((o) => {
      const match = !!(
        (oldStudent.rollNo && o.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.studentId && o.studentId === oldStudent.studentId) ||
        (oldStudent.name && o.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        return {
          ...o,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {}),
          ...(newStudent.block ? { block: newStudent.block } : {})
        };
      }
      return o;
    });
    storageService.saveOutpasses(updatedOutpasses);

    // 3. Update Complaints
    const complaints = storageService.getComplaints();
    const updatedComplaints = complaints.map((c) => {
      const match = !!(
        (oldStudent.rollNo && c.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.studentId && c.studentId === oldStudent.studentId) ||
        (oldStudent.name && c.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        return {
          ...c,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return c;
    });
    storageService.saveComplaints(updatedComplaints);

    // 4. Update Fees
    const fees = storageService.getFees();
    const updatedFees = fees.map((f) => {
      const match = !!(
        (oldStudent.rollNo && f.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && f.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        return {
          ...f,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return f;
    });
    storageService.saveFees(updatedFees);

    // 5. Update Attendance
    const attendance = storageService.getAttendance();
    const updatedAttendance = attendance.map((a) => {
      const match = !!(
        (oldStudent.rollNo && a.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && a.studentName?.toLowerCase() === oldStudent.name.toLowerCase())
      );
      if (match) {
        return {
          ...a,
          studentName: newStudent.name,
          rollNo: newStudent.rollNo,
          ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
        };
      }
      return a;
    });
    storageService.saveAttendance(updatedAttendance);

    // 6. Update current user if matches
    const current = storageService.getCurrentUser();
    if (
      current &&
      ((oldStudent.rollNo && current.rollNo?.toLowerCase() === oldStudent.rollNo.toLowerCase()) ||
        (oldStudent.name && current.name?.toLowerCase() === oldStudent.name.toLowerCase()))
    ) {
      storageService.setCurrentUser({
        ...current,
        name: newStudent.name,
        rollNo: newStudent.rollNo,
        ...(newStudent.branch ? { branch: newStudent.branch } : {}),
        ...(newStudent.phone ? { phone: newStudent.phone } : {}),
        ...(newStudent.roomNo ? { roomNo: newStudent.roomNo } : {})
      });
    }

    return {
      rooms: updatedRooms,
      outpasses: updatedOutpasses,
      complaints: updatedComplaints,
      fees: updatedFees,
      attendance: updatedAttendance
    };
  },

  // Outpasses
  getOutpasses: (): OutpassRequest[] => {
    try {
      const data = localStorage.getItem(KEYS.OUTPASSES);
      if (!data) {
        localStorage.setItem(KEYS.OUTPASSES, JSON.stringify(INITIAL_OUTPASS_REQUESTS));
        return INITIAL_OUTPASS_REQUESTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_OUTPASS_REQUESTS;
    }
  },

  saveOutpasses: (outpasses: OutpassRequest[]): void => {
    localStorage.setItem(KEYS.OUTPASSES, JSON.stringify(outpasses));
  },

  createOutpass: (request: Omit<OutpassRequest, 'id' | 'status' | 'appliedAt'>): OutpassRequest => {
    const list = storageService.getOutpasses();
    const newId = `OP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

    const newRequest: OutpassRequest = {
      ...request,
      id: newId,
      status: 'pending',
      appliedAt: dateStr,
    };

    const updated = [newRequest, ...list];
    storageService.saveOutpasses(updated);
    return newRequest;
  },

  updateOutpassStatus: (
    id: string,
    status: 'approved' | 'rejected',
    officerName: string,
    remarks?: string
  ): OutpassRequest[] => {
    const list = storageService.getOutpasses();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

    const updated = list.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          approvedBy: status === 'approved' ? officerName : undefined,
          approvedAt: status === 'approved' ? dateStr : undefined,
          rejectionReason: status === 'rejected' ? remarks : undefined,
          gatePassId: status === 'approved' ? `LBRCE-GP-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        };
      }
      return item;
    });
    storageService.saveOutpasses(updated);
    return updated;
  },

  // Complaints
  getComplaints: (): Complaint[] => {
    try {
      const data = localStorage.getItem(KEYS.COMPLAINTS);
      if (!data) {
        localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
        return INITIAL_COMPLAINTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_COMPLAINTS;
    }
  },

  saveComplaints: (complaints: Complaint[]): void => {
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(complaints));
  },

  createComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>): Complaint => {
    const list = storageService.getComplaints();
    const newId = `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

    const newComplaint: Complaint = {
      ...complaint,
      id: newId,
      status: 'Pending',
      createdAt: dateStr,
    };

    const updated = [newComplaint, ...list];
    storageService.saveComplaints(updated);
    return newComplaint;
  },

  updateComplaintStatus: (id: string, status: 'Pending' | 'In Progress' | 'Resolved', adminRemarks?: string): Complaint[] => {
    const list = storageService.getComplaints();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

    const updated = list.map((c) => {
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
    storageService.saveComplaints(updated);
    return updated;
  },

  // Notices
  getNotices: (): Notice[] => {
    try {
      const data = localStorage.getItem(KEYS.NOTICES);
      if (!data) {
        localStorage.setItem(KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
        return INITIAL_NOTICES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_NOTICES;
    }
  },

  addNotice: (notice: Omit<Notice, 'id' | 'date'>): Notice => {
    const list = storageService.getNotices();
    const newId = `NOT-${Math.floor(100 + Math.random() * 900)}`;
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-GB', options);

    const newNotice: Notice = {
      ...notice,
      id: newId,
      date: dateStr,
    };

    const updated = [newNotice, ...list];
    localStorage.setItem(KEYS.NOTICES, JSON.stringify(updated));
    return newNotice;
  },

  // Mess Menu
  getMessMenu: (): MealSchedule[] => {
    try {
      const data = localStorage.getItem(KEYS.MESS_MENU);
      if (!data) {
        localStorage.setItem(KEYS.MESS_MENU, JSON.stringify(WEEKLY_MESS_MENU));
        return WEEKLY_MESS_MENU;
      }
      return JSON.parse(data);
    } catch {
      return WEEKLY_MESS_MENU;
    }
  },

  updateMessMenu: (day: string, updatedDay: MealSchedule): MealSchedule[] => {
    const menu = storageService.getMessMenu();
    const updated = menu.map((m) => (m.day.toLowerCase() === day.toLowerCase() ? updatedDay : m));
    localStorage.setItem(KEYS.MESS_MENU, JSON.stringify(updated));
    return updated;
  },

  // Fees
  getFees: (): FeeRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.FEES);
      if (!data) {
        localStorage.setItem(KEYS.FEES, JSON.stringify(INITIAL_FEE_RECORDS));
        return INITIAL_FEE_RECORDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_FEE_RECORDS;
    }
  },

  payFee: (recordId: string, amount: number): FeeRecord[] => {
    const list = storageService.getFees();
    const updated = list.map((fee) => {
      if (fee.id === recordId) {
        const newPaid = fee.paidAmount + amount;
        const newDue = Math.max(0, fee.totalFee - newPaid);
        return {
          ...fee,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: (newDue === 0 ? 'Paid' : 'Partial') as 'Paid' | 'Partial',
          lastPaymentDate: new Date().toISOString().slice(0, 10),
          receiptNumber: `LBRCE/HST/26-REC${Math.floor(100 + Math.random() * 900)}`,
        };
      }
      return fee;
    });
    localStorage.setItem(KEYS.FEES, JSON.stringify(updated));
    return updated;
  },

  saveFees: (fees: FeeRecord[]): void => {
    localStorage.setItem(KEYS.FEES, JSON.stringify(fees));
  },

  // Attendance
  getAttendance: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.ATTENDANCE);
      if (!data) {
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
        return INITIAL_ATTENDANCE;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },

  saveAttendance: (attendance: AttendanceRecord[]): void => {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
  },

  toggleAttendanceStatus: (id: string, status: 'Present' | 'Absent' | 'On Outpass' | 'Late'): AttendanceRecord[] => {
    const list = storageService.getAttendance();
    const updated = list.map((a) => (a.id === id ? { ...a, status } : a));
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(updated));
    return updated;
  },

  updateAttendanceRecord: (record: AttendanceRecord): AttendanceRecord[] => {
    const list = storageService.getAttendance();
    const exists = list.some((a) => a.id === record.id || a.rollNo?.toLowerCase() === record.rollNo?.toLowerCase());
    let updated: AttendanceRecord[];
    if (exists) {
      updated = list.map((a) => (a.id === record.id || a.rollNo?.toLowerCase() === record.rollNo?.toLowerCase()) ? { ...a, ...record } : a);
    } else {
      updated = [record, ...list];
    }
    storageService.saveAttendance(updated);
    return updated;
  },

  markAllAttendance: (status: AttendanceRecord['status'], date?: string): AttendanceRecord[] => {
    const list = storageService.getAttendance();
    const timeNow = status === 'Present' ? '20:30 PM' : '—';
    const updated = list.map((a) => ({
      ...a,
      status,
      checkInTime: timeNow,
      ...(date ? { date } : {})
    }));
    storageService.saveAttendance(updated);
    return updated;
  },

  resetAllData: (): void => {
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(KEYS.OUTPASSES, JSON.stringify(INITIAL_OUTPASS_REQUESTS));
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
    localStorage.setItem(KEYS.MESS_MENU, JSON.stringify(WEEKLY_MESS_MENU));
    localStorage.setItem(KEYS.FEES, JSON.stringify(INITIAL_FEE_RECORDS));
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  },
};
