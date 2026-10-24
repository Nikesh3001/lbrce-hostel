import React, { useState } from 'react';
import { OutpassRequest } from '../../types';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  Phone,
  Calendar,
  Building,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface DigitalGatePassModalProps {
  outpass: OutpassRequest;
  onClose: () => void;
}

export const DigitalGatePassModal: React.FC<DigitalGatePassModalProps> = ({
  outpass,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const passId = outpass.gatePassId || `GP-2026-${outpass.id.replace(/\D/g, '').slice(-4) || '8910'}`;

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Fallback
    }
  };

  const handleCopyPassId = () => {
    navigator.clipboard?.writeText(passId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Pass Institutional Top Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 flex items-center justify-between border-b border-blue-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
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
              <div className="text-[11px] font-extrabold tracking-wider text-blue-200 uppercase">
                Lakireddy Bali Reddy College of Engineering
              </div>
              <div className="text-sm font-black tracking-tight text-white">
                HOSTEL SECURITY GATE PASS
              </div>
              <div className="text-[10px] text-blue-300">
                Autonomous · Accredited by NAAC & NBA · Mylavaram - 521230
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-blue-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-500 text-white px-5 py-2.5 flex items-center justify-between text-xs shadow-inner">
          <div className="flex items-center gap-2 font-bold tracking-wide">
            <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />
            <span>OFFICIALLY AUTHORIZED FOR EXIT</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-emerald-700/60 px-2 py-0.5 rounded-lg border border-emerald-400/40">
            <span>{passId}</span>
            <button
              onClick={handleCopyPassId}
              title="Copy Gate Pass ID"
              className="text-emerald-100 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Pass Body Content */}
        <div className="p-6 space-y-5">
          
          {/* Student Header Info with QR Pattern */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resident Details</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {outpass.studentName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Roll: {outpass.rollNo}
                </span>
                <span className="text-xs text-slate-700 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>{outpass.block} · Room {outpass.roomNo}</span>
                </span>
              </div>
            </div>

            {/* High Contrast Digital Security Code */}
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center shrink-0 shadow-xs">
              <div className="w-20 h-20 bg-white border border-slate-900 rounded-lg p-1.5 flex flex-col justify-between items-center mx-auto">
                {/* Simulated Scannable 2D Matrix */}
                <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-0.5 bg-slate-950 p-0.5 rounded-xs">
                  <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                  <div className="bg-slate-950 col-span-1 row-span-1" />
                  <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                  <div className="bg-white col-span-1 row-span-1" />
                  <div className="bg-slate-950 col-span-1 row-span-1" />
                  <div className="bg-white col-span-1 row-span-1" />
                  <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                  <div className="bg-slate-950 col-span-1 row-span-1" />
                  <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-600 block mt-1 tracking-tight">
                SCAN AT SECURITY
              </span>
            </div>
          </div>

          {/* Schedule Movement Card */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-700" />
                <span>Authorized Out-Time</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {outpass.departureTime}
              </div>
              <div className="text-[10px] text-slate-500">Departure Gate Check</div>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Expected In-Time</span>
              </div>
              <div className="font-bold text-amber-900 text-sm">
                {outpass.expectedReturnTime}
              </div>
              <div className="text-[10px] text-amber-700 font-medium">Curfew Before 8:30 PM</div>
            </div>
          </div>

          {/* Verification Table */}
          <div className="space-y-2 text-xs border border-slate-200 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Outpass Category:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {outpass.type}
              </span>
            </div>
            <div className="flex items-start justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium shrink-0">Purpose & Destination:</span>
              <span className="font-semibold text-slate-800 text-right ml-4">
                {outpass.purpose}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Parent Contact Phone:</span>
              <span className="font-mono font-bold text-blue-800">
                {outpass.parentPhone} <span className="text-[10px] text-emerald-700 font-sans font-bold">(Verified)</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Authorized By:</span>
              <span className="font-bold text-blue-950">
                {outpass.approvedBy || 'Chief Warden, LBRCE Hostels'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Approved Session:</span>
              <span className="font-mono text-slate-600 text-[11px]">
                {outpass.approvedAt || outpass.appliedAt}
              </span>
            </div>
          </div>

          {/* Security Protocols Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed text-amber-900">
              <strong>Mandatory Protocol:</strong> Present this screen and college student identity card to the security guard on duty when leaving and re-entering the campus. Any unapproved overstay will be automatically reported to the Principal & Chief Warden office.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Official Pass</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors text-center shadow-xs cursor-pointer"
          >
            Done / Close Pass
          </button>
        </div>

      </div>
    </div>
  );
};
