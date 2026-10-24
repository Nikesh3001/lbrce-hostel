import React, { useState, useEffect } from 'react';
import { 
  User, 
  OutpassRequest, 
  Complaint, 
  Notice, 
  MealSchedule, 
  FeeRecord, 
  AttendanceRecord,
  Room 
} from '../../types';
import { storageService } from '../../services/storage';
import { api } from '../../services/api';
import {
  subscribeOutpasses,
  subscribeComplaints,
  subscribeRooms,
  subscribeFees,
  subscribeNotices,
  subscribeMessMenu,
  subscribeAttendance,
  createOutpassInFirestore,
  createComplaintInFirestore,
  recordFeePaymentInFirestore,
} from '../../services/firebaseService';
import { DigitalGatePassModal } from '../outpass/DigitalGatePassModal';
import {
  Building2,
  FileText,
  Wrench,
  UtensilsCrossed,
  Receipt,
  ClipboardCheck,
  BellRing,
  Plus,
  Clock,
  Phone,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  Download,
  Calendar,
  Send,
  Bed,
  Check,
  CreditCard
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'room' | 'outpass' | 'complaints' | 'mess' | 'fees' | 'attendance' | 'notices'
  >('room');

  // Load user data
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>(storageService.getOutpasses());
  const [complaints, setComplaints] = useState<Complaint[]>(storageService.getComplaints());
  const [notices] = useState<Notice[]>(storageService.getNotices());
  const [messMenu] = useState<MealSchedule[]>(storageService.getMessMenu());
  const [fees, setFees] = useState<FeeRecord[]>(storageService.getFees());
  const [attendance] = useState<AttendanceRecord[]>(storageService.getAttendance());
  const [rooms, setRooms] = useState<Room[]>(storageService.getRooms());

  // Filter for this student
  const studentOutpasses = outpasses.filter(
    (o) => o.studentId === currentUser.id || o.rollNo === currentUser.rollNo
  );
  const studentComplaints = complaints.filter(
    (c) => c.studentId === currentUser.id || c.rollNo === currentUser.rollNo
  );
  const studentFeeRecord = fees.find(
    (f) => f.studentId === currentUser.id || f.rollNo === currentUser.rollNo
  );

  // Find user's room and roommates
  const studentRoom = rooms.find((r) =>
    r.beds.some((b) => b.rollNo === currentUser.rollNo || b.studentId === currentUser.id)
  );

  // Modals & Forms
  const [selectedGatePass, setSelectedGatePass] = useState<OutpassRequest | null>(null);
  const [showApplyOutpass, setShowApplyOutpass] = useState(false);
  const [showLodgeComplaint, setShowLodgeComplaint] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmountInput, setPayAmountInput] = useState('30000');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // New Outpass Form State
  const [newOutpass, setNewOutpass] = useState({
    type: 'Local Outing' as OutpassRequest['type'],
    purpose: '',
    departureTime: '',
    expectedReturnTime: '',
    parentPhone: currentUser.parentPhone || '+91 98492 44321',
  });

  // New Complaint Form State
  const [newComplaint, setNewComplaint] = useState({
    category: 'Wi-Fi & Network' as Complaint['category'],
    title: '',
    description: '',
    priority: 'Medium' as Complaint['priority'],
  });

  // Meal feedback state
  const [mealRating, setMealRating] = useState(5);
  const [mealComments, setMealComments] = useState('');

  // Real-time Cloud Firestore sync
  useEffect(() => {
    const unsubOutpasses = subscribeOutpasses(setOutpasses);
    const unsubComplaints = subscribeComplaints(setComplaints);
    const unsubRooms = subscribeRooms(setRooms);
    const unsubFees = subscribeFees(setFees);

    return () => {
      unsubOutpasses();
      unsubComplaints();
      unsubRooms();
      unsubFees();
    };
  }, []);

  // Handlers
  const handleApplyOutpass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutpass.purpose || !newOutpass.departureTime || !newOutpass.expectedReturnTime) return;

    const payload = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo || '21761A0501',
      roomNo: currentUser.roomNo || 'B-204',
      block: currentUser.block || 'Sir MV Bhavan (Block B)',
      type: newOutpass.type,
      purpose: newOutpass.purpose,
      departureTime: newOutpass.departureTime,
      expectedReturnTime: newOutpass.expectedReturnTime,
      parentPhone: newOutpass.parentPhone,
      parentConsentReceived: true,
    };

    // Optimistic UI update
    const localNewOutpass: OutpassRequest = {
      ...payload,
      id: `OP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      appliedAt: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
    };
    setOutpasses((prev) => [localNewOutpass, ...prev]);

    // Parallel Cloud Firestore + Express API sync with audit logging
    await Promise.allSettled([
      createOutpassInFirestore(payload, { uid: currentUser.id, name: currentUser.name, role: 'student' }),
      api.createOutpass(payload).catch(() => storageService.createOutpass(payload))
    ]);

    setShowApplyOutpass(false);
    setNewOutpass({
      type: 'Local Outing',
      purpose: '',
      departureTime: '',
      expectedReturnTime: '',
      parentPhone: currentUser.parentPhone || '+91 98492 44321',
    });
  };

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.title || !newComplaint.description) return;

    const payload = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo || '21761A0501',
      roomNo: currentUser.roomNo || 'B-204',
      block: currentUser.block || 'Sir MV Bhavan (Block B)',
      category: newComplaint.category,
      title: newComplaint.title,
      description: newComplaint.description,
      priority: newComplaint.priority,
    };

    // Optimistic UI update
    const localNewComplaint: Complaint = {
      ...payload,
      id: `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setComplaints((prev) => [localNewComplaint, ...prev]);

    // Parallel Cloud Firestore + Express API sync with audit logging
    await Promise.allSettled([
      createComplaintInFirestore(payload, { uid: currentUser.id, name: currentUser.name, role: 'student' }),
      api.createComplaint(payload).catch(() => storageService.createComplaint(payload))
    ]);

    setShowLodgeComplaint(false);
    setNewComplaint({
      category: 'Wi-Fi & Network',
      title: '',
      description: '',
      priority: 'Medium',
    });
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    const feeId = studentFeeRecord?.id || `FEE-${currentUser.rollNo || currentUser.id}`;

    // Optimistic UI update
    setFees((prev) =>
      prev.map((f) => {
        if (f.id === feeId || f.rollNo === currentUser.rollNo) {
          const newPaid = f.paidAmount + amount;
          const newDue = Math.max(0, f.totalFee - newPaid);
          return {
            ...f,
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newDue === 0 ? 'Paid' : 'Partial',
            lastPaymentDate: new Date().toISOString().slice(0, 10),
            receiptNumber: `LBRCE/HST/26-REC${Math.floor(100 + Math.random() * 900)}`
          };
        }
        return f;
      })
    );

    await Promise.allSettled([
      recordFeePaymentInFirestore(feeId, amount, { uid: currentUser.id, name: currentUser.name, role: 'student' }),
      api.payFee(feeId, amount).catch(() => storageService.payFee(feeId, amount))
    ]);
    setShowPayModal(false);
  };

  const handleSubmitMealFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setMealComments('');
    }, 3000);
  };

  const activeApprovedPass = studentOutpasses.find((o) => o.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Student Welcome Profile Banner */}
      <div className="mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white overflow-hidden ring-2 ring-blue-800/20 shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                {currentUser.name[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {currentUser.rollNo}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Active Hosteller
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.branch} · {currentUser.year} · Room {currentUser.roomNo} ({currentUser.block})
            </p>
          </div>
        </div>

        {/* Quick Outpass Status Widget */}
        <div className="flex items-center gap-2">
          {activeApprovedPass ? (
            <button
              onClick={() => setSelectedGatePass(activeApprovedPass)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Active Gate Pass QR</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab('outpass');
                setShowApplyOutpass(true);
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Outpass</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Nav Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 mb-6">
        {[
          { id: 'room', label: 'My Room & Roommates', icon: Building2 },
          { id: 'outpass', label: `Outpass / Gate Pass (${studentOutpasses.length})`, icon: FileText },
          { id: 'complaints', label: `Grievances (${studentComplaints.length})`, icon: Wrench },
          { id: 'mess', label: 'Mess Menu & Ratings', icon: UtensilsCrossed },
          { id: 'fees', label: 'Hostel Fees', icon: Receipt },
          { id: 'attendance', label: 'Attendance Log', icon: ClipboardCheck },
          { id: 'notices', label: 'Circulars', icon: BellRing },
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

      {/* TAB 1: MY ROOM & ROOMMATES */}
      {activeTab === 'room' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Room Info Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocated Room</span>
                  <h2 className="text-xl font-bold text-slate-900">{currentUser.roomNo} · {currentUser.block}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    Floor 2 · 3-Sharing Room
                  </span>
                </div>
              </div>

              {/* Roommates */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Roommates & Bed Occupants
                </h3>
                <div className="space-y-2.5">
                  {studentRoom?.beds.map((b) => {
                    const isSelf = b.rollNo === currentUser.rollNo || b.studentId === currentUser.id;
                    return (
                      <div
                        key={b.bedNumber}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isSelf
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelf ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            B{b.bedNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {b.studentName || 'Available Bed'} {isSelf && '(You)'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.rollNo ? `${b.rollNo} · Branch: ${b.branch || 'CSE'}` : 'Unallocated'}
                            </div>
                          </div>
                        </div>

                        {b.phone && !isSelf && (
                          <a
                            href={`tel:${b.phone}`}
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Call Roommate"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Inventory */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Standard Room Inventory & Facilities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3 Study Tables</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3 Steel Godrej Cupboards</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ceiling Fans (x2)</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attached Bathroom</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency & Wardens Contacts */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Key Hostel Officials & Contacts
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Dr. K. Srinivas Rao</div>
                      <div className="text-[11px] text-slate-500">Chief Warden (LBRCE Hostels)</div>
                      <div className="text-[11px] font-mono text-blue-700 mt-0.5">+91 98480 12345</div>
                    </div>
                    <a
                      href="tel:+919848012345"
                      className="p-2 bg-blue-100 text-blue-900 hover:bg-blue-200 rounded-lg"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Mr. T. Subba Rao</div>
                      <div className="text-[11px] text-slate-500">Block B Caretaker & Night Warden</div>
                      <div className="text-[11px] font-mono text-blue-700 mt-0.5">+91 98492 88123</div>
                    </div>
                    <a
                      href="tel:+919849288123"
                      className="p-2 bg-blue-100 text-blue-900 hover:bg-blue-200 rounded-lg"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-amber-900">Main Campus Security Gate</div>
                      <div className="text-[11px] text-amber-800">Gate 1 & Gate 2 Security Booth</div>
                      <div className="text-[11px] font-mono text-amber-900 mt-0.5">08659-222933 (Ext 104)</div>
                    </div>
                    <a
                      href="tel:08659222933"
                      className="p-2 bg-amber-200 text-amber-900 hover:bg-amber-300 rounded-lg"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Hostel Curfew Rules */}
              <div className="bg-blue-950 text-white rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Important Hostel Timings</span>
                </div>
                <div className="space-y-1.5 text-xs text-blue-100 leading-relaxed">
                  <div>• <strong>8:30 PM</strong>: Main hostel gate curfew for boys.</div>
                  <div>• <strong>8:45 PM</strong>: Mandatory biometric roll call.</div>
                  <div>• <strong>10:30 PM</strong>: Study hours silence protocol.</div>
                  <div>• <strong>06:00 AM</strong>: Hostel gates open for morning activities.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: OUTPASS / GATE PASS */}
      {activeTab === 'outpass' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Outpass & Digital Gate Passes</h2>
              <p className="text-xs text-slate-500">
                Apply for local outings, home leaves, or academic visits. Approved passes generate a digital QR pass.
              </p>
            </div>
            <button
              onClick={() => setShowApplyOutpass(true)}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for New Outpass</span>
            </button>
          </div>

          {/* Outpasses List */}
          <div className="space-y-3">
            {studentOutpasses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                You have not applied for any outpass yet. Click "Apply for New Outpass" above.
              </div>
            ) : (
              studentOutpasses.map((pass) => {
                const isApproved = pass.status === 'approved';
                const isRejected = pass.status === 'rejected';
                return (
                  <div
                    key={pass.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{pass.type}</span>
                          <span className="text-xs font-mono text-slate-500">({pass.id})</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pass.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-1.5 font-medium">
                          Purpose / Destination: <span className="font-normal text-slate-600">{pass.purpose}</span>
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <div>Departure: <strong className="text-slate-800">{pass.departureTime}</strong></div>
                          <div>Expected Return: <strong className="text-slate-800">{pass.expectedReturnTime}</strong></div>
                          <div>Parent Phone: <span className="font-mono">{pass.parentPhone}</span></div>
                        </div>

                        {isApproved && (
                          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved by {pass.approvedBy}</span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="mt-2 text-xs text-rose-700 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Reason: {pass.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isApproved ? (
                          <button
                            onClick={() => setSelectedGatePass(pass)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Digital QR Pass</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {pass.status === 'pending' ? 'Awaiting Warden Signature' : 'Closed'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GRIEVANCES & MAINTENANCE */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Grievance & Maintenance Desk</h2>
              <p className="text-xs text-slate-500">
                Report electrical faults, plumbing, Wi-Fi connectivity, or mess issues for swift resolution.
              </p>
            </div>
            <button
              onClick={() => setShowLodgeComplaint(true)}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lodge New Grievance</span>
            </button>
          </div>

          <div className="space-y-3">
            {studentComplaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active complaints filed for Room {currentUser.roomNo}. Everything is in order!
              </div>
            ) : (
              studentComplaints.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{c.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                          {c.category}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
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
                      <div className="text-[11px] text-slate-400 mt-2">
                        Filed on {c.createdAt} · Priority: {c.priority}
                      </div>

                      {c.adminRemarks && (
                        <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                          <strong>Warden / Tech Status:</strong> {c.adminRemarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MESS MENU & RATINGS */}
      {activeTab === 'mess' && (
        <div className="space-y-6">
          
          {/* Today's Special Highlights */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Today's Dining Schedule (Monday)
                </span>
                <h2 className="text-xl font-bold mt-1">Authentic Andhra Mess Menu</h2>
                <p className="text-xs text-blue-200 mt-1">
                  Breakfast: Idli, Medu Vada & Sambar · Lunch: Gongura Pappu, Aloo Fry, Rasam, Curd
                </p>
              </div>
              <div className="text-xs bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                <span className="text-amber-300 font-bold block mb-1">Mess Timings:</span>
                <div>BF: 7:30 - 9:00 AM | Lunch: 12:30 - 2:00 PM</div>
                <div>Snacks: 4:30 - 5:30 PM | Dinner: 7:30 - 9:00 PM</div>
              </div>
            </div>
          </div>

          {/* 7-day Weekly Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Weekly Mess Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {messMenu.map((day) => (
                <div key={day.day} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xs text-slate-900 uppercase">{day.day}</h4>
                    {day.specialNote && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                        {day.specialNote}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div><span className="text-slate-400 font-semibold">BF:</span> {day.breakfast}</div>
                    <div><span className="text-slate-400 font-semibold">Lunch:</span> {day.lunch}</div>
                    <div><span className="text-slate-400 font-semibold">Snacks:</span> {day.snacks}</div>
                    <div><span className="text-slate-400 font-semibold">Dinner:</span> {day.dinner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Meal Feedback Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Submit Daily Meal Feedback</h3>
            <p className="text-xs text-slate-500 mb-4">Your ratings directly influence the hostel mess committee menu review.</p>

            {feedbackSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your meal rating has been logged for the Chief Warden review.</span>
              </div>
            )}

            <form onSubmit={handleSubmitMealFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Today's Food Quality:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setMealRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= mealRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">{mealRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comments or Suggestions:</label>
                <textarea
                  rows={2}
                  value={mealComments}
                  onChange={(e) => setMealComments(e.target.value)}
                  placeholder="e.g. Sambar taste was great; please reduce spice level in rasam."
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 5: HOSTEL FEES & DUES */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Annual Total Fee</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                ₹{studentFeeRecord ? studentFeeRecord.totalFee.toLocaleString('en-IN') : '80,000'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Hostel ₹45,000 + Mess ₹35,000</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Amount Paid</span>
              <div className="text-2xl font-bold text-emerald-700 mt-2">
                ₹{studentFeeRecord ? studentFeeRecord.paidAmount.toLocaleString('en-IN') : '80,000'}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                Receipt: {studentFeeRecord?.receiptNumber || 'LBRCE/HST/26-0419'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Balance Outstanding</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                ₹{studentFeeRecord ? studentFeeRecord.dueAmount.toLocaleString('en-IN') : '0'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {studentFeeRecord?.dueAmount === 0 ? (
                  <span className="text-emerald-700 font-semibold">No Pending Dues · Fully Paid</span>
                ) : (
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Pay Pending Balance &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fee Statement & Receipt Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Official Fee Payment Receipt</h3>
                <p className="text-xs text-slate-500">Lakireddy Bali Reddy College of Engineering Accounts Wing</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Print Receipt</span>
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Receipt Voucher:</span>
                <span className="font-mono font-bold text-slate-800">{studentFeeRecord?.receiptNumber || 'LBRCE/HST/26-0419'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold text-slate-900">{currentUser.name} ({currentUser.rollNo})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hostel Accommodation Room:</span>
                <span className="text-slate-800">{currentUser.roomNo} ({currentUser.block})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hostel Maintenance & Room Rent:</span>
                <span className="font-semibold text-slate-800">₹45,000.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mess Charges (Annual Advance):</span>
                <span className="font-semibold text-slate-800">₹35,000.00</span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                <span>Total Paid:</span>
                <span className="text-emerald-700">₹{studentFeeRecord?.paidAmount.toLocaleString('en-IN') || '80,000.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ATTENDANCE LOG */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hostel Biometric & Roll Call Attendance</h2>
              <p className="text-xs text-slate-500">
                Night biometric roll call logs verified by Chief Warden Office.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Monthly Attendance: 96%
            </div>
          </div>

          <div className="space-y-2">
            {[
              { date: '11 Oct 2026', time: '20:15 PM', status: 'Present', device: 'Biometric Machine B-02' },
              { date: '10 Oct 2026', time: '20:22 PM', status: 'Present', device: 'Biometric Machine B-02' },
              { date: '09 Oct 2026', time: '20:10 PM', status: 'Present', device: 'Biometric Machine B-02' },
              { date: '08 Oct 2026', time: '20:30 PM', status: 'Present', device: 'Biometric Machine B-02' },
              { date: '07 Oct 2026', time: '18:30 PM', status: 'On Outpass', device: 'Main Gate Exit' },
            ].map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{log.date}</div>
                  <div className="text-[11px] text-slate-500">{log.device}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                    {log.status}
                  </span>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CIRCULARS & NOTICES */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Official Circulars & Warden Notices</h2>
            <p className="text-xs text-slate-500">Announcements from Rector & Chief Warden.</p>
          </div>

          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                  {n.isUrgent && (
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{n.content}</p>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-3">
                  <span>Date: {n.date}</span>
                  <span>Issued by: {n.postedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Apply for Outpass */}
      {showApplyOutpass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Apply for Outpass / Gate Pass</h3>
            <p className="text-xs text-slate-500 mb-4">
              Requests will be forwarded to Dr. K. Srinivas Rao (Chief Warden) for electronic authorization.
            </p>
            <form onSubmit={handleApplyOutpass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Outpass Type</label>
                <select
                  value={newOutpass.type}
                  onChange={(e) => setNewOutpass({ ...newOutpass, type: e.target.value as any })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Local Outing">Local Outing (Town / Market)</option>
                  <option value="Home Visit">Home Visit (Native Place)</option>
                  <option value="Academic / Industrial Visit">Academic / Industrial Visit</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination & Purpose</label>
                <textarea
                  rows={2}
                  required
                  value={newOutpass.purpose}
                  onChange={(e) => setNewOutpass({ ...newOutpass, purpose: e.target.value })}
                  placeholder="e.g. Going to Vijayawada for family festival"
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="text"
                    required
                    placeholder="YYYY-MM-DD HH:mm"
                    value={newOutpass.departureTime}
                    onChange={(e) => setNewOutpass({ ...newOutpass, departureTime: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return</label>
                  <input
                    type="text"
                    required
                    placeholder="YYYY-MM-DD HH:mm"
                    value={newOutpass.expectedReturnTime}
                    onChange={(e) => setNewOutpass({ ...newOutpass, expectedReturnTime: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Mobile Number</label>
                <input
                  type="text"
                  required
                  value={newOutpass.parentPhone}
                  onChange={(e) => setNewOutpass({ ...newOutpass, parentPhone: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Chief Warden will verify permission via SMS/Call.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyOutpass(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Submit Outpass Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Lodge Complaint */}
      {showLodgeComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Lodge Maintenance Grievance</h3>
            <p className="text-xs text-slate-500 mb-4">Room {currentUser.roomNo} ({currentUser.block})</p>
            <form onSubmit={handleLodgeComplaint} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value as any })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Wi-Fi & Network">Wi-Fi & Network</option>
                  <option value="Electrical">Electrical (Fan / Light / Plug)</option>
                  <option value="Plumbing">Plumbing & Water Supply</option>
                  <option value="Carpentry & Furniture">Carpentry & Furniture</option>
                  <option value="Mess & Drinking Water">Mess & Drinking Water</option>
                  <option value="Cleanliness & Washroom">Cleanliness & Washroom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi router reboot needed on 2nd floor"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the exact issue..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={newComplaint.priority}
                  onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value as any })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLodgeComplaint(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Lodge Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pay Fee Simulator */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Pay Outstanding Hostel Fee</h3>
            <p className="text-xs text-slate-500 mb-4">LBRCE College Payment Gateway (UPI / Netbanking)</p>
            <form onSubmit={handlePayFee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay (INR)</label>
                <input
                  type="number"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl font-bold font-mono"
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Instant payment receipt will be generated for your records.</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors"
                >
                  Pay Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Digital Gate Pass */}
      {selectedGatePass && (
        <DigitalGatePassModal
          outpass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

    </div>
  );
};
