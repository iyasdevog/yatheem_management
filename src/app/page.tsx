'use client';

import React, { useState } from 'react';
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
  SPONSOR: ['dashboard', 'sponsors', 'reports'],
  STUDENT_FAMILY: ['dashboard', 'attendance', 'portal'],
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('ADMIN');

  const handleSetTab = (tab: string) => {
    const allowed = ROLE_TABS[currentRole] || [];
    if (allowed.includes(tab)) setActiveTab(tab);
    else setActiveTab('dashboard');
  };

  const handleSetRole = (role: string) => {
    setCurrentRole(role);
    const allowed = ROLE_TABS[role] || [];
    if (!allowed.includes(activeTab)) setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardOverview />;
      case 'admissions':   return <StudentAdmissionForm />;
      case 'sponsors':     return <SponsorSlabEngine />;
      case 'attendance':   return <AttendanceModule />;
      case 'vouchers':     return <VoucherAccountsModule />;
      case 'portal':       return <StudentPortal />;
      case 'reports':      return <ReportsEngine />;
      case 'import':       return <ExcelImportModule />;
      default:             return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        currentRole={currentRole}
        setCurrentRole={handleSetRole}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
