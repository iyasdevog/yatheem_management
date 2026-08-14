'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  Building2,
  Printer,
  Trash2,
  X,
} from 'lucide-react';

const STUDENT_HEADINGS = [
  'Dress exp', 'Meat exp', 'Medical exp', 'Monthly exp', 'Monthly kit exp',
  'Perunnal kit exp', 'School & madrasa kit', 'Academic affairs', 'Vehicle exp', 'Other',
];
const COMMON_HEADINGS = [
  'Salary of section employees', 'Transportation', 'TA & DA for trainers',
  'Camp exp', 'Infrastructure repair', 'Utility bills & maintenance', 'Other operational cost', 'Other',
];
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];

export const VoucherAccountsModule: React.FC = () => {
  const [voucherType, setVoucherType] = useState<'STUDENT_EXPENSE' | 'YATHEEM_COMMON'>('STUDENT_EXPENSE');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printVoucher, setPrintVoucher] = useState<any | null>(null);
  const [customHeading, setCustomHeading] = useState('');

  const [form, setForm] = useState<any>({
    voucherNo: `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    amount: '',
    heading: STUDENT_HEADINGS[0],
    paymentMode: 'Cash',
    studentId: '',
    familyNo: '',
    studentName: '',
    description: '',
    createdBy: 'Admin Officer',
  });

  useEffect(() => { fetchVouchers(); fetchStudents(); }, []);
  useEffect(() => {
    setCustomHeading('');
    setForm((prev: any) => ({
      ...prev,
      heading: voucherType === 'STUDENT_EXPENSE' ? STUDENT_HEADINGS[0] : COMMON_HEADINGS[0],
    }));
  }, [voucherType]);

  const fetchVouchers = async () => {
    const res = await fetch('/api/vouchers');
    const data = await res.json();
    setVouchers(Array.isArray(data) ? data : []);
  };

  const fetchStudents = async () => {
    const res = await fetch('/api/students?status=ACTIVE');
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
  };

  const handleStudentSelect = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    setForm((prev: any) => ({
      ...prev,
      studentId,
      familyNo: st?.familyNo || '',
      studentName: st?.name || '',
    }));
  };

  const handleDeleteVoucher = async (v: any) => {
    if (!window.confirm(`Delete voucher "${v.voucherNo}" (₹${v.amount})? This cannot be undone.`)) return;
    setDeletingId(v.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/vouchers?id=${v.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ type: 'success', text: `Voucher ${v.voucherNo} deleted successfully.` });
        fetchVouchers();
      } else {
        const data = await res.json();
        setMsg({ type: 'error', text: data.error || 'Failed to delete voucher' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error deleting voucher' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: voucherType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to create voucher' });
      } else {
        setMsg({ type: 'success', text: `Voucher ${data.voucherNo} created successfully!` });
        setForm((prev: any) => ({
          ...prev,
          voucherNo: `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: '',
          description: '',
          studentId: '',
          familyNo: '',
          studentName: '',
        }));
        fetchVouchers();
      }
    } catch {
      setMsg({ type: 'error', text: 'Unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const headings = voucherType === 'STUDENT_EXPENSE' ? STUDENT_HEADINGS : COMMON_HEADINGS;
  const filteredVouchers = vouchers.filter((v) => v.type === voucherType);
  const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Multi-Ledger Vouchers & Receipts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Record student-wise head expense vouchers and institutional common operational costs.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white">₹{totalAmount.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-400">Total {voucherType === 'STUDENT_EXPENSE' ? 'Student' : 'Common'} Expenses</div>
        </div>
      </div>

      {/* Voucher Type Toggle */}
      <div className="flex gap-3">
        {([
          { key: 'STUDENT_EXPENSE', label: 'Student Expense Vouchers', icon: Users },
          { key: 'YATHEEM_COMMON', label: 'Yatheem Common Vouchers', icon: Building2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setVoucherType(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              voucherType === key
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Voucher Creation Form */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New {voucherType === 'STUDENT_EXPENSE' ? 'Student' : 'Common'} Voucher
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Voucher No</label>
              <input
                type="text"
                value={form.voucherNo}
                onChange={(e) => setForm({ ...form, voucherNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-emerald-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Expense Heading</label>
              <select
                value={form.heading === customHeading && !STUDENT_HEADINGS.includes(form.heading) && !COMMON_HEADINGS.includes(form.heading) ? 'Other' : form.heading}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setForm({ ...form, heading: customHeading || '' });
                  } else {
                    setCustomHeading('');
                    setForm({ ...form, heading: e.target.value });
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                {headings.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {/* Custom heading input when Other is selected */}
              {form.heading === 'Other' || (!STUDENT_HEADINGS.includes(form.heading) && !COMMON_HEADINGS.includes(form.heading) && form.heading !== '') ? (
                <input
                  type="text"
                  required
                  placeholder="Specify heading e.g. Event expenses, Festival gift..."
                  value={form.heading === 'Other' ? customHeading : form.heading}
                  onChange={(e) => {
                    setCustomHeading(e.target.value);
                    setForm({ ...form, heading: e.target.value });
                  }}
                  className="w-full mt-2 bg-slate-800 border border-indigo-500/50 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                />
              ) : null}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Payment Mode</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((pm) => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setForm({ ...form, paymentMode: pm })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                      form.paymentMode === pm
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {voucherType === 'STUDENT_EXPENSE' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Student (Auto-fills Sponsor)</label>
                <select
                  value={form.studentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} [{st.admissionNo}] — Fam: {st.familyNo}
                    </option>
                  ))}
                </select>
                {form.familyNo && (
                  <p className="text-[10px] text-emerald-400 mt-1">Family No: {form.familyNo}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Brief description of expense..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Voucher'}
            </button>
          </form>
        </div>

        {/* Vouchers List */}
        <div className="lg:col-span-3 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            {voucherType === 'STUDENT_EXPENSE' ? 'Student' : 'Common'} Voucher Ledger
          </h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredVouchers.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">No vouchers recorded yet.</div>
            )}
            {filteredVouchers.map((v) => (
              <div
                key={v.id}
                className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 flex items-start justify-between group hover:border-indigo-500/30 transition"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-indigo-400">{v.voucherNo}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{v.heading}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{v.paymentMode}</span>
                  </div>
                  <div className="text-white font-bold text-sm">₹{v.amount.toLocaleString('en-IN')}</div>
                  {v.studentName && (
                    <div className="text-xs text-slate-400">
                      Student: <span className="text-teal-400">{v.studentName}</span>
                      {v.sponsorName && <> · Sponsor: <span className="text-amber-400">{v.sponsorName}</span></>}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500">
                    {new Date(v.date).toLocaleDateString('en-IN')} · {v.description || 'No notes'}
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setPrintVoucher(v)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                    title="Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteVoucher(v)}
                    disabled={deletingId === v.id}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition disabled:opacity-40"
                    title="Delete Voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Voucher Receipt Modal */}
      {printVoucher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-slate-900 p-8 relative print:shadow-none">
            <button
              onClick={() => setPrintVoucher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="font-extrabold text-2xl text-slate-900">YATHEEM CARE</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Orphan & Student Management</div>
              <div className="mt-2 border-t border-b border-slate-200 py-2 text-sm font-bold text-slate-700">
                VOUCHER RECEIPT
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Voucher No', printVoucher.voucherNo],
                ['Date', new Date(printVoucher.date).toLocaleDateString('en-IN')],
                ['Type', printVoucher.type === 'STUDENT_EXPENSE' ? 'Student Expense' : 'Common Institutional'],
                ['Expense Heading', printVoucher.heading],
                ['Amount', `₹${printVoucher.amount.toLocaleString('en-IN')}`],
                ['Payment Mode', printVoucher.paymentMode],
                ...(printVoucher.studentName ? [
                  ['Student Name', printVoucher.studentName],
                  ['Family No', printVoucher.familyNo || '—'],
                  ['Sponsor', printVoucher.sponsorName || '—'],
                ] : []),
                ['Description', printVoucher.description || '—'],
                ['Created By', printVoucher.createdBy || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="font-semibold text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-center space-y-2">
              <div className="text-xs text-slate-400 italic">
                This is a computer-generated receipt. No signature required.
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition print:hidden"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
