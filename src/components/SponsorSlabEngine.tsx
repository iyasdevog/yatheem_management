'use client';

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  EyeOff, 
  UserCheck, 
  Layers, 
  IndianRupee, 
  CheckCircle2,
  Users,
  Calendar,
  Clock,
  History,
  X,
  Receipt,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Save,
} from 'lucide-react';
import { SponsorPaymentTracker } from '@/components/SponsorPaymentTracker';

export const SponsorSlabEngine: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedLedgerSponsor, setSelectedLedgerSponsor] = useState<any | null>(null);
  const [paymentTrackerSponsor, setPaymentTrackerSponsor] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [savingSponsor, setSavingSponsor] = useState(false);

  // Sponsorship Plan state — slab × count drives everything
  const [planSlabId, setPlanSlabId] = useState<string>('');
  const [planStudentCount, setPlanStudentCount] = useState<number>(1);
  const [planCustomAmount, setPlanCustomAmount] = useState<string>('');
  const [studentAssignments, setStudentAssignments] = useState<string[]>(['']);
  const [studentSearches, setStudentSearches] = useState<string[]>(['']);

  // Form State
  const [newSponsor, setNewSponsor] = useState<any>({
    sponsorId: `SP-2026-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    gender: 'Male',
    isAnonymous: false,
    contact1: '',
    whatsapp: '',
    houseName: '',
    place: '',
    commitmentStartDate: new Date().toISOString().split('T')[0],
  });

  const [newSlab, setNewSlab] = useState({
    name: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resS, resSl, resSt] = await Promise.all([
        fetch('/api/sponsors'),
        fetch('/api/slabs'),
        fetch('/api/students?status=ACTIVE'),
      ]);
      const dataS = await resS.json();
      const dataSl = await resSl.json();
      const dataSt = await resSt.json();

      setSponsors(Array.isArray(dataS) ? dataS : []);
      setSlabs(Array.isArray(dataSl) ? dataSl : []);
      setStudents(Array.isArray(dataSt) ? dataSt : []);
      
      if (dataS && dataS.error) {
        console.error("API returned error:", dataS.error);
      }
    } catch (err) {
      console.error('Failed to fetch sponsor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/sponsors/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sponsors_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Derive per-student amount and total from plan
  const getPerStudentAmount = (): number => {
    if (planSlabId === 'custom') return parseFloat(planCustomAmount) || 0;
    const slab = slabs.find((s) => s.id === planSlabId);
    return slab ? slab.amount : 0;
  };
  const getTotalCommitment = (): number => getPerStudentAmount() * planStudentCount;

  // When student count changes, resize assignments array
  const handleStudentCountChange = (count: number) => {
    setPlanStudentCount(count);
    setStudentAssignments((prev) => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill('')];
      return prev.slice(0, count);
    });
    setStudentSearches((prev) => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill('')];
      return prev.slice(0, count);
    });
  };

  const handleDeleteSponsor = async (sp: any) => {
    if (!window.confirm(`Delete sponsor "${sp.name}" (${sp.sponsorId})? This cannot be undone.`)) return;
    try {
      setDeletingId(sp.id);
      const res = await fetch(`/api/sponsors?id=${sp.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg(`Sponsor ${sp.name} deleted.`);
        fetchData();
      } else {
        const d = await res.json();
        setMsg(d.error || 'Delete failed.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;
    try {
      setSavingSponsor(true);
      const res = await fetch('/api/sponsors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSponsor),
      });
      if (res.ok) {
        setMsg(`Sponsor "${editingSponsor.name}" updated successfully!`);
        setEditingSponsor(null);
        fetchData();
      } else {
        const d = await res.json();
        setMsg(d.error || 'Failed to update sponsor.');
      }
    } catch {
      setMsg('Error updating sponsor.');
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsor.name || !newSponsor.contact1) return;

    const perAmt = getPerStudentAmount();
    const totalCommitment = getTotalCommitment();
    // Build allocations: each assigned student gets the slab (or custom)
    const studentAllocations = studentAssignments
      .map((sid) => ({
        studentId: sid || undefined,
        slabId: planSlabId !== 'custom' ? planSlabId || undefined : undefined,
        customAmount: planSlabId === 'custom' && perAmt > 0 ? perAmt : undefined,
      }))
      .filter((a) => a.studentId);

    try {
      setLoading(true);
      const payload = {
        ...newSponsor,
        annualCommitment: totalCommitment || 0,
        studentAllocations,
      };

      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg('Sponsor registered with annual commitment tracking!');
        setPlanSlabId('');
        setPlanStudentCount(1);
        setPlanCustomAmount('');
        setStudentAssignments(['']);
        setNewSponsor({
          sponsorId: `SP-2026-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          gender: 'Male',
          isAnonymous: false,
          contact1: '',
          whatsapp: '',
          houseName: '',
          place: '',
          commitmentStartDate: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create sponsor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlab.name || !newSlab.amount) return;

    try {
      setLoading(true);
      const res = await fetch('/api/slabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlab),
      });

      if (res.ok) {
        setNewSlab({ name: '', amount: '', description: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create slab:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-teal-400" />
            <span>Sponsor Master & Donor Commitment Ledger Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track annual donor commitments (e.g. ₹50,000/yr), derive start dates from first payment, calculate paid vs remaining balance, and inspect chronological payment history.
          </p>
        </div>
        <button
          onClick={exportExcel}
          disabled={exporting || sponsors.length === 0}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {exporting ? (
            <>
              <FileSpreadsheet className="w-3.5 h-3.5 animate-pulse" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </>
          )}
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: Create Sponsor & Config Slabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Register Sponsor */}
        <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Register Donor with Annual Commitment</span>
          </h3>

          {/* Required fields notice */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2 text-[11px] text-amber-400 flex items-center gap-2">
            <span className="font-bold">*</span>
            Only <span className="font-bold">Full Name</span> and <span className="font-bold">Contact Number</span> are required. All other fields are optional.
          </div>

          <form onSubmit={handleCreateSponsor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Sponsor ID <span className="text-slate-500 font-normal">(auto-generated)</span>
                </label>
                <input
                  type="text"
                  value={newSponsor.sponsorId}
                  onChange={(e) => setNewSponsor({ ...newSponsor, sponsorId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Sponsor Full Name"
                  value={newSponsor.name}
                  onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Contact Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={newSponsor.contact1}
                  onChange={(e) => setNewSponsor({ ...newSponsor, contact1: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>
            </div>



            {/* Optional extra fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Gender <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <select
                  value={newSponsor.gender}
                  onChange={(e) => setNewSponsor({ ...newSponsor, gender: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  House Name <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahman Manzil"
                  value={newSponsor.houseName}
                  onChange={(e) => setNewSponsor({ ...newSponsor, houseName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Place <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kondotty"
                  value={newSponsor.place}
                  onChange={(e) => setNewSponsor({ ...newSponsor, place: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Anonymous Sponsor Option <span className="text-slate-500 font-normal">(optional)</span></span>
                  <span className="text-[11px] text-slate-400">
                    If enabled, displays as "Well-wisher" in Student Portal while retaining real identity for Admin reports.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={newSponsor.isAnonymous}
                onChange={(e) => setNewSponsor({ ...newSponsor, isAnonymous: e.target.checked })}
                className="w-5 h-5 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* ── SPONSORSHIP PLAN ── */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Sponsorship Plan</span>
                <span className="text-[10px] text-slate-500">(optional — skip if not yet decided)</span>
              </div>

              {/* Row 1: Slab picker + count */}
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                {/* Slab Dropdown */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">Select Sponsorship Slab</label>
                  <select
                    value={planSlabId}
                    onChange={(e) => { setPlanSlabId(e.target.value); setPlanCustomAmount(''); }}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- No slab / decide later --</option>
                    {slabs.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.name} — ₹{sl.amount.toLocaleString('en-IN')} / student
                      </option>
                    ))}
                    <option value="custom">Other (enter custom amount)</option>
                  </select>
                </div>

                {/* Student Count Multiplier */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">No. of Students</label>
                  <select
                    value={planStudentCount}
                    onChange={(e) => handleStudentCountChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <option key={n} value={n}>{n} student{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom amount input — shown only when 'Other' is selected */}
              {planSlabId === 'custom' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Custom Amount per Student (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount per student e.g. 35000"
                    value={planCustomAmount}
                    onChange={(e) => setPlanCustomAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/40 text-amber-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Commitment summary formula */}
              {(planSlabId && planSlabId !== 'custom') || (planSlabId === 'custom' && parseFloat(planCustomAmount) > 0) ? (
                <div className="bg-slate-900 rounded-xl border border-teal-500/20 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      {
                        planSlabId !== 'custom'
                          ? slabs.find((s) => s.id === planSlabId)?.name
                          : 'Custom Amount'
                      }
                      <span className="mx-2 text-slate-600">×</span>
                      <span className="font-bold text-white">{planStudentCount} student{planStudentCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">₹{getPerStudentAmount().toLocaleString('en-IN')} × {planStudentCount}</div>
                      <div className="text-xl font-extrabold text-amber-400">₹{getTotalCommitment().toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-500">Annual Commitment Total</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Commitment Start Date */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Commitment Start Date
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={newSponsor.commitmentStartDate}
                  onChange={(e) => setNewSponsor({ ...newSponsor, commitmentStartDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

              {/* ── STUDENT ASSIGNMENT (auto-appears based on count) ── */}
            {planSlabId && planStudentCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Assign Students</span>
                  <span className="text-[10px] text-slate-500">({planStudentCount} slot{planStudentCount > 1 ? 's' : ''} — assign now or later)</span>
                </div>
                <div className="space-y-2">
                  {studentAssignments.map((sid, idx) => {
                    const search = studentSearches[idx] || '';
                    const selectedStudent = students.find((s) => s.id === sid);
                    const filteredStudents = students.filter((st) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return (
                        st.name?.toLowerCase().includes(q) ||
                        st.admissionNo?.toLowerCase().includes(q)
                      );
                    });
                    return (
                      <div key={idx} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="Search by name or admission no..."
                              value={selectedStudent ? `${selectedStudent.name} [${selectedStudent.admissionNo}]` : search}
                              onChange={(e) => {
                                const next = [...studentSearches];
                                next[idx] = e.target.value;
                                setStudentSearches(next);
                                // Clear selection when user types
                                const nextAssign = [...studentAssignments];
                                nextAssign[idx] = '';
                                setStudentAssignments(nextAssign);
                              }}
                              onFocus={() => {
                                if (selectedStudent) {
                                  // Show search text on focus so user can refine
                                  const next = [...studentSearches];
                                  next[idx] = '';
                                  setStudentSearches(next);
                                  const nextAssign = [...studentAssignments];
                                  nextAssign[idx] = '';
                                  setStudentAssignments(nextAssign);
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                            />
                            {/* Dropdown results */}
                            {search && !sid && filteredStudents.length > 0 && (
                              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
                                {filteredStudents.map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                      const nextAssign = [...studentAssignments];
                                      nextAssign[idx] = st.id;
                                      setStudentAssignments(nextAssign);
                                      const nextSearch = [...studentSearches];
                                      nextSearch[idx] = '';
                                      setStudentSearches(nextSearch);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-500/10 hover:text-indigo-300 text-slate-300 flex items-center justify-between gap-2 border-b border-slate-800 last:border-0 transition"
                                  >
                                    <span className="font-semibold text-white truncate">{st.name}</span>
                                    <span className="font-mono text-indigo-400 text-[10px] shrink-0">{st.admissionNo}</span>
                                  </button>
                                ))}
                                {filteredStudents.length === 0 && (
                                  <div className="px-3 py-3 text-xs text-slate-500 text-center">No students found</div>
                                )}
                              </div>
                            )}
                            {search && !sid && filteredStudents.length === 0 && (
                              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl px-3 py-3 text-xs text-slate-500 text-center">
                                No students match "{search}"
                              </div>
                            )}
                          </div>
                          {sid && (
                            <>
                              <div className="text-[10px] text-teal-400 font-bold whitespace-nowrap">
                                ₹{getPerStudentAmount().toLocaleString('en-IN')}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextAssign = [...studentAssignments];
                                  nextAssign[idx] = '';
                                  setStudentAssignments(nextAssign);
                                  const nextSearch = [...studentSearches];
                                  nextSearch[idx] = '';
                                  setStudentSearches(nextSearch);
                                }}
                                className="text-slate-500 hover:text-rose-400 transition text-[10px] font-bold"
                                title="Clear selection"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                        {/* Selected badge */}
                        {sid && selectedStudent && (
                          <div className="flex items-center gap-2 ml-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1">
                            <span className="text-[10px] text-white font-semibold truncate">{selectedStudent.name}</span>
                            <span className="font-mono text-[10px] text-indigo-400">{selectedStudent.admissionNo}</span>
                            {selectedStudent.familyNo && (
                              <span className="text-[10px] text-slate-400">· Fam: {selectedStudent.familyNo}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-teal-500/20 transition"
            >
              Register & Allocate Commitment
            </button>
          </form>
        </div>

        {/* Configure Slabs Master */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Sponsorship Slabs Master</span>
          </h3>

          <form onSubmit={handleCreateSlab} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Slab Name</label>
              <input
                type="text"
                placeholder="e.g. Annual ₹50,000 Sponsor"
                value={newSlab.name}
                onChange={(e) => setNewSlab({ ...newSlab, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Slab Amount (₹)</label>
              <input
                type="number"
                placeholder="50000"
                value={newSlab.amount}
                onChange={(e) => setNewSlab({ ...newSlab, amount: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Description</label>
              <input
                type="text"
                placeholder="Covers annual student support"
                value={newSlab.description}
                onChange={(e) => setNewSlab({ ...newSlab, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-700 transition"
            >
              + Add Slab Master
            </button>
          </form>

          {/* Slabs List */}
          <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
            {slabs.map((sl) => (
              <div key={sl.id} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{sl.name}</span>
                  <span className="text-slate-400 text-[10px]">{sl.description || 'Configured slab'}</span>
                </div>
                <span className="font-extrabold text-emerald-400">₹{sl.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Sponsors List & Annual Financial Progress */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span>Active Sponsors & Annual Commitment Tracking</span>
          </h3>
          <span className="text-[11px] text-slate-400">Click any sponsor to inspect chronological payment ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Sponsor ID</th>
                <th className="p-3">Sponsor Name</th>
                <th className="p-3">Annual Target</th>
                <th className="p-3">Total Paid</th>
                <th className="p-3">Remaining Left Out</th>
                <th className="p-3">Progress</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(Array.isArray(sponsors) ? sponsors : []).map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-semibold text-emerald-400">{sp.sponsorId}</td>
                  <td className="p-3 font-bold text-white">
                    {sp.name}
                    {sp.isAnonymous && (
                      <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-500/20">
                        <EyeOff className="w-2.5 h-2.5" />
                        Anonymous
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-amber-400">₹{(sp.annualCommitment || 0).toLocaleString('en-IN')}</td>
                  <td className="p-3 font-bold text-emerald-400">₹{(sp.totalPaid || 0).toLocaleString('en-IN')}</td>
                  <td className="p-3 font-bold text-rose-400">₹{(sp.remainingBalance || 0).toLocaleString('en-IN')}</td>
                  <td className="p-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (sp.fulfillmentPercentage || 0) >= 100
                              ? 'bg-emerald-400'
                              : (sp.fulfillmentPercentage || 0) > 50
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, sp.fulfillmentPercentage || 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300">{sp.fulfillmentPercentage || 0}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPaymentTrackerSponsor(sp)}
                        className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        title="Track payments from this sponsor"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        Payments
                      </button>
                      <button
                        onClick={() => setSelectedLedgerSponsor(sp)}
                        className="inline-flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        View Ledger
                      </button>
                      <button
                        onClick={() => setEditingSponsor({ ...sp, annualCommitment: sp.annualCommitment || 0, commitmentStartDate: sp.commitmentStartDate ? new Date(sp.commitmentStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] })}
                        className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                        title="Edit sponsor details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sp)}
                        disabled={deletingId === sp.id}
                        className="inline-flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        title="Delete sponsor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === sp.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chronological Payment History Modal */}
      {selectedLedgerSponsor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-400" />
                  Donor Financial Ledger & Payment History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedLedgerSponsor.name} ({selectedLedgerSponsor.sponsorId}) · Contact: {selectedLedgerSponsor.contact1}
                </p>
              </div>
              <button
                onClick={() => setSelectedLedgerSponsor(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
                <div className="text-xs text-slate-400 font-medium">Annual Commitment</div>
                <div className="text-xl font-extrabold text-amber-400 mt-1">
                  ₹{(selectedLedgerSponsor.annualCommitment || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Target per year</div>
              </div>
              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                <div className="text-xs text-slate-400 font-medium">Total Amount Paid</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  ₹{(selectedLedgerSponsor.totalPaid || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {selectedLedgerSponsor.paymentHistory?.length || 0} transaction(s)
                </div>
              </div>
              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20">
                <div className="text-xs text-slate-400 font-medium">Remaining Left Out</div>
                <div className="text-xl font-extrabold text-rose-400 mt-1">
                  ₹{(selectedLedgerSponsor.remainingBalance || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Balance due</div>
              </div>
              <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20">
                <div className="text-xs text-slate-400 font-medium">Commitment Start Date</div>
                <div className="text-sm font-extrabold text-teal-300 mt-1.5">
                  {new Date(selectedLedgerSponsor.commitmentStartDate).toLocaleDateString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">First payment / fixed</div>
              </div>
            </div>

            {/* Commitment Fulfillment Progress Bar */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Commitment Fulfillment Status</span>
                <span className="text-teal-400">{selectedLedgerSponsor.fulfillmentPercentage || 0}% Fulfilled</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, selectedLedgerSponsor.fulfillmentPercentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Chronological Payment History List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  Chronological Payment History
                </span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">oldest to newest</span>
              </h4>

              {selectedLedgerSponsor.paymentHistory?.length === 0 ? (
                <div className="bg-slate-800/40 p-8 rounded-xl text-center text-slate-500 text-xs italic">
                  No payments recorded for this donor yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5">Voucher / Receipt No</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Heading / Purpose</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {selectedLedgerSponsor.paymentHistory.map((pay: any) => (
                        <tr key={pay.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-amber-400 font-semibold">{pay.voucherNo}</td>
                          <td className="p-2.5">{new Date(pay.date).toLocaleDateString('en-IN')}</td>
                          <td className="p-2.5 font-medium text-white">{pay.heading}</td>
                          <td className="p-2.5 text-slate-400 text-[11px]">{pay.paymentMode}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            ₹{pay.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLedgerSponsor(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-6 py-2 rounded-xl transition"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Tracker Modal */}
      {paymentTrackerSponsor && (
        <SponsorPaymentTracker
          sponsorId={paymentTrackerSponsor.id}
          sponsorName={paymentTrackerSponsor.isAnonymous ? 'Anonymous Donor' : paymentTrackerSponsor.name}
          onClose={() => { setPaymentTrackerSponsor(null); fetchData(); }}
        />
      )}

      {/* Edit Sponsor Modal */}
      {editingSponsor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  Edit Sponsor Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingSponsor.sponsorId} · Updating contact, address & commitment information
                </p>
              </div>
              <button
                onClick={() => setEditingSponsor(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSponsor} className="space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingSponsor.name}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Gender</label>
                  <select
                    value={editingSponsor.gender || 'Male'}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, gender: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Primary Contact <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingSponsor.contact1 || ''}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, contact1: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">WhatsApp / Alternate Contact</label>
                  <input
                    type="text"
                    value={editingSponsor.whatsapp || ''}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, whatsapp: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">House Name / C/O</label>
                  <input
                    type="text"
                    value={editingSponsor.houseName || ''}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, houseName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Place / Locality</label>
                  <input
                    type="text"
                    value={editingSponsor.place || ''}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, place: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Annual Commitment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSponsor.annualCommitment ?? 0}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, annualCommitment: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Commitment Start Date</label>
                  <input
                    type="date"
                    value={editingSponsor.commitmentStartDate || ''}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, commitmentStartDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="edit-anonymous"
                  checked={Boolean(editingSponsor.isAnonymous)}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <label htmlFor="edit-anonymous" className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  Mark as Anonymous / Well-wisher (hides identity in public views)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSponsor(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSponsor}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  {savingSponsor ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
