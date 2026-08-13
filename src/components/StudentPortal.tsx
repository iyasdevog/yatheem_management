'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  FileUp,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Upload,
  BadgeCheck,
} from 'lucide-react';

const PORTAL_TABS = [
  { id: 'locker', label: 'Document Locker', icon: FolderLock },
  { id: 'marklist', label: 'Mark List Upload', icon: BookOpen },
  { id: 'reimbursements', label: 'Reimbursements', icon: IndianRupee },
];

const EXPENSE_HEADINGS = [
  'Dress exp', 'Meat exp', 'Medical exp', 'Monthly exp', 'Monthly kit exp',
  'Perunnal kit exp', 'School & madrasa kit', 'Academic affairs', 'Vehicle exp',
];

const DOC_CATEGORIES = ['Aadhaar', 'Birth Certificate', 'Ration Card', 'SSLC Marksheet', 'Transfer Certificate', 'Other'];

export const StudentPortal: React.FC<{ currentRole?: string; currentUser?: any }> = ({ currentRole = 'ADMIN', currentUser }) => {
  const isStudentView = currentRole === 'STUDENT_FAMILY';
  const [activeTab, setActiveTab] = useState('locker');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(
    isStudentView && currentUser?.role === 'STUDENT_FAMILY' ? currentUser.id : ''
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Locker state
  const [lockerItems, setLockerItems] = useState<any[]>([]);
  const [lockerForm, setLockerForm] = useState({ title: '', category: 'Aadhaar', file: null as File | null });

  // Marklist state
  const [markLists, setMarkLists] = useState<any[]>([]);
  const [markForm, setMarkForm] = useState({ academicYear: '2025-2026', term: 'First Term', file: null as File | null });

  // Reimbursements state
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [rForm, setRForm] = useState({ amount: '', heading: EXPENSE_HEADINGS[0], description: '' });

  useEffect(() => { if (!isStudentView) fetchStudents(); }, []);
  useEffect(() => {
    if (selectedStudentId) {
      fetchLockerItems();
      fetchMarkLists();
      fetchReimbursements();
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
  };

  const fetchLockerItems = async () => {
    const res = await fetch(`/api/portal/locker?studentId=${selectedStudentId}`);
    setLockerItems(await res.json());
  };

  const fetchMarkLists = async () => {
    const res = await fetch(`/api/portal/marklists?studentId=${selectedStudentId}`);
    setMarkLists(await res.json());
  };

  const fetchReimbursements = async () => {
    const res = await fetch(`/api/portal/reimbursements?studentId=${selectedStudentId}`);
    setReimbursements(await res.json());
  };

  const uploadFile = async (file: File, pathPrefix: string) => {
    const MAX_SIZE = 100 * 1024; // 100 KB
    if (file.size > MAX_SIZE) {
      const fileKb = (file.size / 1024).toFixed(1);
      throw new Error(`File size (${fileKb} KB) exceeds maximum allowed limit of 100 KB. Please compress file before uploading.`);
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('pathPrefix', pathPrefix);
    const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  };

  const handleLockerUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockerForm.file || !selectedStudentId) return;
    setLoading(true);
    setMsg(null);
    try {
      const { key } = await uploadFile(lockerForm.file, `locker/${selectedStudentId}`);
      const res = await fetch('/api/portal/locker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, title: lockerForm.title, category: lockerForm.category, fileKey: key }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Document saved to DigiLocker successfully!' });
        setLockerForm({ title: '', category: 'Aadhaar', file: null });
        fetchLockerItems();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarklistUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markForm.file || !selectedStudentId) return;
    setLoading(true);
    setMsg(null);
    try {
      const { key } = await uploadFile(markForm.file, `marksheets/${markForm.academicYear}`);
      const res = await fetch('/api/portal/marklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, academicYear: markForm.academicYear, term: markForm.term, fileKey: key }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Mark list submitted for Admin verification!' });
        setMarkForm({ academicYear: '2025-2026', term: 'First Term', file: null });
        fetchMarkLists();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/portal/reimbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, ...rForm }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Expense reimbursement request submitted!' });
        setRForm({ amount: '', heading: EXPENSE_HEADINGS[0], description: '' });
        fetchReimbursements();
      }
    } catch {
      setMsg({ type: 'error', text: 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  const reviewMarkList = async (id: string, status: string) => {
    await fetch('/api/portal/marklists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reviewedBy: 'Admin Officer', reviewNote: `Status updated to ${status}` }),
    });
    fetchMarkLists();
  };

  const reviewReimbursement = async (id: string, status: string) => {
    await fetch('/api/portal/reimbursements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reviewNote: `Status updated to ${status}` }),
    });
    fetchReimbursements();
  };

  const statusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING:  { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400',  icon: Clock },
      VERIFIED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
      APPROVED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
      REJECTED: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400',  icon: XCircle },
    };
    const cfg = configs[status] || configs.PENDING;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text}`}>
        <Icon className="w-3 h-3" />{status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderLock className="w-5 h-5 text-violet-400" />
          Student Utility Portal
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          DigiLocker certificate vault, mark list camera uploads with Head approval, and expense reimbursement tracking.
        </p>
      </div>

      {/* Student Selector — Hidden for Student Family view (auto-selected) */}
      {!isStudentView && (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <label className="block text-xs text-slate-400 mb-1 font-medium">Select Student to Manage</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="">-- Select a Student --</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>{st.name} ({st.admissionNo}) — {st.status}</option>
            ))}
          </select>
        </div>
      )}
      {isStudentView && currentUser && (
        <div className="bg-violet-500/5 border border-violet-500/20 p-3 rounded-xl flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs">
            {currentUser.name?.charAt(0) || 'S'}
          </div>
          <div>
            <span className="font-semibold text-white block">{currentUser.name}</span>
            <span className="text-xs text-violet-400">{currentUser.email} · Your private portal</span>
          </div>
        </div>
      )}

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

      {/* Portal Tabs */}
      <div className="flex gap-3 flex-wrap">
        {PORTAL_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setMsg(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${
              activeTab === id
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {!selectedStudentId && (
        <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
          <FolderLock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Please select a student above to access the portal.
        </div>
      )}

      {selectedStudentId && (
        <>
          {/* === DOCUMENT LOCKER === */}
          {activeTab === 'locker' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload to DigiLocker
                </h3>
                <form onSubmit={handleLockerUpload} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aadhaar Card Copy"
                      value={lockerForm.title}
                      onChange={(e) => setLockerForm({ ...lockerForm, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category</label>
                    <select
                      value={lockerForm.category}
                      onChange={(e) => setLockerForm({ ...lockerForm, category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
                    >
                      {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Upload File (PDF/Image)</label>
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={(e) => setLockerForm({ ...lockerForm, file: e.target.files?.[0] || null })}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-500/10 file:text-violet-400 file:font-semibold hover:file:bg-violet-500/20"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                    {loading ? 'Uploading...' : 'Save to DigiLocker'}
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderLock className="w-4 h-4 text-violet-400" />
                  Stored Documents
                </h3>
                {lockerItems.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">No documents in locker yet.</div>
                )}
                {lockerItems.map((item) => (
                  <div key={item.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.category} · {new Date(item.uploadedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition"
                    >
                      <Eye className="w-3 h-3" />View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === MARK LIST === */}
          {activeTab === 'marklist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload Mark List (Camera / File)
                </h3>
                <form onSubmit={handleMarklistUpload} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Academic Year</label>
                      <input
                        type="text"
                        value={markForm.academicYear}
                        onChange={(e) => setMarkForm({ ...markForm, academicYear: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Term / Exam</label>
                      <select
                        value={markForm.term}
                        onChange={(e) => setMarkForm({ ...markForm, term: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                      >
                        {['First Term', 'Mid Term', 'Annual Exam', 'Quarterly', 'Half-Yearly'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Upload Photo / PDF of Marksheet</label>
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      capture="environment"
                      onChange={(e) => setMarkForm({ ...markForm, file: e.target.files?.[0] || null })}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-500/10 file:text-violet-400 file:font-semibold hover:file:bg-violet-500/20"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit for Head Verification'}
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-violet-400" />
                  Mark List Submissions & Approval
                </h3>
                {markLists.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">No submissions yet.</div>
                )}
                {markLists.map((ml) => (
                  <div key={ml.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">{ml.term} · {ml.academicYear}</div>
                        <div className="text-[10px] text-slate-400">{new Date(ml.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      {statusBadge(ml.status)}
                    </div>
                    {ml.reviewNote && (
                      <div className="text-[10px] text-slate-400 italic">Review: {ml.reviewNote}</div>
                    )}
                    {ml.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewMarkList(ml.id, 'VERIFIED')} className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">✓ Verify</button>
                        <button onClick={() => reviewMarkList(ml.id, 'REJECTED')} className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === REIMBURSEMENTS === */}
          {activeTab === 'reimbursements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Submit Expense Reimbursement
                </h3>
                <form onSubmit={handleReimbursement} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Expense Heading</label>
                    <select
                      value={rForm.heading}
                      onChange={(e) => setRForm({ ...rForm, heading: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
                    >
                      {EXPENSE_HEADINGS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={rForm.amount}
                      onChange={(e) => setRForm({ ...rForm, amount: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Description / Justification</label>
                    <textarea
                      rows={3}
                      value={rForm.description}
                      onChange={(e) => setRForm({ ...rForm, description: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-violet-400" />
                  Reimbursement Claims History
                </h3>
                {reimbursements.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">No claims yet.</div>
                )}
                {reimbursements.map((r) => (
                  <div key={r.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">₹{r.amount.toLocaleString('en-IN')} — {r.heading}</div>
                        <div className="text-[10px] text-slate-400">{r.description}</div>
                      </div>
                      {statusBadge(r.status)}
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewReimbursement(r.id, 'APPROVED')} className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">✓ Approve</button>
                        <button onClick={() => reviewReimbursement(r.id, 'REJECTED')} className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
