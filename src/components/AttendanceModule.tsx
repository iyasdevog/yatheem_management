'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Calendar,
  UserCheck,
  Keyboard,
  Camera,
} from 'lucide-react';

export const AttendanceModule: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'qr'>('manual');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Manual form
  const [manualForm, setManualForm] = useState({
    admissionNo: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    leaveReason: '',
    captureMode: 'MANUAL',
  });

  // QR scan state
  const [qrInput, setQrInput] = useState('');
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRecords();
    fetchStudents();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch attendance records');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students?status=ACTIVE');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load students');
    }
  };

  const submitAttendance = async (payload: any) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to log attendance' });
      } else {
        setMsg({ type: 'success', text: `Attendance logged! Student: ${data.admissionNo} — ${data.status}` });
        setManualForm((prev) => ({ ...prev, admissionNo: '', studentId: '', leaveReason: '' }));
        fetchRecords();
      }
    } catch {
      setMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAttendance({ ...manualForm, mode: 'MANUAL' });
  };

  const handleQRScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && qrInput.trim()) {
      // QR typically encodes the student UUID or admissionNo
      submitAttendance({
        admissionNo: qrInput.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        mode: 'QR',
      });
      setQrInput('');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'PRESENT') return <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" />PRESENT</span>;
    if (status === 'ABSENT') return <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/20"><XCircle className="w-3 h-3" />ABSENT</span>;
    return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20"><Clock className="w-3 h-3" />LEAVE</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-cyan-400" />
          QR & Manual Attendance System
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Log student attendance via Manual entry or QR scanner. Leave status requires mandatory reason.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3">
        {(['manual', 'qr'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setMsg(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              mode === m
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {m === 'manual' ? <Keyboard className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
            {m === 'manual' ? 'Manual Entry' : 'QR Scanner Mode'}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* QR Scanner Mode */}
      {mode === 'qr' && (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-5 text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-cyan-500/10 border-2 border-dashed border-cyan-500/30 flex items-center justify-center animate-pulse">
            <Camera className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">QR Code Scanner Active</h3>
            <p className="text-slate-400 text-xs mt-1">
              Point a QR scanner at the student's ID card. Scan auto-submits PRESENT status immediately.
            </p>
          </div>
          <input
            ref={qrInputRef}
            type="text"
            autoFocus
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={handleQRScan}
            placeholder="🔍 Scan QR code here or type Admission No and press Enter…"
            className="w-full max-w-md mx-auto block bg-slate-800 border border-cyan-500/40 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 text-center font-mono"
          />
          <p className="text-xs text-slate-500">For manual override, use the <strong className="text-slate-300">Manual Entry</strong> mode.</p>
        </div>
      )}

      {/* Manual Entry Form */}
      {mode === 'manual' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4" />
            Manual Attendance Entry
          </h3>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Select Student</label>
                <select
                  value={manualForm.studentId}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    setManualForm((prev) => ({
                      ...prev,
                      studentId: e.target.value,
                      admissionNo: st?.admissionNo || '',
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} [{st.admissionNo}]</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Admission No (Auto-filled)</label>
                <input
                  type="text"
                  value={manualForm.admissionNo}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, admissionNo: e.target.value }))}
                  placeholder="e.g. ADM-2026-001"
                  className="w-full bg-slate-800/60 border border-slate-700 text-emerald-300 font-mono rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Date</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Status</label>
                <div className="flex gap-3">
                  {(['PRESENT', 'ABSENT', 'LEAVE'] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setManualForm((prev) => ({ ...prev, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        manualForm.status === s
                          ? s === 'PRESENT' ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                            : s === 'ABSENT' ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {manualForm.status === 'LEAVE' && (
                <div>
                  <label className="block text-xs text-amber-400 mb-1 font-medium">Leave Reason (Mandatory)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical checkup, family event..."
                    value={manualForm.leaveReason}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, leaveReason: e.target.value }))}
                    className="w-full bg-slate-800 border border-amber-500/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition text-sm disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Attendance'}
            </button>
          </form>
        </div>
      )}

      {/* Attendance Log Table */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Recent Attendance Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Adm. No</th>
                <th className="p-3">Family No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Leave Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">No attendance records yet.</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{r.student?.name || '—'}</td>
                  <td className="p-3 font-mono text-emerald-400">{r.admissionNo}</td>
                  <td className="p-3 text-slate-400">{r.familyNo}</td>
                  <td className="p-3 text-slate-300">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">{statusBadge(r.status)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.mode === 'QR' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {r.mode}
                    </span>
                  </td>
                  <td className="p-3 text-amber-400">{r.leaveReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
