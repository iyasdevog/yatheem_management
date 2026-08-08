'use client';

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  EyeOff, 
  UserCheck, 
  Plus, 
  Layers, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

export const SponsorSlabEngine: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

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
    selectedStudentId: '',
    selectedSlabId: '',
    customAmount: '',
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

      setSponsors(dataS || []);
      setSlabs(dataSl || []);
      setStudents(dataSt || []);
    } catch (err) {
      console.error('Failed to fetch sponsor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsor.name || !newSponsor.contact1) return;

    try {
      setLoading(true);
      const payload = {
        ...newSponsor,
        studentAllocations: newSponsor.selectedStudentId
          ? [
              {
                studentId: newSponsor.selectedStudentId,
                slabId: newSponsor.selectedSlabId,
                customAmount: newSponsor.customAmount,
              },
            ]
          : [],
      };

      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg('Sponsor registered and slab allocated successfully!');
        setNewSponsor({
          sponsorId: `SP-2026-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          gender: 'Male',
          isAnonymous: false,
          contact1: '',
          whatsapp: '',
          houseName: '',
          place: '',
          selectedStudentId: '',
          selectedSlabId: '',
          customAmount: '',
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
            <span>Sponsor Master & Anonymous Slab Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure flexible sponsorship slabs, register donors, map student allocations, and enforce donor anonymity masking.
          </p>
        </div>
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
            <span>Register Sponsor & Map Student</span>
          </h3>

          <form onSubmit={handleCreateSponsor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Sponsor ID</label>
                <input
                  type="text"
                  value={newSponsor.sponsorId}
                  onChange={(e) => setNewSponsor({ ...newSponsor, sponsorId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name</label>
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
                <label className="block text-xs text-slate-400 mb-1 font-medium">Contact Number</label>
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

            {/* Anonymous Toggle */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Anonymous Sponsor Option</span>
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

            {/* Student & Slab Mapping Engine */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Map Active Student</label>
                <select
                  value={newSponsor.selectedStudentId}
                  onChange={(e) => setNewSponsor({ ...newSponsor, selectedStudentId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.admissionNo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Select Slab Master</label>
                <select
                  value={newSponsor.selectedSlabId}
                  onChange={(e) => setNewSponsor({ ...newSponsor, selectedSlabId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Select Slab --</option>
                  {slabs.map((sl) => (
                    <option key={sl.id} value={sl.id}>
                      {sl.name} (₹{sl.amount})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Or Custom Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Custom ₹"
                  value={newSponsor.customAmount}
                  onChange={(e) => setNewSponsor({ ...newSponsor, customAmount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-teal-500/20 transition"
            >
              Register & Allocate Slab
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
                placeholder="e.g. Fixed ₹50,000/mo"
                value={newSlab.name}
                onChange={(e) => setNewSlab({ ...newSlab, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Monthly Amount (₹)</label>
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
                placeholder="Covers food & tuition"
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
                <span className="font-extrabold text-emerald-400">₹{sl.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Sponsors List */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Users className="w-4 h-4 text-teal-400" />
          <span>Active Sponsors & Allocated Students</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Sponsor ID</th>
                <th className="p-3">Sponsor Name</th>
                <th className="p-3">Anonymity</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Mapped Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sponsors.map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-semibold text-emerald-400">{sp.sponsorId}</td>
                  <td className="p-3 font-bold text-white">{sp.name}</td>
                  <td className="p-3">
                    {sp.isAnonymous ? (
                      <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/20">
                        <EyeOff className="w-3 h-3" />
                        <span>Anonymous ("Well-wisher")</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Public</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{sp.contact1}</td>
                  <td className="p-3">
                    {sp.students?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {sp.students.map((st: any) => (
                          <span key={st.id} className="bg-slate-800 text-teal-300 px-2 py-0.5 rounded text-[10px]">
                            {st.name} ({st.admissionNo})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No student mapped</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
