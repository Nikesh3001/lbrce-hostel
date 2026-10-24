import React, { useState } from 'react';
import { User } from '../../types';
import { 
  Building2, 
  LogOut, 
  UserCheck, 
  Bell, 
  ShieldCheck, 
  GraduationCap, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  X,
  Flame
} from 'lucide-react';
import { DEFAULT_USERS } from '../../data/mockData';
import { MernStatusModal } from './MernStatusModal';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onResetData: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onResetData,
  unreadCount = 2,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMernModal, setShowMernModal] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 overflow-hidden shrink-0">
            <img
              src="/lbrce_logo.png"
              alt="LBRCE Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/lbrce_emblem.jpg';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                LBRCE Hostels
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Autonomous · Mylavaram
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Firestore Cloud</span>
              </span>
              <button
                onClick={() => setShowMernModal(true)}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                title="Click to view live MERN Stack Telemetry Console"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>MERN Stack Console</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Lakireddy Bali Reddy College of Engineering — Cloud Firestore · Express · React · Node.js
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick role switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSwitchMenu(!showSwitchMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/80"
              title="Switch between default demo accounts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Switch Demo Role</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Default Account
                </div>
                
                {/* Admin button */}
                <button
                  onClick={() => {
                    onSwitchUser(DEFAULT_USERS['admin@lbrce.ac.in'].user);
                    setShowSwitchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                    isAdmin ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-slate-900">Dr. K. Srinivas Rao</div>
                    <div className="text-slate-500 text-[11px]">Chief Warden (Admin)</div>
                  </div>
                  {isAdmin && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                </button>

                {/* Student Nikesh */}
                <button
                  onClick={() => {
                    onSwitchUser(DEFAULT_USERS['21761a0501@lbrce.ac.in'].user);
                    setShowSwitchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                    !isAdmin && currentUser.rollNo === '21761A0501' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-slate-900">S. Nikesh Reddy (21761A0501)</div>
                    <div className="text-slate-500 text-[11px]">Student · Room B-204 (CSE)</div>
                  </div>
                  {!isAdmin && currentUser.rollNo === '21761A0501' && (
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Active</span>
                  )}
                </button>

                {/* Student Harshitha */}
                <button
                  onClick={() => {
                    onSwitchUser(DEFAULT_USERS['22761a0412@lbrce.ac.in'].user);
                    setShowSwitchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                    !isAdmin && currentUser.rollNo === '22761A0412' ? 'bg-purple-50 text-purple-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-slate-900">M. Harshitha (22761A0412)</div>
                    <div className="text-slate-500 text-[11px]">Student · Girls Hostel G-105</div>
                  </div>
                  {!isAdmin && currentUser.rollNo === '22761A0412' && (
                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded">Active</span>
                  )}
                </button>

                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowSwitchMenu(false);
                      setShowResetConfirm(true);
                    }}
                    className="w-full text-center py-1 text-[11px] text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Reset mock data to fresh defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowSwitchMenu(false);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Notices & updates"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-800">Latest Hostel Circulars</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-lg">
                    <div className="font-semibold text-amber-900 text-[11px]">Evening Curfew & Biometric Roll Call</div>
                    <p className="text-amber-800/90 text-[11px] mt-0.5">
                      Curfew at 8:30 PM (Boys) & 7:00 PM (Girls). Attendance at 8:45 PM.
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50/70 border border-blue-200/60 rounded-lg">
                    <div className="font-semibold text-blue-900 text-[11px]">Sunday Special Mess Feast</div>
                    <p className="text-blue-800/90 text-[11px] mt-0.5">
                      Dussehra feast: Dum Biryani, Gulab Jamun & Mirchi Bajji served.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {isAdmin ? (
                  <span className="text-blue-700 font-medium">Chief Warden</span>
                ) : (
                  <span>{currentUser.rollNo} · {currentUser.roomNo}</span>
                )}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Reset Demo Data?</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              This will restore all default rooms, student outpasses, complaints, and menu items to their original fresh state.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MERN Stack Telemetry Console Modal */}
      {showMernModal && (
        <MernStatusModal onClose={() => setShowMernModal(false)} />
      )}
    </header>
  );
};
