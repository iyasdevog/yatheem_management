'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  HeartHandshake,
  Calendar,
  IndianRupee,
  EyeOff,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'dashboard', label: 'Overview Metrics', icon: BarChart3 },
  { id: 'studentExpenses', label: 'Student Expense Ledger', icon: IndianRupee },
  { id: 'sponsorReport', label: 'Sponsor Execution Report', icon: HeartHandshake },
  { id: 'attendanceReport', label: 'Attendance Summary', icon: Calendar },
];

export const ReportsEngine: React.FC = () => {
  const [activeReport, setActiveReport] = useState('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedSponsor, setExpandedSponsor] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/reports?type=${activeReport}`);
      setData(await res.json());
    } catch (err) {
      console.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yatheemcare_${activeReport}_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Comprehensive Reports & Analytics Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-criteria reporting: student directory, expense ledgers, sponsor execution history, and attendance summaries.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {data && (
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-xs font-medium border border-amber-500/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          )}
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-3 flex-wrap">
        {REPORT_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveReport(id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${
              activeReport === id
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-slate-900 p-16 rounded-2xl border border-slate-800 text-center text-slate-400 animate-pulse">
          Loading report data...
        </div>
      )}

      {/* === DASHBOARD OVERVIEW === */}
      {!loading && activeReport === 'dashboard' && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: data.totalStudents, sub: `${data.activeStudents} Active / ${data.inactiveStudents} Inactive`, color: 'emerald' },
            { label: 'Total Sponsors', value: data.totalSponsors, sub: `${data.anonymousSponsors} Anonymous`, color: 'teal' },
            { label: 'Subscribed Slabs', value: data.totalAllocations, sub: `${data.totalSlabs} Slab Categories`, color: 'cyan' },
            { label: 'Projected Revenue', value: `₹${(data.projectedRevenue || 0).toLocaleString('en-IN')}`, sub: 'Monthly from slab allocations', color: 'amber' },
            { label: 'Student Expenses', value: `₹${(data.studentExpenseTotal || 0).toLocaleString('en-IN')}`, sub: 'Cumulative head expenses', color: 'rose' },
            { label: 'Common Expenses', value: `₹${(data.commonExpenseTotal || 0).toLocaleString('en-IN')}`, sub: 'Institutional operations', color: 'indigo' },
            { label: 'Total Expenses', value: `₹${(data.totalExpense || 0).toLocaleString('en-IN')}`, sub: 'Student + Common combined', color: 'violet' },
            { label: 'Net Balance', value: `₹${((data.projectedRevenue || 0) - (data.totalExpense || 0)).toLocaleString('en-IN')}`, sub: 'Projected - Expenses', color: 'slate' },
          ].map((card) => (
            <div key={card.label} className={`bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-${card.color}-500/30 transition shadow-lg`}>
              <div className={`text-2xl font-extrabold text-white`}>{card.value}</div>
              <div className="text-xs font-medium text-slate-300 mt-1">{card.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* === STUDENT EXPENSE REPORT === */}
      {!loading && activeReport === 'studentExpenses' && data && (
        <div className="space-y-6">
          {/* Heading Breakdown */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Expense by Heading (₹)</h3>
            <div className="space-y-2">
              {Object.entries(data.headingBreakdown || {}).map(([heading, amount]: any) => (
                <div key={heading} className="flex items-center gap-3">
                  <div className="w-40 text-xs text-slate-300 truncate">{heading}</div>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                      style={{ width: `${Math.min(100, (amount / Math.max(...(Object.values(data.headingBreakdown) as number[]))) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-amber-400 w-24 text-right">₹{amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Voucher Table with Search */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Student Voucher Ledger</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student/heading..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none w-48"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Voucher No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Heading</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(data.vouchers || [])
                    .filter((v: any) =>
                      !search ||
                      v.studentName?.toLowerCase().includes(search.toLowerCase()) ||
                      v.heading?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-amber-400">{v.voucherNo}</td>
                        <td className="p-3">{new Date(v.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-3 font-bold text-white">{v.studentName || '—'}</td>
                        <td className="p-3 text-slate-300">{v.heading}</td>
                        <td className="p-3 text-slate-400">{v.paymentMode}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">₹{v.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === SPONSOR EXECUTION REPORT === */}
      {!loading && activeReport === 'sponsorReport' && data && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-400" />
            Sponsor Execution Reports (Admin View — Real Identity Preserved)
          </h3>
          <div className="space-y-3">
            {(data || []).map((sponsor: any) => (
              <div key={sponsor.id} className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition"
                  onClick={() => setExpandedSponsor(expandedSponsor === sponsor.id ? null : sponsor.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{sponsor.realName}</span>
                        {sponsor.isAnonymous && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-500/20">
                            <EyeOff className="w-2.5 h-2.5" />
                            ANONYMOUS (displays as "Well-wisher")
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{sponsor.sponsorId} · {sponsor.studentsCount} Student(s)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-rose-400">₹{sponsor.totalExecutionExpense.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-500">Total Executed</div>
                    </div>
                    {expandedSponsor === sponsor.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {expandedSponsor === sponsor.id && (
                  <div className="border-t border-slate-700 p-4 space-y-3">
                    {sponsor.mappedStudents.map((st: any) => (
                      <div key={st.id} className="space-y-2">
                        <div className="text-xs font-bold text-teal-400">
                          {st.name} · {st.admissionNo} · Fam: {st.familyNo}
                        </div>
                        {st.vouchers.length === 0 ? (
                          <div className="text-[10px] text-slate-500 italic pl-2">No vouchers recorded for this student.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[10px] text-slate-400">
                              <thead>
                                <tr className="text-slate-500 uppercase">
                                  <th className="pb-1 text-left">Voucher No</th>
                                  <th className="pb-1 text-left">Date</th>
                                  <th className="pb-1 text-left">Heading</th>
                                  <th className="pb-1 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {st.vouchers.map((v: any) => (
                                  <tr key={v.id}>
                                    <td className="py-1 font-mono text-amber-400">{v.voucherNo}</td>
                                    <td className="py-1">{new Date(v.date).toLocaleDateString('en-IN')}</td>
                                    <td className="py-1 text-slate-300">{v.heading}</td>
                                    <td className="py-1 text-right font-bold text-emerald-400">₹{v.amount.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ATTENDANCE REPORT === */}
      {!loading && activeReport === 'attendanceReport' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Logs', value: data.summary?.total, color: 'text-white' },
              { label: 'Present', value: data.summary?.present, color: 'text-emerald-400' },
              { label: 'Absent', value: data.summary?.absent, color: 'text-rose-400' },
              { label: 'Leave', value: data.summary?.leave, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.value ?? 0}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Attendance Log</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none w-44"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Adm. No</th>
                    <th className="p-3">Fam. No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(data.records || [])
                    .filter((r: any) => !search || r.student?.name?.toLowerCase().includes(search.toLowerCase()))
                    .map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{r.student?.name || '—'}</td>
                        <td className="p-3 font-mono text-emerald-400">{r.admissionNo}</td>
                        <td className="p-3 text-slate-400">{r.familyNo}</td>
                        <td className="p-3">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`font-bold text-[10px] ${
                            r.status === 'PRESENT' ? 'text-emerald-400' : r.status === 'ABSENT' ? 'text-rose-400' : 'text-amber-400'
                          }`}>{r.status}</span>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">{r.mode}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
