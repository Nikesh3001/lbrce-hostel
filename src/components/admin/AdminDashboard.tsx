import React, { useState, useEffect } from 'react';
import { 
  User, 
  Room, 
  OutpassRequest, 
  Complaint, 
  Notice, 
  MealSchedule, 
  FeeRecord, 
  AttendanceRecord 
} from '../../types';
import { storageService } from '../../services/storage';
import { api } from '../../services/api';
import {
  subscribeRooms,
  subscribeOutpasses,
  subscribeComplaints,
  subscribeNotices,
  subscribeMessMenu,
  subscribeFees,
  subscribeAttendance,
  subscribeAuditLogs,
  allocateBedInFirestore,
  vacateBedInFirestore,
  updateOutpassStatusInFirestore,
  updateComplaintStatusInFirestore,
  publishNoticeInFirestore,
  updateMessDayInFirestore,
  toggleAttendanceInFirestore,
  setAttendanceRecordInFirestore,
  markAllAttendanceInFirestore,
  syncAttendanceWithRoomsInFirestore,
  updateResidentEverywhereInFirestore,
  recordAuditLog,
  AuditLogItem
} from '../../services/firebaseService';
import { DigitalGatePassModal } from '../outpass/DigitalGatePassModal';
import {
  LayoutDashboard,
  FileCheck2,
  Bed,
  Wrench,
  UtensilsCrossed,
  BellRing,
  ClipboardCheck,
  Receipt,
  Users,
  Search,
  Check,
  X,
  Plus,
  Phone,
  Clock,
  Building,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  ScrollText,
  Activity,
  Flame
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'outpass' | 'rooms' | 'complaints' | 'attendance' | 'mess' | 'notices' | 'fees' | 'audit'
  >('overview');

  // Local state initialized from storageService
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>(storageService.getOutpasses());
  const [rooms, setRooms] = useState<Room[]>(storageService.getRooms());
  const [complaints, setComplaints] = useState<Complaint[]>(storageService.getComplaints());
  const [notices, setNotices] = useState<Notice[]>(storageService.getNotices());
  const [messMenu, setMessMenu] = useState<MealSchedule[]>(storageService.getMessMenu());
  const [fees, setFees] = useState<FeeRecord[]>(storageService.getFees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(storageService.getAttendance());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [sendingTestPing, setSendingTestPing] = useState(false);

  // Search & filters
  const [outpassFilter, setOutpassFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'Pending' | 'In Progress' | 'Resolved'>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedGatePass, setSelectedGatePass] = useState<OutpassRequest | null>(null);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Allocate Bed Modal
  const [allocatingBed, setAllocatingBed] = useState<{ roomId: string; bedNumber: number; roomNo: string } | null>(null);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    rollNo: '',
    branch: 'CSE',
    phone: '',
  });

  // Vacate Bed Modal
  const [vacatingBed, setVacatingBed] = useState<{ roomId: string; bedNumber: number; roomNo: string; studentName?: string } | null>(null);

  // Edit Resident Modal (propagates everywhere)
  const [editingResident, setEditingResident] = useState<{
    roomId: string;
    roomNo: string;
    block: string;
    bedNumber: number;
    studentId: string;
    oldName: string;
    oldRollNo: string;
    name: string;
    rollNo: string;
    branch: string;
    phone: string;
  } | null>(null);

  // Complaint edit remarks
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [complaintStatusInput, setComplaintStatusInput] = useState<'Pending' | 'In Progress' | 'Resolved'>('In Progress');
  const [complaintRemarksInput, setComplaintRemarksInput] = useState('');

  // New Notice form
  const [showNewNoticeModal, setShowNewNoticeModal] = useState(false);
  const [newNoticeData, setNewNoticeData] = useState({
    title: '',
    category: 'General' as Notice['category'],
    content: '',
    targetAudience: 'All Residents' as Notice['targetAudience'],
    isUrgent: false,
  });

  // Mess edit modal
  const [editingMealDay, setEditingMealDay] = useState<MealSchedule | null>(null);

  // Real-time Cloud Firestore Subscriptions
  useEffect(() => {
    const unsubRooms = subscribeRooms(setRooms);
    const unsubOutpasses = subscribeOutpasses(setOutpasses);
    const unsubComplaints = subscribeComplaints(setComplaints);
    const unsubNotices = subscribeNotices(setNotices);
    const unsubMess = subscribeMessMenu(setMessMenu);
    const unsubFees = subscribeFees(setFees);
    const unsubAttendance = subscribeAttendance(setAttendance);
    const unsubLogs = subscribeAuditLogs(setAuditLogs);

    return () => {
      unsubRooms();
      unsubOutpasses();
      unsubComplaints();
      unsubNotices();
      unsubMess();
      unsubFees();
      unsubAttendance();
      unsubLogs();
    };
  }, []);

  // Handlers with Dual Firestore + Express API Sync & Immutable Audit Logging
  const handleApproveOutpass = async (id: string) => {
    const wardenTitle = `${currentUser.name} (${currentUser.designation || 'Chief Warden'})`;
    const today = new Date().toISOString().slice(0, 10);
    const newGatePassId = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Optimistic UI update
    setOutpasses((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'approved',
              approvedBy: wardenTitle,
              approvedAt: today,
              gatePassId: o.gatePassId || newGatePassId
            }
          : o
      )
    );

    await Promise.allSettled([
      updateOutpassStatusInFirestore(
        id,
        'approved',
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.updateOutpassStatus(id, 'approved', wardenTitle).catch(() => {})
    ]);
  };

  const handleRejectOutpass = async (id: string) => {
    const reason = rejectionReason || 'Parent telephonic consent could not be verified / Disciplinary hold';

    // Optimistic UI update
    setOutpasses((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'rejected',
              rejectionReason: reason
            }
          : o
      )
    );

    await Promise.allSettled([
      updateOutpassStatusInFirestore(
        id,
        'rejected',
        { uid: currentUser.id, name: currentUser.name, role: 'admin' },
        reason
      ),
      api.updateOutpassStatus(id, 'rejected', currentUser.name, reason).catch(() => {})
    ]);
    setRejectionModalId(null);
    setRejectionReason('');
  };

  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingBed || !newStudentData.name || !newStudentData.rollNo) return;

    const studentObj = {
      id: `st_${Date.now()}`,
      name: newStudentData.name,
      rollNo: newStudentData.rollNo,
      branch: newStudentData.branch,
      phone: newStudentData.phone || '+91 98480 00000',
    };

    // Optimistic UI state update
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id === allocatingBed.roomId || r.roomNo === allocatingBed.roomNo) {
          const beds = r.beds.map((b) =>
            b.bedNumber === allocatingBed.bedNumber
              ? { ...b, studentId: studentObj.id, studentName: studentObj.name, rollNo: studentObj.rollNo, branch: studentObj.branch, phone: studentObj.phone }
              : b
          );
          const occupied = beds.filter((b) => !!b.studentId).length;
          return { ...r, beds, occupied };
        }
        return r;
      })
    );

    await Promise.allSettled([
      allocateBedInFirestore(
        allocatingBed.roomId,
        allocatingBed.bedNumber,
        studentObj,
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.allocateBed(allocatingBed.roomId, allocatingBed.bedNumber, studentObj).catch(() => {})
    ]);
    setAllocatingBed(null);
    setNewStudentData({ name: '', rollNo: '', branch: 'CSE', phone: '' });
  };

  const confirmVacateBed = async (roomId: string, bedNumber: number) => {
    // 1. Optimistic local state update: clear the bed immediately in the UI
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id === roomId || r.roomNo === roomId) {
          const beds = r.beds.map((b) => (b.bedNumber === bedNumber ? { bedNumber } : b));
          const occupied = beds.filter((b) => !!b.studentId).length;
          return { ...r, beds, occupied };
        }
        return r;
      })
    );
    setVacatingBed(null);

    // 2. Parallel Cloud Firestore + Express API sync with audit logging
    await Promise.allSettled([
      vacateBedInFirestore(
        roomId,
        bedNumber,
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.vacateBed(roomId, bedNumber).catch(() => storageService.vacateBed(roomId, bedNumber))
    ]);
  };

  const handleSaveResidentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident || !editingResident.name.trim() || !editingResident.rollNo.trim()) return;

    const oldName = editingResident.oldName;
    const oldRoll = editingResident.oldRollNo;
    const newName = editingResident.name.trim();
    const newRoll = editingResident.rollNo.trim().toUpperCase();
    const newBranch = editingResident.branch || 'CSE';
    const newPhone = editingResident.phone || '+91 98480 00000';
    const { roomId, roomNo, block, bedNumber } = editingResident;

    // 1. INSTANT OPTIMISTIC UI UPDATES:
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id === roomId || r.roomNo === roomNo) {
          const beds = r.beds.map((b) =>
            b.bedNumber === bedNumber
              ? { ...b, studentName: newName, rollNo: newRoll, branch: newBranch, phone: newPhone }
              : b
          );
          return { ...r, beds };
        }
        return r;
      })
    );

    setOutpasses((prev) =>
      prev.map((o) => {
        const matches = !!(
          (oldRoll && o.rollNo?.toLowerCase() === oldRoll.toLowerCase()) ||
          (oldName && o.studentName?.toLowerCase() === oldName.toLowerCase())
        );
        return matches ? { ...o, studentName: newName, rollNo: newRoll, roomNo, block } : o;
      })
    );

    setComplaints((prev) =>
      prev.map((c) => {
        const matches = !!(
          (oldRoll && c.rollNo?.toLowerCase() === oldRoll.toLowerCase()) ||
          (oldName && c.studentName?.toLowerCase() === oldName.toLowerCase())
        );
        return matches ? { ...c, studentName: newName, rollNo: newRoll, roomNo } : c;
      })
    );

    setFees((prev) =>
      prev.map((f) => {
        const matches = !!(
          (oldRoll && f.rollNo?.toLowerCase() === oldRoll.toLowerCase()) ||
          (oldName && f.studentName?.toLowerCase() === oldName.toLowerCase())
        );
        return matches ? { ...f, studentName: newName, rollNo: newRoll, roomNo } : f;
      })
    );

    setAttendance((prev) =>
      prev.map((a) => {
        const matches = !!(
          (oldRoll && a.rollNo?.toLowerCase() === oldRoll.toLowerCase()) ||
          (oldName && a.studentName?.toLowerCase() === oldName.toLowerCase())
        );
        return matches ? { ...a, studentName: newName, rollNo: newRoll, roomNo } : a;
      })
    );

    setEditingResident(null);

    // 2. PARALLEL DUAL PERSISTENCE:
    storageService.updateResidentEverywhere(
      { rollNo: oldRoll, name: oldName, studentId: editingResident.studentId },
      { name: newName, rollNo: newRoll, branch: newBranch, phone: newPhone, roomNo, block, roomId, bedNumber }
    );

    await Promise.allSettled([
      updateResidentEverywhereInFirestore(
        roomId,
        bedNumber,
        { rollNo: oldRoll, name: oldName, studentId: editingResident.studentId },
        { name: newName, rollNo: newRoll, branch: newBranch, phone: newPhone, roomNo, block },
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.updateResidentEverywhere(
        { rollNo: oldRoll, name: oldName },
        { name: newName, rollNo: newRoll, branch: newBranch, phone: newPhone, roomNo, block, roomId, bedNumber }
      ).catch(() => {})
    ]);
  };

  const handleSaveComplaintStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    // Optimistic UI update
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === editingComplaint.id
          ? {
              ...c,
              status: complaintStatusInput,
              adminRemarks: complaintRemarksInput || c.adminRemarks
            }
          : c
      )
    );

    await Promise.allSettled([
      updateComplaintStatusInFirestore(
        editingComplaint.id,
        complaintStatusInput,
        { uid: currentUser.id, name: currentUser.name, role: 'admin' },
        complaintRemarksInput
      ),
      api.updateComplaintStatus(
        editingComplaint.id,
        complaintStatusInput,
        complaintRemarksInput
      ).catch(() => {})
    ]);
    setEditingComplaint(null);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeData.title || !newNoticeData.content) return;

    const noticePayload = {
      title: newNoticeData.title,
      category: newNoticeData.category,
      content: newNoticeData.content,
      targetAudience: newNoticeData.targetAudience,
      isUrgent: newNoticeData.isUrgent,
      postedBy: `${currentUser.name} (Chief Warden)`,
    };

    // Optimistic UI update
    const newNoticeItem: Notice = {
      id: `NOT-${Date.now()}`,
      title: newNoticeData.title,
      category: newNoticeData.category,
      content: newNoticeData.content,
      targetAudience: newNoticeData.targetAudience,
      postedBy: `${currentUser.name} (Chief Warden)`,
      date: new Date().toISOString().slice(0, 10),
      isUrgent: newNoticeData.isUrgent
    };
    setNotices((prev) => [newNoticeItem, ...prev]);

    await Promise.allSettled([
      publishNoticeInFirestore(noticePayload, { uid: currentUser.id, name: currentUser.name, role: 'admin' }),
      api.createNotice(noticePayload).catch(() => {})
    ]);

    setShowNewNoticeModal(false);
    setNewNoticeData({
      title: '',
      category: 'General',
      content: '',
      targetAudience: 'All Residents',
      isUrgent: false,
    });
  };

  const handleSaveMessDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealDay) return;

    // Optimistic UI update
    setMessMenu((prev) =>
      prev.map((m) => (m.day === editingMealDay.day ? { ...editingMealDay } : m))
    );

    await Promise.allSettled([
      updateMessDayInFirestore(
        editingMealDay.day,
        editingMealDay,
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.updateMessMenu(editingMealDay.day, editingMealDay).catch(() => {})
    ]);
    setEditingMealDay(null);
  };

  const handleToggleAttendance = async (id: string, currentStatus: AttendanceRecord['status']) => {
    const nextStatus: AttendanceRecord['status'] =
      currentStatus === 'Present' ? 'Absent' : currentStatus === 'Absent' ? 'On Outpass' : 'Present';

    // Optimistic UI update
    setAttendance((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    await Promise.allSettled([
      toggleAttendanceInFirestore(
        id,
        nextStatus,
        { uid: currentUser.id, name: currentUser.name, role: 'admin' }
      ),
      api.toggleAttendance(id, nextStatus).catch(() => {})
    ]);
  };

  // Calculations for Overview stats
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupied, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const pendingOutpassesCount = outpasses.filter((o) => o.status === 'pending').length;
  const unresolvedComplaintsCount = complaints.filter((c) => c.status !== 'Resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Warden Administration Portal
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Chief Warden
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as {currentUser.name} · LBRCE Boys & Girls Hostels, Mylavaram Campus
          </p>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'outpass', label: `Outpass (${pendingOutpassesCount})`, icon: FileCheck2 },
            { id: 'rooms', label: 'Rooms & Beds', icon: Bed },
            { id: 'complaints', label: `Complaints (${unresolvedComplaintsCount})`, icon: Wrench },
            { id: 'attendance', label: 'Night Roll Call', icon: ClipboardCheck },
            { id: 'mess', label: 'Mess Menu', icon: UtensilsCrossed },
            { id: 'notices', label: 'Circulars', icon: BellRing },
            { id: 'fees', label: 'Dues & Fees', icon: Receipt },
            { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: ScrollText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Hostel Residents</span>
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{occupiedBeds}</div>
              <div className="text-xs text-slate-500 mt-1">
                Across {totalRooms} rooms · {availableBeds} beds vacant
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Outpass</span>
                <FileCheck2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{pendingOutpassesCount}</div>
              <button
                onClick={() => {
                  setActiveTab('outpass');
                  setOutpassFilter('pending');
                }}
                className="text-xs text-blue-700 hover:underline mt-1 block"
              >
                Review requests &rarr;
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Grievances</span>
                <Wrench className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-2">{unresolvedComplaintsCount}</div>
              <button
                onClick={() => setActiveTab('complaints')}
                className="text-xs text-blue-700 hover:underline mt-1 block"
              >
                View complaints &rarr;
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Today's Roll Call</span>
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-2">80% Present</div>
              <div className="text-xs text-slate-500 mt-1">Curfew check starts 8:30 PM</div>
            </div>
          </div>

          {/* Quick Action Split: Pending Outpasses + Urgent Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Urgent Outpass Queue Preview */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Urgent Outpass Requests</h2>
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    {pendingOutpassesCount} action needed
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('outpass')}
                  className="text-xs text-blue-700 hover:underline font-medium"
                >
                  View All Outpasses
                </button>
              </div>

              {pendingOutpassesCount === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  All student outpass applications are up to date.
                </div>
              ) : (
                <div className="space-y-3">
                  {outpasses
                    .filter((o) => o.status === 'pending')
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">{item.studentName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({item.rollNo})</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.purpose}</p>
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>Room: {item.roomNo} ({item.block})</span>
                            <span>Departure: {item.departureTime}</span>
                            <span>Parent: {item.parentPhone}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveOutpass(item.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectionModalId(item.id)}
                            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Hostel Blocks Status */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3">Hostel Blocks Occupancy</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Sir MV Bhavan (Block B - Boys)', total: 6, occ: 5, color: 'bg-blue-600' },
                    { name: 'Abdul Kalam Bhavan (Block A - Boys)', total: 4, occ: 3, color: 'bg-indigo-600' },
                    { name: 'Sarojini Naidu Bhavan (Girls Block)', total: 6, occ: 4, color: 'bg-purple-600' },
                  ].map((blk) => {
                    const pct = Math.round((blk.occ / blk.total) * 100);
                    return (
                      <div key={blk.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-800">{blk.name}</span>
                          <span className="font-mono text-slate-600">{blk.occ}/{blk.total} beds ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${blk.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Mylavaram Campus Security Gate: Active</span>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Manage Beds &rarr;
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: OUTPASS DESK */}
      {activeTab === 'outpass' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Outpass Approval Desk</h2>
              <p className="text-xs text-slate-500">
                Verify parent telephonic consent and issue electronic gate passes for campus exits.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOutpassFilter(st)}
                  className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-all ${
                    outpassFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Outpass List */}
          <div className="space-y-3">
            {outpasses
              .filter((o) => outpassFilter === 'all' || o.status === outpassFilter)
              .map((item) => {
                const isPending = item.status === 'pending';
                const isApproved = item.status === 'approved';
                const isRejected = item.status === 'rejected';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.studentName}</span>
                          <span className="text-xs font-mono text-slate-500">[{item.rollNo}]</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {item.block} · Room {item.roomNo}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-800 font-medium">
                          <span className="text-slate-500">Category:</span> {item.type}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          <span className="text-slate-500">Reason / Destination:</span> {item.purpose}
                        </div>

                        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Exit Departure</span>
                            <span className="font-semibold text-slate-800">{item.departureTime}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Expected Return</span>
                            <span className="font-semibold text-slate-800">{item.expectedReturnTime}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Parent Mobile</span>
                            <a
                              href={`tel:${item.parentPhone}`}
                              className="font-mono text-blue-700 font-semibold hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{item.parentPhone}</span>
                            </a>
                          </div>
                        </div>

                        {isApproved && item.approvedBy && (
                          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Authorized by {item.approvedBy} on {item.approvedAt}</span>
                          </div>
                        )}

                        {isRejected && item.rejectionReason && (
                          <div className="mt-2 text-[11px] text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Rejection Note: {item.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveOutpass(item.id)}
                              className="w-full px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Pass</span>
                            </button>
                            <button
                              onClick={() => setRejectionModalId(item.id)}
                              className="w-full px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => setSelectedGatePass(item)}
                            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>View Gate Pass QR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS & BEDS */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Room Allocation & Bed Management</h2>
              <p className="text-xs text-slate-500">
                View room capacities, resident distributions, and allocate or vacate student beds.
              </p>
            </div>

            {/* Block filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter Block:</span>
              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
              >
                <option value="all">All Hostel Blocks</option>
                <option value="Sir MV Bhavan (Block B)">Sir MV Bhavan (Block B)</option>
                <option value="Abdul Kalam Bhavan (Block A)">Abdul Kalam Bhavan (Block A)</option>
                <option value="Sarojini Naidu Bhavan (Girls Block)">Sarojini Naidu Bhavan (Girls Block)</option>
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms
              .filter((r) => blockFilter === 'all' || r.block.includes(blockFilter))
              .map((room) => {
                const isFull = room.occupied >= room.capacity;
                return (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900">Room {room.roomNo}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                              {room.type}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                              {room.gender}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{room.block}</p>
                        </div>
                        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {room.occupied}/{room.capacity} Beds
                        </div>
                      </div>

                      {/* Beds list */}
                      <div className="mt-4 space-y-2">
                        {room.beds.map((bed) => {
                          const isOccupied = !!bed.studentId;
                          return (
                            <div
                              key={bed.bedNumber}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                isOccupied
                                  ? 'bg-white border-slate-200 text-slate-800'
                                  : 'bg-emerald-50/50 border-emerald-200 border-dashed text-emerald-800'
                              }`}
                            >
                              <div>
                                <span className="font-bold mr-1.5 text-slate-500">Bed {bed.bedNumber}:</span>
                                {isOccupied ? (
                                  <span>
                                    <span className="font-semibold text-slate-900">{bed.studentName}</span>
                                    <span className="text-slate-500 text-[11px] ml-1">({bed.rollNo})</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium italic">Available Bed</span>
                                )}
                              </div>

                              <div>
                                {isOccupied ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingResident({
                                          roomId: room.id,
                                          roomNo: room.roomNo,
                                          block: room.block,
                                          bedNumber: bed.bedNumber,
                                          studentId: bed.studentId || '',
                                          oldName: bed.studentName || '',
                                          oldRollNo: bed.rollNo || '',
                                          name: bed.studentName || '',
                                          rollNo: bed.rollNo || '',
                                          branch: bed.branch || 'CSE',
                                          phone: bed.phone || '+91 98480 00000',
                                        })
                                      }
                                      className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Edit resident name and details (updates everywhere)"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setVacatingBed({
                                          roomId: room.id,
                                          bedNumber: bed.bedNumber,
                                          roomNo: room.roomNo,
                                          studentName: bed.studentName,
                                        })
                                      }
                                      className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                                    >
                                      Vacate
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setAllocatingBed({
                                        roomId: room.id,
                                        bedNumber: bed.bedNumber,
                                        roomNo: room.roomNo,
                                      })
                                    }
                                    className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-medium transition-colors"
                                  >
                                    + Allocate
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: COMPLAINTS DESK */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Maintenance & Grievance Desk</h2>
              <p className="text-xs text-slate-500">
                Track room issues (plumbing, electrical, Wi-Fi, carpentry) and update repair status.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['all', 'Pending', 'In Progress', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setComplaintFilter(st)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    complaintFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {complaints
              .filter((c) => complaintFilter === 'all' || c.status === complaintFilter)
              .map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{c.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                          {c.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{c.description}</p>

                      <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Reported by: <strong className="text-slate-700">{c.studentName}</strong> ({c.rollNo})</span>
                        <span>Location: Room {c.roomNo} · {c.block}</span>
                        <span>Date: {c.createdAt}</span>
                      </div>

                      {c.adminRemarks && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200/80 rounded-lg text-xs text-blue-900">
                          <strong>Action Taken:</strong> {c.adminRemarks}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => {
                          setEditingComplaint(c);
                          setComplaintStatusInput(c.status);
                          setComplaintRemarksInput(c.adminRemarks || '');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE & NIGHT ROLL CALL */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Night Roll Call Register</h2>
              <p className="text-xs text-slate-500">
                Mandatory 8:30 PM curfew check. Tap any status button to toggle Present / Absent / On Outpass.
              </p>
            </div>
            <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
              Date: 11 October 2026 · 20:45 Check
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Room & Block</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Check-in Time</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{rec.rollNo}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{rec.studentName}</td>
                    <td className="py-3 px-3">{rec.roomNo} ({rec.block})</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{rec.checkInTime || '—'}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleAttendance(rec.id, rec.status)}
                        className="text-xs text-blue-700 hover:underline font-semibold"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: MESS MENU */}
      {activeTab === 'mess' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Mess Menu & Meal Scheduler</h2>
              <p className="text-xs text-slate-500">
                Weekly Andhra meal schedule managed by Chief Warden & Mess Committee.
              </p>
            </div>
            <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
              FSSAI Standard Certified Mess
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {messMenu.map((day) => (
              <div
                key={day.day}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-sm">{day.day}</h3>
                    {day.specialNote && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        {day.specialNote}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Breakfast (7:30 - 9:00 AM)</span>
                      <span className="text-slate-800 font-medium">{day.breakfast}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Lunch (12:30 - 2:00 PM)</span>
                      <span className="text-slate-800 font-medium">{day.lunch}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Snacks & Tea (4:30 - 5:30 PM)</span>
                      <span className="text-slate-800 font-medium">{day.snacks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Dinner (7:30 - 9:00 PM)</span>
                      <span className="text-slate-800 font-medium">{day.dinner}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  <button
                    onClick={() => setEditingMealDay(day)}
                    className="w-full text-center py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Edit Day's Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: NOTICES / CIRCULARS */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Circulars & Notice Board</h2>
              <p className="text-xs text-slate-500">
                Official notices broadcasted to resident students and wardens.
              </p>
            </div>
            <button
              onClick={() => setShowNewNoticeModal(true)}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Circular</span>
            </button>
          </div>

          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                      {n.isUrgent && (
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">
                          Urgent Notice
                        </span>
                      )}
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        {n.targetAudience}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">{n.content}</p>
                    <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-3">
                      <span>Posted on: {n.date}</span>
                      <span>By: {n.postedBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: DUES & FEES */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Hostel & Mess Fee Ledger</h2>
              <p className="text-xs text-slate-500">
                Annual hostel accommodation fees (₹45,000) and mess charges (₹35,000).
              </p>
            </div>
            <div className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Academic Year: 2026-2027
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Total Fee</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Balance Due</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Receipt Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{fee.rollNo}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{fee.studentName}</td>
                    <td className="py-3 px-3 font-mono">{fee.roomNo}</td>
                    <td className="py-3 px-3 font-semibold">₹{fee.totalFee.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-emerald-700 font-semibold">₹{fee.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-rose-700 font-semibold">₹{fee.dueAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          fee.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fee.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{fee.receiptNumber || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AUDIT & TRANSACTION LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-bold text-slate-900">
                  Cloud Firestore Immutable Audit Trail
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every user authentication, outpass request, warden decision, room assignment, and payment is permanently recorded in Firestore
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={sendingTestPing}
                onClick={async () => {
                  setSendingTestPing(true);
                  try {
                    await recordAuditLog(
                      'FIRESTORE_VERIFY_PING',
                      { uid: currentUser.id, name: currentUser.name, role: 'admin' },
                      `Manual test write to Cloud Firestore database: ai-studio-lbrcehostelmanag-43d47f91-ecba-42da-9d08-62b3cb50554b at ${new Date().toLocaleTimeString()}`
                    );
                  } finally {
                    setSendingTestPing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                <span>{sendingTestPing ? 'Writing to Cloud...' : '+ Write Test Doc to Firestore'}</span>
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Cloud Stream ({auditLogs.length} Records)</span>
              </span>
            </div>
          </div>

          {/* Firestore Connection Detail Banner */}
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Firestore Target Database:</span>
              <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ai-studio-lbrcehostelmanag-43d47f91-ecba-42da-9d08-62b3cb50554b
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Collection: <code className="text-blue-900 font-bold">/auditLogs</code> (Ordered by timestamp DESC)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Firestore Doc ID</th>
                  <th className="py-2.5 px-3">Transaction Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit logs recorded yet. Click "+ Write Test Doc to Firestore" above to record one!
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Just now'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {log.actorName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-amber-700 whitespace-nowrap">
                        <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-bold">
                          {log.id ? log.id.slice(0, 14) + '...' : 'synced'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 leading-relaxed font-sans">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Reject Outpass with Remarks */}
      {rejectionModalId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reject Outpass Application</h3>
            <p className="text-xs text-slate-600 mb-4">
              Please enter the official reason for withholding permission. This note will appear on the student's dashboard.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Parent phone not reachable / Exam week attendance mandatory"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-800/20 focus:outline-hidden"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectOutpass(rejectionModalId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Allocate Bed */}
      {allocatingBed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Allocate Bed {allocatingBed.bedNumber} (Room {allocatingBed.roomNo})
            </h3>
            <p className="text-xs text-slate-500 mb-4">Assign a registered student to this vacant bed.</p>
            <form onSubmit={handleAllocateBed} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. N. Praveen Kumar"
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 23761A0515"
                  value={newStudentData.rollNo}
                  onChange={(e) => setNewStudentData({ ...newStudentData, rollNo: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={newStudentData.branch}
                    onChange={(e) => setNewStudentData({ ...newStudentData, branch: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="AI&DS">AI&DS</option>
                    <option value="IT">IT</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98480..."
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAllocatingBed(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Assign Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Vacate Bed */}
      {vacatingBed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Vacate Bed {vacatingBed.bedNumber}?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to vacate Bed #{vacatingBed.bedNumber} in Room {vacatingBed.roomNo} currently assigned to{' '}
              <strong className="text-slate-900">{vacatingBed.studentName || 'Student'}</strong>? This bed will be updated in Cloud Firestore as available immediately.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVacatingBed(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmVacateBed(vacatingBed.roomId, vacatingBed.bedNumber)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Yes, Vacate Bed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Resident & Propagate Everywhere */}
      {editingResident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Bed Resident Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Room {editingResident.roomNo} ({editingResident.block}) · Bed #{editingResident.bedNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingResident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Propagation Explanation Banner */}
            <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <strong>System-Wide Synchronization:</strong> Changing the resident name or roll number here automatically updates this student across <strong>all Outpasses, Fee Vouchers, Grievances, Attendance records, and Cloud Firestore</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveResidentUpdate} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Nikesh Reddy"
                  value={editingResident.name}
                  onChange={(e) => setEditingResident({ ...editingResident, name: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21761A0501"
                  value={editingResident.rollNo}
                  onChange={(e) => setEditingResident({ ...editingResident, rollNo: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Branch</label>
                  <select
                    value={editingResident.branch}
                    onChange={(e) => setEditingResident({ ...editingResident, branch: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="AI&DS">AI&DS</option>
                    <option value="IT">IT</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98480..."
                    value={editingResident.phone}
                    onChange={(e) => setEditingResident({ ...editingResident, phone: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResident(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Update Everywhere</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Complaint Status */}
      {editingComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Update Complaint Progress</h3>
            <p className="text-xs text-slate-500 mb-4">{editingComplaint.title} (Room {editingComplaint.roomNo})</p>
            <form onSubmit={handleSaveComplaintStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Complaint Status</label>
                <select
                  value={complaintStatusInput}
                  onChange={(e) => setComplaintStatusInput(e.target.value as any)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin / Technician Remarks</label>
                <textarea
                  rows={3}
                  value={complaintRemarksInput}
                  onChange={(e) => setComplaintRemarksInput(e.target.value)}
                  placeholder="e.g. Electrician Mr. Prasad assigned. Replaced fuse."
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingComplaint(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Publish Circular */}
      {showNewNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Publish Official Hostel Circular</h3>
            <p className="text-xs text-slate-500 mb-4">Broadcast notice to resident students.</p>
            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi Maintenance Schedule for Block B"
                  value={newNoticeData.title}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, title: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newNoticeData.category}
                    onChange={(e) => setNewNoticeData({ ...newNoticeData, category: e.target.value as any })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="General">General</option>
                    <option value="Curfew">Curfew / Timings</option>
                    <option value="Mess">Mess & Food</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={newNoticeData.targetAudience}
                    onChange={(e) => setNewNoticeData({ ...newNoticeData, targetAudience: e.target.value as any })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="All Residents">All Residents</option>
                    <option value="Boys Hostels">Boys Hostels (A, B, C)</option>
                    <option value="Girls Hostels">Girls Hostels</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  value={newNoticeData.content}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, content: e.target.value })}
                  placeholder="Provide detailed instructions..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgentNotice"
                  checked={newNoticeData.isUrgent}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, isUrgent: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <label htmlFor="urgentNotice" className="text-xs font-medium text-slate-700">
                  Mark as Urgent Priority Notice
                </label>
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewNoticeModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Day Mess Menu */}
      {editingMealDay && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Mess Menu - {editingMealDay.day}</h3>
            <p className="text-xs text-slate-500 mb-4">Modify dishes for morning, afternoon, evening and night.</p>
            <form onSubmit={handleSaveMessDay} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Breakfast</label>
                <input
                  type="text"
                  value={editingMealDay.breakfast}
                  onChange={(e) => setEditingMealDay({ ...editingMealDay, breakfast: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lunch</label>
                <input
                  type="text"
                  value={editingMealDay.lunch}
                  onChange={(e) => setEditingMealDay({ ...editingMealDay, lunch: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Snacks</label>
                <input
                  type="text"
                  value={editingMealDay.snacks}
                  onChange={(e) => setEditingMealDay({ ...editingMealDay, snacks: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dinner</label>
                <input
                  type="text"
                  value={editingMealDay.dinner}
                  onChange={(e) => setEditingMealDay({ ...editingMealDay, dinner: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMealDay(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Save Day Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Digital Gate Pass */}
      {selectedGatePass && (
        <DigitalGatePassModal
          outpass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

    </div>
  );
};
