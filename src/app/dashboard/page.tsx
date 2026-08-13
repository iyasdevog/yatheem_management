'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { DashboardOverview } from '@/components/DashboardOverview';
import { StudentAdmissionForm } from '@/components/StudentAdmissionForm';
import { SponsorSlabEngine } from '@/components/SponsorSlabEngine';
import { AttendanceModule } from '@/components/AttendanceModule';
import { VoucherAccountsModule } from '@/components/VoucherAccountsModule';
import { StudentPortal } from '@/components/StudentPortal';
import { ReportsEngine } from '@/components/ReportsEngine';
import { ExcelImportModule } from '@/components/ExcelImportModule';

// Role-based permitted tabs
const ROLE_TABS: Record<string, string[]> = {
  ADMIN: ['dashboard', 'admissions', 'sponsors', 'attendance', 'vouchers', 'portal', 'reports', 'import'],
  OFFICE_STAFF: ['dashboard', 'admissions', 'sponsors', 'attendance', 'vouchers', 'portal', 'reports'],
  SPONSOR: ['dashboard', 'portal'],
  STUDENT_FAMILY: ['dashboard', 'portal'],
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSetTab = (tab: string) => {
    const role = currentUser?.role || 'ADMIN';
    const allowed = ROLE_TABS[role] || [];
    if (allowed.includes(tab)) setActiveTab(tab);
    else setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const currentRole = currentUser.role || 'ADMIN';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardOverview currentRole={currentRole} />;
      case 'admissions':   return <StudentAdmissionForm />;
      case 'sponsors':     return <SponsorSlabEngine />;
      case 'attendance':   return <AttendanceModule />;
      case 'vouchers':     return <VoucherAccountsModule />;
      case 'portal':       return <StudentPortal currentRole={currentRole} currentUser={currentUser} />;
      case 'reports':      return <ReportsEngine />;
      case 'import':       return <ExcelImportModule />;
      default:             return <DashboardOverview currentRole={currentRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        currentRole={currentRole}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
