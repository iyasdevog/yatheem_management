'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  HeartHandshake, 
  EyeOff, 
  Layers, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Sparkles,
  Award
} from 'lucide-react';

export const DashboardOverview: React.FC<{ currentRole?: string }> = ({ currentRole = 'ADMIN' }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports?type=dashboard');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Dashboard Metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {currentRole === 'ADMIN' || currentRole === 'OFFICE_STAFF' 
                  ? 'Yatheem Care Executive Dashboard'
                  : currentRole === 'SPONSOR'
                  ? 'Donor Personal Dashboard'
                  : 'Student & Family Dashboard'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {currentRole === 'ADMIN' || currentRole === 'OFFICE_STAFF' 
                ? 'System Overview & Operations'
                : 'Welcome to your Personal Portal'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {currentRole === 'ADMIN' || currentRole === 'OFFICE_STAFF'
                ? 'Real-time monitoring of student admissions, active anonymous sponsor slabs, multi-ledger voucher execution, and location statistics.'
                : 'Access your specific documents, mark lists, and account history here.'}
            </p>
          </div>
          {(currentRole === 'ADMIN' || currentRole === 'OFFICE_STAFF') && (
            <button 
              onClick={fetchMetrics}
              className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              Refresh Metrics
            </button>
          )}
        </div>
      </div>

      {(currentRole === 'SPONSOR' || currentRole === 'STUDENT_FAMILY') && (
        <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            {currentRole === 'SPONSOR' ? <HeartHandshake className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold text-white">Your data is kept secure and private.</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            {currentRole === 'SPONSOR' 
              ? 'Navigate to the "Utility Portal" tab to securely view your specific donation history and the students you are currently sponsoring.'
              : 'Navigate to the "Utility Portal" tab to securely upload mark lists, store certificates in DigiLocker, and request reimbursements.'}
          </p>
        </div>
      )}

      {(currentRole === 'ADMIN' || currentRole === 'OFFICE_STAFF') && (
        <>
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Students */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Active Students</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{metrics?.activeStudents || 0}</span>
                <span className="text-xs text-slate-400">/ {metrics?.totalStudents || 0} Total</span>
              </div>
              <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{metrics?.inactiveStudents || 0} Inactive (Relocated/Completed)</span>
              </div>
            </div>

            {/* Total Donors & Anonymous Slabs */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Registered Sponsors</span>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{metrics?.totalSponsors || 0}</span>
                <span className="text-xs text-teal-400 font-medium">Active Donors</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>{metrics?.anonymousSponsors || 0} Anonymous Slabs</span>
              </div>
            </div>

            {/* Projected Monthly Revenue */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Projected Slab Revenue</span>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-white">
                  ₹{(metrics?.projectedRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 text-xs text-cyan-400 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{metrics?.totalAllocations || 0} Subscribed Slabs</span>
              </div>
            </div>

            {/* Total Ledger Expenses */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Ledger Expenses</span>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-white">
                  ₹{(metrics?.totalExpense || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 text-xs text-rose-400 flex items-center space-x-1">
                <span>Student: ₹{(metrics?.studentExpenseTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Ledger Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Expense Headings Summary */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Student Expense Allocation Headings</span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'School & madrasa kit', pct: 35, color: 'bg-emerald-500' },
                  { label: 'Dress exp & Stitching', pct: 25, color: 'bg-teal-500' },
                  { label: 'Medical & Health exp', pct: 20, color: 'bg-cyan-500' },
                  { label: 'Monthly food kit & Meat exp', pct: 15, color: 'bg-amber-500' },
                  { label: 'Vehicle & Transport exp', pct: 5, color: 'bg-indigo-500' },
                ].map((head, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{head.label}</span>
                      <span className="font-semibold">{head.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${head.color}`} style={{ width: `${head.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yatheem Common Operational Expenses Summary */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Common Institutional Vouchers</span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Salary of section employees', pct: 60, color: 'bg-cyan-500' },
                  { label: 'TA & DA for trainers / Camp exp', pct: 25, color: 'bg-indigo-500' },
                  { label: 'Transportation & Logistics', pct: 15, color: 'bg-rose-500' },
                ].map((head, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{head.label}</span>
                      <span className="font-semibold">{head.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${head.color}`} style={{ width: `${head.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
