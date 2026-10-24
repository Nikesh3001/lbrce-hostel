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
import { storageService } from './storage';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // If backend server is unreachable (e.g. pure static hosting on Netlify), fallback to local storage
    console.warn(`[API] Fallback to client storage for ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: async (identifier: string, password: string): Promise<User> => {
    try {
      const data = await fetchJson<{ user: User; token: string }>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      storageService.setCurrentUser(data.user);
      return data.user;
    } catch {
      // Fallback
      return new Promise((resolve, reject) => {
        const found = storageService.getCurrentUser();
        if (found) {
          resolve(found);
        } else {
          reject(new Error('Authentication failed'));
        }
      });
    }
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    try {
      return await fetchJson<Room[]>(`${API_BASE}/rooms`);
    } catch {
      return storageService.getRooms();
    }
  },

  allocateBed: async (
    roomId: string,
    bedNumber: number,
    student: { id: string; name: string; rollNo: string; branch: string; phone: string }
  ): Promise<Room[]> => {
    try {
      return await fetchJson<Room[]>(`${API_BASE}/rooms/${roomId}/allocate`, {
        method: 'POST',
        body: JSON.stringify({ bedNumber, student }),
      });
    } catch {
      return storageService.allocateBed(roomId, bedNumber, student);
    }
  },

  vacateBed: async (roomId: string, bedNumber: number): Promise<Room[]> => {
    try {
      return await fetchJson<Room[]>(`${API_BASE}/rooms/${roomId}/vacate`, {
        method: 'POST',
        body: JSON.stringify({ bedNumber }),
      });
    } catch {
      return storageService.vacateBed(roomId, bedNumber);
    }
  },

  updateResidentEverywhere: async (
    oldStudent: { rollNo?: string; name?: string; studentId?: string },
    newStudent: { name: string; rollNo: string; branch?: string; phone?: string; roomNo?: string; block?: string; roomId?: string; bedNumber?: number }
  ) => {
    try {
      return await fetchJson(`${API_BASE}/rooms/update-resident`, {
        method: 'POST',
        body: JSON.stringify({ oldStudent, newStudent }),
      });
    } catch {
      return storageService.updateResidentEverywhere(oldStudent, newStudent);
    }
  },

  // Outpasses
  getOutpasses: async (): Promise<OutpassRequest[]> => {
    try {
      return await fetchJson<OutpassRequest[]>(`${API_BASE}/outpasses`);
    } catch {
      return storageService.getOutpasses();
    }
  },

  createOutpass: async (request: Omit<OutpassRequest, 'id' | 'status' | 'appliedAt'>): Promise<OutpassRequest> => {
    try {
      return await fetchJson<OutpassRequest>(`${API_BASE}/outpasses`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch {
      return storageService.createOutpass(request);
    }
  },

  updateOutpassStatus: async (
    id: string,
    status: 'approved' | 'rejected',
    officerName: string,
    remarks?: string
  ): Promise<OutpassRequest[]> => {
    try {
      return await fetchJson<OutpassRequest[]>(`${API_BASE}/outpasses/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, approvedBy: officerName, rejectionReason: remarks }),
      });
    } catch {
      return storageService.updateOutpassStatus(id, status, officerName, remarks);
    }
  },

  // Complaints
  getComplaints: async (): Promise<Complaint[]> => {
    try {
      return await fetchJson<Complaint[]>(`${API_BASE}/complaints`);
    } catch {
      return storageService.getComplaints();
    }
  },

  createComplaint: async (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt'>): Promise<Complaint> => {
    try {
      return await fetchJson<Complaint>(`${API_BASE}/complaints`, {
        method: 'POST',
        body: JSON.stringify(complaint),
      });
    } catch {
      return storageService.createComplaint(complaint);
    }
  },

  updateComplaintStatus: async (
    id: string,
    status: 'Pending' | 'In Progress' | 'Resolved',
    adminRemarks?: string
  ): Promise<Complaint[]> => {
    try {
      return await fetchJson<Complaint[]>(`${API_BASE}/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminRemarks }),
      });
    } catch {
      return storageService.updateComplaintStatus(id, status, adminRemarks);
    }
  },

  // Notices
  getNotices: async (): Promise<Notice[]> => {
    try {
      return await fetchJson<Notice[]>(`${API_BASE}/notices`);
    } catch {
      return storageService.getNotices();
    }
  },

  createNotice: async (notice: Omit<Notice, 'id' | 'date'>): Promise<Notice> => {
    try {
      return await fetchJson<Notice>(`${API_BASE}/notices`, {
        method: 'POST',
        body: JSON.stringify(notice),
      });
    } catch {
      return storageService.addNotice(notice);
    }
  },

  // Mess Menu
  getMessMenu: async (): Promise<MealSchedule[]> => {
    try {
      return await fetchJson<MealSchedule[]>(`${API_BASE}/mess`);
    } catch {
      return storageService.getMessMenu();
    }
  },

  updateMessMenu: async (day: string, data: MealSchedule): Promise<MealSchedule[]> => {
    try {
      return await fetchJson<MealSchedule[]>(`${API_BASE}/mess/${day}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return storageService.updateMessMenu(day, data);
    }
  },

  // Fees
  getFees: async (): Promise<FeeRecord[]> => {
    try {
      return await fetchJson<FeeRecord[]>(`${API_BASE}/fees`);
    } catch {
      return storageService.getFees();
    }
  },

  payFee: async (id: string, amount: number): Promise<FeeRecord[]> => {
    try {
      return await fetchJson<FeeRecord[]>(`${API_BASE}/fees/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    } catch {
      return storageService.payFee(id, amount);
    }
  },

  // Attendance
  getAttendance: async (): Promise<AttendanceRecord[]> => {
    try {
      return await fetchJson<AttendanceRecord[]>(`${API_BASE}/attendance`);
    } catch {
      return storageService.getAttendance();
    }
  },

  toggleAttendance: async (
    id: string,
    status: 'Present' | 'Absent' | 'On Outpass' | 'Late'
  ): Promise<AttendanceRecord[]> => {
    try {
      return await fetchJson<AttendanceRecord[]>(`${API_BASE}/attendance/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      return storageService.toggleAttendanceStatus(id, status);
    }
  },

  setAttendanceRecord: async (record: AttendanceRecord): Promise<AttendanceRecord[]> => {
    try {
      return await fetchJson<AttendanceRecord[]>(`${API_BASE}/attendance/record`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
    } catch {
      return storageService.updateAttendanceRecord(record);
    }
  },

  markAllAttendance: async (status: AttendanceRecord['status'], date?: string): Promise<AttendanceRecord[]> => {
    try {
      return await fetchJson<AttendanceRecord[]>(`${API_BASE}/attendance/mark-all`, {
        method: 'POST',
        body: JSON.stringify({ status, date }),
      });
    } catch {
      return storageService.markAllAttendance(status, date);
    }
  },

  // Reset
  resetAll: async (): Promise<void> => {
    try {
      await fetchJson(`${API_BASE}/reset`, { method: 'POST' });
    } catch {
      storageService.resetAllData();
    }
  },
};
