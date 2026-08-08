'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  QrCode, 
  Receipt, 
  FolderLock, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  HeartHandshake,
  LogOut,
  Sparkles
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['ADMIN', 'OFFICE_STAFF', 'SPONSOR', 'STUDENT_FAMILY'] },
    { id: 'admissions', label: 'Student Admission', icon: Users, roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'sponsors', label: 'Sponsors & Slabs', icon: HeartHandshake, roles: ['ADMIN', 'OFFICE_STAFF', 'SPONSOR'] },
    { id: 'attendance', label: 'QR Attendance', icon: QrCode, roles: ['ADMIN', 'OFFICE_STAFF', 'STUDENT_FAMILY'] },
    { id: 'vouchers', label: 'Vouchers & Receipts', icon: Receipt, roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'portal', label: 'Student Utility Portal', icon: FolderLock, roles: ['ADMIN', 'OFFICE_STAFF', 'STUDENT_FAMILY'] },
    { id: 'reports', label: 'Reports & Analytics', icon: Building2, roles: ['ADMIN', 'OFFICE_STAFF', 'SPONSOR'] },
    { id: 'import', label: 'Excel Data Migration', icon: FileSpreadsheet, roles: ['ADMIN'] },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-white bg-clip-text text-transparent">
                YATHEEM CARE
              </span>
              <span className="text-[10px] block text-emerald-400 font-semibold tracking-widest uppercase">
                Student & Sponsor Management
              </span>
            </div>
          </div>

          {/* Role Switcher Selector */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Role View:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-emerald-300 focus:outline-none cursor-pointer"
              >
                <option value="ADMIN" className="bg-slate-900 text-white">ADMINISTRATOR</option>
                <option value="OFFICE_STAFF" className="bg-slate-900 text-white">OFFICE STAFF</option>
                <option value="SPONSOR" className="bg-slate-900 text-white">DONOR / SPONSOR</option>
                <option value="STUDENT_FAMILY" className="bg-slate-900 text-white">STUDENT & FAMILY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-none py-2 border-t border-slate-800/60">
          {navItems
            .filter((item) => item.roles.includes(currentRole))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
