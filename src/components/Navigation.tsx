'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  QrCode, 
  Receipt, 
  FolderLock, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  HeartHandshake,
  LogOut,
  Sparkles,
  UserCircle,
  GraduationCap,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: string;
  currentUser?: any;
  onLogout?: () => void;
  // kept for backwards compat on old page.tsx if needed
  setCurrentRole?: (role: string) => void;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  ADMIN:          { label: 'Administrator',  color: 'text-emerald-400', icon: ShieldCheck },
  OFFICE_STAFF:   { label: 'Office Staff',   color: 'text-cyan-400',    icon: ShieldCheck },
  SPONSOR:        { label: 'Donor / Sponsor', color: 'text-teal-400',   icon: HeartHandshake },
  STUDENT_FAMILY: { label: 'Student / Family', color: 'text-violet-400', icon: GraduationCap },
};

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',             icon: BarChart3,      roles: ['ADMIN', 'OFFICE_STAFF', 'SPONSOR', 'STUDENT_FAMILY'] },
    { id: 'admissions', label: 'Student Admission',     icon: Users,          roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'sponsors',   label: 'Sponsors & Slabs',      icon: HeartHandshake, roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'attendance', label: 'QR Attendance',         icon: QrCode,         roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'vouchers',   label: 'Vouchers & Receipts',   icon: Receipt,        roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'portal',     label: 'Utility Portal',        icon: FolderLock,     roles: ['ADMIN', 'OFFICE_STAFF', 'STUDENT_FAMILY', 'SPONSOR'] },
    { id: 'reports',    label: 'Reports & Analytics',   icon: Building2,      roles: ['ADMIN', 'OFFICE_STAFF'] },
    { id: 'import',     label: 'Excel Data Migration',  icon: FileSpreadsheet, roles: ['ADMIN'] },
  ];

  const roleInfo = ROLE_LABELS[currentRole] || ROLE_LABELS.ADMIN;
  const RoleIcon = roleInfo.icon;

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
                Ayaadi Life Education · AIC
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <UserCircle className="w-4 h-4 text-slate-400" />
                <div className="text-left">
                  <span className="text-xs font-semibold text-white block leading-tight max-w-[140px] truncate">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${roleInfo.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            )}
            {onLogout && (
              <button
                id="logout-btn"
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
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
                  id={`nav-${item.id}`}
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
