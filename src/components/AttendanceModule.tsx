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
  ListChecks,
} from 'lucide-react';

export const AttendanceModule: React.FC = () => {
  const [mode, setMode] = useState<'bulk' | 'manual' | 'qr'>('bulk');
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

  // Bulk Attendance State
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkRecords, setBulkRecords] = useState<Record<string, { status: 'PRESENT' | 'ABSENT' | 'LEAVE'; leaveReason: string }>>({});
  const [bulkSearch, setBulkSearch] = useState('');

  useEffect(() => {
    fetchRecords();
    fetchStudents();
  }, []);

  // Fetch/Sync bulk records whenever date or student list changes
  useEffect(() => {
    if (students.length > 0) {
      fetchBulkAttendanceForDate(bulkDate);
    }
  }, [bulkDate, students]);

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

  const fetchBulkAttendanceForDate = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/attendance?date=${dateStr}`);
      const data = await res.json();
      
      const recordsMap: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LEAVE'; leaveReason: string }> = {};
      
      // First initialize everyone to PRESENT
      students.forEach((st) => {
        recordsMap[st.id] = { status: 'PRESENT', leaveReason: '' };
      });

      // Overlay database records
      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          if (r.studentId) {
            recordsMap[r.studentId] = {
              status: r.status as 'PRESENT' | 'ABSENT' | 'LEAVE',
              leaveReason: r.leaveReason || '',
            };
          }
        });
      }
      setBulkRecords(recordsMap);
    } catch (err) {
      console.error('Failed to fetch bulk attendance details:', err);
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
        // Sync bulk view also
        fetchBulkAttendanceForDate(bulkDate);
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
      submitAttendance({
        admissionNo: qrInput.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        mode: 'QR',
      });
      setQrInput('');
    }
  };

  const handleBulkStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setBulkRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleBulkLeaveReasonChange = (studentId: string, leaveReason: string) => {
    setBulkRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        leaveReason,
      },
    }));
  };

  const markAllStatus = (status: 'PRESENT' | 'ABSENT') => {
    const updated = { ...bulkRecords };
    students.forEach((st) => {
      if (updated[st.id]) {
        updated[st.id].status = status;
      }
    });
    setBulkRecords(updated);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const recordsToSubmit = Object.entries(bulkRecords).map(([studentId, record]) => ({
        studentId,
        status: record.status,
        leaveReason: record.status === 'LEAVE' ? record.leaveReason : undefined,
        mode: 'MANUAL',
      }));

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: bulkDate,
          records: recordsToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to submit bulk attendance' });
      } else {
        setMsg({
          type: 'success',
          text: `Daily roll-call submitted successfully! Saved ${data.saved} records for ${data.date}.`,
        });
        fetchRecords();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save bulk attendance' });
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'PRESENT')
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          PRESENT
        </span>
      );
    if (status === 'ABSENT')
      return (
        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          ABSENT
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">
        <Clock className="w-3 h-3" />
        LEAVE
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-cyan-400" />
          QR & Bulk Attendance System
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage daily attendance using Daily Roll-Call sheet, individual manual entry, or rapid QR scanner mode.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'bulk', label: 'Daily Roll-Call', icon: ListChecks },
          { id: 'manual', label: 'Single Manual Entry', icon: Keyboard },
          { id: 'qr', label: 'QR Scanner Mode', icon: ScanLine },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id as any);
              setMsg(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              mode === m.id
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* 1. Daily Roll-Call / Bulk Mode */}
      {mode === 'bulk' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Daily Roll-Call (Bulk Attendance)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mark attendance for all students on a single screen. Select date to load or edit existing logs.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Attendance Date</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => markAllStatus('PRESENT')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAllStatus('ABSENT')}
                  className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter students by name or admission number..."
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Adm. No</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Leave Reason (if Leave)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {students
                    .filter(
                      (st) =>
                        !bulkSearch ||
                        st.name?.toLowerCase().includes(bulkSearch.toLowerCase()) ||
                        st.admissionNo?.toLowerCase().includes(bulkSearch.toLowerCase())
                    )
                    .map((st) => {
                      const record = bulkRecords[st.id] || { status: 'PRESENT', leaveReason: '' };
                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{st.name}</td>
                          <td className="p-3 font-mono text-emerald-400">{st.admissionNo}</td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              {(['PRESENT', 'ABSENT', 'LEAVE'] as const).map((s) => (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => handleBulkStatusChange(st.id, s)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                    record.status === s
                                      ? s === 'PRESENT'
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : s === 'ABSENT'
                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              disabled={record.status !== 'LEAVE'}
                              required={record.status === 'LEAVE'}
                              placeholder={record.status === 'LEAVE' ? "Reason for leave (required)" : "N/A"}
                              value={record.leaveReason || ''}
                              onChange={(e) => handleBulkLeaveReasonChange(st.id, e.target.value)}
                              className={`w-full max-w-xs bg-slate-800 border rounded-lg px-2 py-1 text-xs focus:outline-none ${
                                record.status === 'LEAVE'
                                  ? 'border-amber-500/50 text-white focus:border-amber-500'
                                  : 'border-slate-700/40 text-slate-500 cursor-not-allowed bg-slate-900/40'
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                        No active students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || students.length === 0}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition text-sm disabled:opacity-50"
              >
                {loading ? 'Submitting Roll-Call...' : 'Submit Daily Attendance Sheet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. QR Scanner Mode */}
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
          <p className="text-xs text-slate-500">
            For daily roll-call, use the <strong className="text-slate-300">Daily Roll-Call</strong> mode.
          </p>
        </div>
      )}

      {/* 3. Manual Entry Form */}
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
                    <option key={st.id} value={st.id}>
                      {st.name} [{st.admissionNo}]
                    </option>
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
                          ? s === 'PRESENT'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                            : s === 'ABSENT'
                            ? 'bg-rose-500 text-white border-rose-500'
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
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No attendance records yet.
                  </td>
                </tr>
              )}
              {records.slice(0, 100).map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{r.student?.name || '—'}</td>
                  <td className="p-3 font-mono text-emerald-400">{r.admissionNo}</td>
                  <td className="p-3 text-slate-400">{r.familyNo}</td>
                  <td className="p-3 text-slate-300">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">{statusBadge(r.status)}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        r.mode === 'QR'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
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
