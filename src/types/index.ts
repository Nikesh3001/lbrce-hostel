export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  designation?: string; // e.g., 'Chief Warden' for admin
  roomNo?: string;
  block?: string;
  branch?: string;
  year?: string;
  gender?: 'Male' | 'Female';
  parentName?: string;
  parentPhone?: string;
}

export interface BedAllocation {
  bedNumber: number;
  studentId?: string;
  studentName?: string;
  rollNo?: string;
  phone?: string;
  branch?: string;
}

export interface Room {
  id: string;
  roomNo: string;
  block: string;
  floor: number;
  capacity: number;
  occupied: number;
  type: 'AC' | 'Non-AC';
  gender: 'Boys' | 'Girls';
  beds: BedAllocation[];
}

export type OutpassType = 'Local Outing' | 'Home Visit' | 'Academic / Industrial Visit' | 'Medical Emergency';
export type OutpassStatus = 'pending' | 'approved' | 'rejected';

export interface OutpassRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNo: string;
  block: string;
  type: OutpassType;
  purpose: string;
  departureTime: string;
  expectedReturnTime: string;
  parentPhone: string;
  parentConsentReceived: boolean;
  status: OutpassStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  gatePassId?: string;
  actualReturnTime?: string;
}

export type ComplaintCategory = 
  | 'Electrical' 
  | 'Plumbing' 
  | 'Wi-Fi & Network' 
  | 'Carpentry & Furniture' 
  | 'Mess & Drinking Water' 
  | 'Cleanliness & Washroom' 
  | 'Security & Discipline';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNo: string;
  block: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
  adminRemarks?: string;
}

export interface Notice {
  id: string;
  title: string;
  category: 'General' | 'Curfew' | 'Mess' | 'Holiday' | 'Maintenance';
  content: string;
  targetAudience: 'All Residents' | 'Boys Hostels' | 'Girls Hostels';
  date: string;
  isUrgent: boolean;
  postedBy: string;
}

export interface MealSchedule {
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  specialNote?: string;
}

export interface FeeRecord {
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
}

export interface AttendanceRecord {
  id: string;
  date: string;
  rollNo: string;
  studentName: string;
  roomNo: string;
  block: string;
  status: 'Present' | 'Absent' | 'On Outpass' | 'Late';
  checkInTime?: string;
  remarks?: string;
}
