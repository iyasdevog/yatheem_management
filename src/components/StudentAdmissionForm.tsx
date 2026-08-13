'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Camera, 
  Upload, 
  MapPin, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Building,
  Heart,
  Search,
  Sparkles,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  Edit3,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export const StudentAdmissionForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Student list state
  const [studentList, setStudentList] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [showStudentList, setShowStudentList] = useState(true);

  // Custom Mahallu Addition & Admin Review State
  const [showAddMahalluModal, setShowAddMahalluModal] = useState(false);
  const [newMahalluName, setNewMahalluName] = useState('');
  const [newMahalluPlace, setNewMahalluPlace] = useState('');
  const [addingMahallu, setAddingMahallu] = useState(false);

  const [showReviewMahalluModal, setShowReviewMahalluModal] = useState(false);
  const [editingMahallu, setEditingMahallu] = useState<any | null>(null);
  const [savingMahallu, setSavingMahallu] = useState(false);
  const [mahalluSearch, setMahalluSearch] = useState('');

  // PIN Code Auto-Lookup State
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState('');
  const [pincodeErrorMsg, setPincodeErrorMsg] = useState('');

  // Location Masters state
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [localBodyTypes, setLocalBodyTypes] = useState<any[]>([]);
  const [localBodies, setLocalBodies] = useState<any[]>([]);
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [mahallus, setMahallus] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<any>({
    admissionNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
    familyNo: `FAM-${Math.floor(1000 + Math.random() * 9000)}`,
    admissionDate: new Date().toISOString().split('T')[0],
    name: '',
    dob: '2015-05-10',
    gender: 'Male',
    nationalId: '',
    contact1: '',
    contact2: '',
    whatsapp: '',
    status: 'ACTIVE',
    inactiveReason: '',
    sponsorId: '',
    sponsorshipStartDate: new Date().toISOString().split('T')[0],
    guardianName: '',
    fatherName: '',
    motherName: '',
    houseName: '',
    place: '',
    stateId: '',
    districtId: '',
    localBodyTypeId: '',
    localBodyId: '',
    postOfficeId: '',
    pinCode: '',
    mahalluId: '',
    familyCategory: 'Yatheem / BPL',
    photoKey: '',
    photoPreviewUrl: '',
  });

  // Multi-Year Educational History List
  const [educationalRecords, setEducationalRecords] = useState<any[]>([
    {
      academicYear: '2025-2026',
      schoolCategory: 'UP',
      schoolName: '',
      classDivision: '5-A',
      schoolTeacherName: '',
      schoolTeacherContact: '',
      madrasaCategory: 'EK',
      madrasaName: '',
      madrasaClass: '5',
      madrasaTeacherName: '',
      madrasaTeacherContact: '',
    },
  ]);

  // Initial Fetch Location & Masters
  useEffect(() => {
    fetchInitialMasters();
    fetchStudentList();
  }, []);

  const fetchStudentList = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudentList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch student list:', err);
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!window.confirm(`Delete student "${student.name}" (${student.admissionNo})? All related records will be removed. This cannot be undone.`)) return;
    try {
      setDeletingStudentId(student.id);
      const res = await fetch(`/api/students?id=${student.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Student ${student.name} deleted successfully.`);
        fetchStudentList();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Delete failed.');
      }
    } finally {
      setDeletingStudentId(null);
    }
  };

  const fetchMahallus = async () => {
    try {
      const res = await fetch('/api/mahallus');
      const data = await res.json();
      setMahallus(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch mahallus:', err);
    }
  };

  const handleAddMahallu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMahalluName || !formData.districtId) return;

    try {
      setAddingMahallu(true);
      const res = await fetch('/api/mahallus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMahalluName,
          districtId: formData.districtId,
          place: newMahalluPlace,
          isVerified: false, // flagged for admin review
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        setSuccessMsg(`Custom Mahallu "${data.name}" added successfully (Flagged for Admin Review).`);
        await fetchMahallus();
        setFormData((prev: any) => ({ ...prev, mahalluId: data.id }));
        setNewMahalluName('');
        setNewMahalluPlace('');
        setShowAddMahalluModal(false);
      } else {
        setErrorMsg(data.error || 'Failed to add custom mahallu');
      }
    } catch (err) {
      setErrorMsg('Error adding custom mahallu');
    } finally {
      setAddingMahallu(false);
    }
  };

  const handleSaveMahalluEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMahallu || !editingMahallu.id) return;

    try {
      setSavingMahallu(true);
      const res = await fetch('/api/mahallus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMahallu.id,
          name: editingMahallu.name,
          districtId: editingMahallu.districtId,
          place: editingMahallu.place,
          isVerified: editingMahallu.isVerified !== undefined ? editingMahallu.isVerified : true,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Mahallu updated and spelling corrected!`);
        fetchMahallus();
        setEditingMahallu(null);
      } else {
        setErrorMsg('Failed to update Mahallu');
      }
    } catch (err) {
      setErrorMsg('Error updating Mahallu');
    } finally {
      setSavingMahallu(false);
    }
  };

  const handleDeleteMahallu = async (mId: string, mName: string) => {
    if (!window.confirm(`Delete Mahallu "${mName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/mahallus?id=${mId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Mahallu "${mName}" deleted.`);
        fetchMahallus();
      }
    } catch (err) {
      console.error('Delete Mahallu error:', err);
    }
  };

  const fetchInitialMasters = async () => {
    try {
      const [resLoc, resMah, resSpon] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/mahallus'),
        fetch('/api/sponsors'),
      ]);
      const dataLoc = await resLoc.json();
      const dataMah = await resMah.json();
      const dataSpon = await resSpon.json();

      setStates(dataLoc.states || []);
      setLocalBodyTypes(dataLoc.localBodyTypes || []);
      setMahallus(dataMah || []);
      setSponsors(dataSpon || []);

      if (dataLoc.states?.length > 0) {
        const firstState = dataLoc.states[0];
        setFormData((prev: any) => ({ ...prev, stateId: firstState.id }));
        setDistricts(firstState.districts || []);
        fetchLocalBodies('', '', firstState.id);
        fetchPostOffices('', '', firstState.id);
      } else {
        fetchLocalBodies();
        fetchPostOffices();
      }
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  // Quick PIN Code Auto-Lookup Handler
  const handlePincodeLookup = async (code: string) => {
    setPincodeInput(code);
    setPincodeErrorMsg('');
    setPincodeSuccessMsg('');

    if (code.length !== 6 || !/^\d{6}$/.test(code)) return;

    setPincodeLoading(true);
    try {
      const res = await fetch(`/api/locations?type=pincodeLookup&code=${code}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setPincodeErrorMsg(data.error || 'No location found for this PIN code');
      } else {
        setPincodeSuccessMsg(`Auto-detected: ${data.districtName || ''}, ${data.stateName || ''} (${data.source})`);
        setFormData((prev: any) => ({
          ...prev,
          pinCode: code,
          stateId: data.stateId || prev.stateId,
          districtId: data.districtId || prev.districtId,
        }));

        if (data.stateId) {
          const resDist = await fetch(`/api/locations?type=districts&stateId=${data.stateId}`);
          const dists = await resDist.json();
          setDistricts(dists || []);
        }

        if (data.districtId) {
          fetchLocalBodies(data.districtId, formData.localBodyTypeId, data.stateId);
        }

        if (data.postOffices?.length > 0) {
          setPostOffices(
            data.postOffices.map((po: any, idx: number) => ({
              id: po.id || `ext-po-${idx}`,
              name: po.name,
              pinCode: po.pinCode || code,
            }))
          );
        } else if (data.districtId) {
          fetchPostOffices(data.districtId, '', data.stateId);
        }
      }
    } catch (err) {
      setPincodeErrorMsg('Failed to lookup PIN code');
    } finally {
      setPincodeLoading(false);
    }
  };

  // Cascading Location Handler: State -> District
  const handleStateChange = async (stId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      stateId: stId,
      districtId: '',
      localBodyId: '',
      postOfficeId: '',
      pinCode: '',
    }));
    const res = await fetch(`/api/locations?type=districts&stateId=${stId}`);
    const dists = await res.json();
    setDistricts(dists || []);
    fetchLocalBodies('', formData.localBodyTypeId, stId);
    fetchPostOffices('', '', stId);
  };

  // Cascading Location Handler: District & Type -> Local Bodies
  const handleDistrictChange = async (dstId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      districtId: dstId,
      localBodyId: '',
      postOfficeId: '',
      pinCode: '',
    }));
    fetchLocalBodies(dstId, formData.localBodyTypeId, formData.stateId);
    fetchPostOffices(dstId, '', formData.stateId);
  };

  const handleLocalBodyTypeChange = async (typeId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      localBodyTypeId: typeId,
      localBodyId: '',
    }));
    fetchLocalBodies(formData.districtId, typeId, formData.stateId);
  };

  const fetchLocalBodies = async (dstId?: string, typeId?: string, stId?: string) => {
    const params = new URLSearchParams({ type: 'localBodies' });
    if (dstId) params.append('districtId', dstId);
    if (typeId) params.append('localBodyTypeId', typeId);
    if (stId) params.append('stateId', stId);

    const res = await fetch(`/api/locations?${params.toString()}`);
    const lbs = await res.json();

    if (Array.isArray(lbs) && lbs.length > 0) {
      setLocalBodies(lbs);
    } else if (typeId && (dstId || stId)) {
      // Fallback: if no local bodies for this specific type, fetch all local bodies in district/state
      const fallbackParams = new URLSearchParams({ type: 'localBodies' });
      if (dstId) fallbackParams.append('districtId', dstId);
      if (stId) fallbackParams.append('stateId', stId);
      const fbRes = await fetch(`/api/locations?${fallbackParams.toString()}`);
      const fbLbs = await fbRes.json();
      setLocalBodies(Array.isArray(fbLbs) ? fbLbs : []);
    } else {
      setLocalBodies(Array.isArray(lbs) ? lbs : []);
    }
  };

  const fetchPostOffices = async (dstId?: string, lbId?: string, stId?: string) => {
    const params = new URLSearchParams({ type: 'postOffices' });
    if (dstId) params.append('districtId', dstId);
    if (lbId && lbId !== 'custom') params.append('localBodyId', lbId);
    if (stId) params.append('stateId', stId);

    const res = await fetch(`/api/locations?${params.toString()}`);
    const pos = await res.json();

    if (Array.isArray(pos) && pos.length > 0) {
      setPostOffices(pos);
    } else if (lbId && (dstId || stId)) {
      // Fallback: if no post office linked to this specific local body, fetch post offices in district/state
      const fallbackParams = new URLSearchParams({ type: 'postOffices' });
      if (dstId) fallbackParams.append('districtId', dstId);
      if (stId) fallbackParams.append('stateId', stId);
      const fbRes = await fetch(`/api/locations?${fallbackParams.toString()}`);
      const fbPos = await fbRes.json();
      setPostOffices(Array.isArray(fbPos) ? fbPos : []);
    } else {
      setPostOffices(Array.isArray(pos) ? pos : []);
    }
  };

  // Auto-fill Pin Code when Post Office selected
  const handlePostOfficeChange = async (poId: string) => {
    setFormData((prev: any) => ({ ...prev, postOfficeId: poId }));
    if (!poId || poId === 'custom') return;
    const selectedPo = postOffices.find((po) => po.id === poId);
    if (selectedPo && selectedPo.pinCode) {
      setFormData((prev: any) => ({ ...prev, pinCode: selectedPo.pinCode }));
      return;
    }
    const res = await fetch(`/api/locations?type=pinCode&postOfficeId=${poId}`);
    const data = await res.json();
    if (data.pinCode) {
      setFormData((prev: any) => ({ ...prev, pinCode: data.pinCode }));
    }
  };

  // File & Camera Photo Upload via Storage Adapter (Max 100 KB limit)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    const MAX_SIZE = 100 * 1024; // 100 KB
    if (file.size > MAX_SIZE) {
      const fileKb = (file.size / 1024).toFixed(1);
      setErrorMsg(`Photo size (${fileKb} KB) exceeds the maximum limit of 100 KB. Please compress or select a smaller photo.`);
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pathPrefix', 'students/photos');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to upload photo.');
        return;
      }

      if (data.key) {
        setFormData((prev: any) => ({
          ...prev,
          photoKey: data.key,
          photoPreviewUrl: data.url,
        }));
        setSuccessMsg('Photo uploaded successfully!');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      setErrorMsg('Error uploading photo.');
    } finally {
      setLoading(false);
    }
  };

  // Add Educational Lineage Row
  const addEduRecordRow = () => {
    setEducationalRecords((prev) => [
      ...prev,
      {
        academicYear: '2026-2027',
        schoolCategory: 'UP',
        schoolName: '',
        classDivision: '',
        schoolTeacherName: '',
        schoolTeacherContact: '',
        madrasaCategory: 'EK',
        madrasaName: '',
        madrasaClass: '',
        madrasaTeacherName: '',
        madrasaTeacherContact: '',
      },
    ]);
  };

  const removeEduRecordRow = (index: number) => {
    setEducationalRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEduRecordField = (index: number, field: string, value: string) => {
    setEducationalRecords((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Submit Admission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        educationalRecords,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit student admission');
      } else {
        setSuccessMsg(`Student Admission created successfully! Admission No: ${data.admissionNo}`);
        fetchStudentList();
        // Reset form
        setFormData((prev: any) => ({
          ...prev,
          admissionNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
          familyNo: `FAM-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          photoKey: '',
          photoPreviewUrl: '',
        }));
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span>Student Admission &amp; Historical Educational Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register new orphan/student record with cascading location lookups, photo upload, and multi-year educational lineage.
          </p>
        </div>
      </div>

      {/* Registered Students List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStudentList((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Registered Students</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{studentList.length} total</span>
          </div>
          {showStudentList ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showStudentList && (
          <div className="border-t border-slate-800 p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, admission no, place..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Admission No</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Gender</th>
                    <th className="px-3 py-2">Place</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Sponsor</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {studentList
                    .filter((s) =>
                      !studentSearch ||
                      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.admissionNo?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.place?.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-mono text-emerald-400 font-semibold">{s.admissionNo}</td>
                        <td className="px-3 py-2 font-bold text-white">{s.name}</td>
                        <td className="px-3 py-2 text-slate-400">{s.gender}</td>
                        <td className="px-3 py-2 text-slate-400">{s.place || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">
                          {s.sponsor ? (s.sponsor.isAnonymous ? 'Well-wisher' : s.sponsor.name) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            disabled={deletingStudentId === s.id}
                            className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            {deletingStudentId === s.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  {studentList.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500 italic">No students registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Admission & Basic Identifiers */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>1. Admission & Sponsor Setup</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Admission No (Auto/Editable)</label>
              <input
                type="text"
                value={formData.admissionNo}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Family No (Auto/Editable)</label>
              <input
                type="text"
                value={formData.familyNo}
                onChange={(e) => setFormData({ ...formData, familyNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Admission Date</label>
              <input
                type="date"
                value={formData.admissionDate}
                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Sponsor Allocation (Optional)</label>
              <select
                value={formData.sponsorId}
                onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Sponsor --</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.isAnonymous ? `${s.name} (Anonymous)` : s.name} [{s.sponsorId}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Sponsorship Start Date</label>
              <input
                type="date"
                value={formData.sponsorshipStartDate}
                onChange={(e) => setFormData({ ...formData, sponsorshipStartDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Student Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            {formData.status === 'INACTIVE' && (
              <div>
                <label className="block text-xs text-amber-400 mb-1 font-medium">
                  Reason for Inactive (Multilingual Text Support)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ഉപരിപഠനത്തിനായി സ്ഥലം മാറി പോയി..."
                  value={formData.inactiveReason}
                  onChange={(e) => setFormData({ ...formData, inactiveReason: e.target.value })}
                  className="w-full bg-slate-800 border border-amber-500/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Personal Details & Photo Upload */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>2. Personal Details & Photo Upload</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-4 border-b border-slate-800">
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden relative group">
              {formData.photoPreviewUrl ? (
                <img src={formData.photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition" />
              )}
            </div>
            <div>
              <label className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-emerald-500/20">
                <Upload className="w-4 h-4" />
                <span>Upload Student Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-500 mt-1">
                Max file size: <span className="font-semibold text-emerald-400">100 KB</span> · Storage Provider: <span className="uppercase text-slate-400 font-medium">{process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'Firebase'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ameen Rahman"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Contact Number 1</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={formData.contact1}
                onChange={(e) => setFormData({ ...formData, contact1: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">WhatsApp Number</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">National Identifier (Aadhaar/ID)</label>
              <input
                type="text"
                placeholder="Optional"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Cascading Geographic Address */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>3. Cascading Administrative Location & Address</span>
            </h3>
          </div>

          {/* Quick PIN Code Auto-Lookup Box */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick PIN Code Auto-Lookup (India Post Integration)
              </label>
              <span className="text-[10px] text-slate-400">Type 6-digit PIN to auto-detect State, District & Post Offices</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN (e.g. 676505)"
                  value={pincodeInput}
                  onChange={(e) => handlePincodeLookup(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
              </div>
              {pincodeLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching location from India Post...
                </div>
              )}
            </div>
            {pincodeSuccessMsg && (
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{pincodeSuccessMsg}</span>
              </div>
            )}
            {pincodeErrorMsg && (
              <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{pincodeErrorMsg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">State</label>
              <select
                value={formData.stateId}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                {states.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">District</label>
              <select
                value={formData.districtId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select District --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Local Body Type</label>
              <select
                value={formData.localBodyTypeId}
                onChange={(e) => handleLocalBodyTypeChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Type --</option>
                {localBodyTypes.map((lbt) => (
                  <option key={lbt.id} value={lbt.id}>{lbt.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Local Body</label>
              <select
                value={formData.localBodyId}
                onChange={(e) => {
                  setFormData({ ...formData, localBodyId: e.target.value });
                  fetchPostOffices(formData.districtId, e.target.value, formData.stateId);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Local Body --</option>
                {localBodies.map((lb) => (
                  <option key={lb.id} value={lb.id}>{lb.name}</option>
                ))}
                <option value="custom">Other / Enter Custom Local Body...</option>
              </select>
              {formData.localBodyId === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom local body name"
                  value={formData.customLocalBody || ''}
                  onChange={(e) => setFormData({ ...formData, customLocalBody: e.target.value })}
                  className="w-full bg-slate-900 border border-amber-500/50 text-amber-300 rounded-xl px-3 py-2 text-xs mt-2 focus:outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Post Office (Auto-fills PIN)</label>
              <select
                value={formData.postOfficeId}
                onChange={(e) => handlePostOfficeChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Post Office --</option>
                {postOffices.map((po) => (
                  <option key={po.id} value={po.id}>{po.name} {po.pinCode ? `(${po.pinCode})` : ''}</option>
                ))}
                <option value="custom">Other / Enter Custom Post Office...</option>
              </select>
              {formData.postOfficeId === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom post office name"
                  value={formData.customPostOffice || ''}
                  onChange={(e) => setFormData({ ...formData, customPostOffice: e.target.value })}
                  className="w-full bg-slate-900 border border-amber-500/50 text-amber-300 rounded-xl px-3 py-2 text-xs mt-2 focus:outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-emerald-400 mb-1 font-medium">Pin Code</label>
              <input
                type="text"
                readOnly={formData.postOfficeId !== 'custom'}
                value={formData.pinCode}
                onChange={(e) => {
                  if (formData.postOfficeId === 'custom') {
                    setFormData({ ...formData, pinCode: e.target.value });
                  }
                }}
                placeholder="Auto-filled from Post Office"
                className={`w-full bg-slate-800/80 border rounded-xl px-3 py-2 text-sm focus:outline-none ${
                  formData.postOfficeId === 'custom'
                    ? 'border-amber-500/50 text-amber-300'
                    : 'border-emerald-500/30 text-emerald-300 font-semibold'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400 font-medium">Mahallu Selection</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMahalluModal(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> + Add Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewMahalluModal(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 transition"
                    title="Review spelling & verify Mahallus"
                  >
                    <ShieldCheck className="w-3 h-3" /> Review / Correct
                  </button>
                </div>
              </div>
              <select
                value={formData.mahalluId}
                onChange={(e) => setFormData({ ...formData, mahalluId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Mahallu --</option>
                {mahallus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {!m.isVerified ? ' (Pending Admin Review)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">House Name / Building</label>
              <input
                type="text"
                placeholder="e.g. Rahman Manzil"
                value={formData.houseName}
                onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Place / Locality</label>
              <input
                type="text"
                placeholder="e.g. Down Hill"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Educational History Lineage Builder */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>4. Educational Lineage Tracking (Multi-Year Records)</span>
            </h3>
            <button
              type="button"
              onClick={addEduRecordRow}
              className="inline-flex items-center space-x-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Year Record</span>
            </button>
          </div>

          {educationalRecords.map((edu, idx) => (
            <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3 relative">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs font-bold text-slate-300">Year Record #{idx + 1}</span>
                {educationalRecords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEduRecordRow(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={edu.academicYear}
                    onChange={(e) => updateEduRecordField(idx, 'academicYear', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">School Category</label>
                  <select
                    value={edu.schoolCategory}
                    onChange={(e) => updateEduRecordField(idx, 'schoolCategory', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="Not Studying">Not Studying</option>
                    <option value="Montessori">Montessori</option>
                    <option value="KG">KG</option>
                    <option value="LP">LP</option>
                    <option value="UP">UP</option>
                    <option value="High School">High School</option>
                    <option value="Higher Secondary">Higher Secondary</option>
                    <option value="Degree">Degree</option>
                    <option value="Education Complete">Education Complete</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">School Name</label>
                  <input
                    type="text"
                    placeholder="e.g. MSP HSS"
                    value={edu.schoolName}
                    onChange={(e) => updateEduRecordField(idx, 'schoolName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Class & Division</label>
                  <input
                    type="text"
                    placeholder="e.g. 5-A"
                    value={edu.classDivision}
                    onChange={(e) => updateEduRecordField(idx, 'classDivision', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Madrasa Category</label>
                  <select
                    value={edu.madrasaCategory}
                    onChange={(e) => updateEduRecordField(idx, 'madrasaCategory', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="EK">EK</option>
                    <option value="AP">AP</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Madrasa Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hayathul Islam Madrasa"
                    value={edu.madrasaName}
                    onChange={(e) => updateEduRecordField(idx, 'madrasaName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Madrasa Class</label>
                  <input
                    type="text"
                    placeholder="e.g. 5"
                    value={edu.madrasaClass}
                    onChange={(e) => updateEduRecordField(idx, 'madrasaClass', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {loading ? 'Registering Student...' : 'Submit Student Admission'}
          </button>
        </div>
      </form>

      {/* ── MODAL 1: ADD CUSTOM MAHALLU ── */}
      {showAddMahalluModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddMahalluModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Add Custom Mahallu</h3>
            </div>
            <p className="text-xs text-slate-400">
              New custom Mahallus will be added to the dropdown immediately and flagged for Admin spelling review & verification.
            </p>
            <form onSubmit={handleAddMahallu} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Mahallu Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Koduvally Central Juma Masjid Mahallu"
                  value={newMahalluName}
                  onChange={(e) => setNewMahalluName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Place / Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Koduvally Town"
                  value={newMahalluPlace}
                  onChange={(e) => setNewMahalluPlace(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">State *</label>
                <select
                  value={formData.stateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs mb-3"
                  required
                >
                  <option value="">-- Select State --</option>
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">District *</label>
                <select
                  value={formData.districtId}
                  onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  required
                >
                  <option value="">-- Select District --</option>
                  {districts.length > 0
                    ? districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    : states.map((st) =>
                        st.districts?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} ({st.name})</option>
                        ))
                      )}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMahalluModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMahallu}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {addingMahallu ? 'Saving...' : 'Save & Select Mahallu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADMIN MAHALLU REVIEW & SPELLING CORRECTION ── */}
      {showReviewMahalluModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowReviewMahalluModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Mahallu Master — Admin Review &amp; Spelling Correction</h3>
                <p className="text-xs text-slate-400">Review custom added Mahallus, correct spelling errors, and approve entries to unify dropdown lists.</p>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Mahallus to review/correct spelling..."
                value={mahalluSearch}
                onChange={(e) => setMahalluSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Edit form panel if editing a Mahallu */}
            {editingMahallu && (
              <form onSubmit={handleSaveMahalluEdit} className="bg-slate-800/80 p-4 rounded-xl border border-amber-500/40 space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Correcting Spelling for: {editingMahallu.name}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Mahallu Name (Spelling Corrected)</label>
                    <input
                      type="text"
                      value={editingMahallu.name}
                      onChange={(e) => setEditingMahallu({ ...editingMahallu, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Place / Locality</label>
                    <input
                      type="text"
                      value={editingMahallu.place || ''}
                      onChange={(e) => setEditingMahallu({ ...editingMahallu, place: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Status</label>
                    <select
                      value={editingMahallu.isVerified ? 'VERIFIED' : 'PENDING'}
                      onChange={(e) => setEditingMahallu({ ...editingMahallu, isVerified: e.target.value === 'VERIFIED' })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    >
                      <option value="VERIFIED">VERIFIED / APPROVED</option>
                      <option value="PENDING">PENDING REVIEW</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMahallu(null)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="submit"
                    disabled={savingMahallu}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    {savingMahallu ? 'Saving...' : 'Save & Verify Spelling'}
                  </button>
                </div>
              </form>
            )}

            {/* List table */}
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Mahallu Name</th>
                    <th className="p-2.5">Place</th>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {mahallus
                    .filter((m) => !mahalluSearch || m.name.toLowerCase().includes(mahalluSearch.toLowerCase()) || m.place?.toLowerCase().includes(mahalluSearch.toLowerCase()))
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/50">
                        <td className="p-2.5 font-bold text-white">{m.name}</td>
                        <td className="p-2.5 text-slate-400">{m.place || '—'}</td>
                        <td className="p-2.5 text-slate-400">{m.district?.name || '—'}</td>
                        <td className="p-2.5">
                          {m.isVerified ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                              Verified
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold animate-pulse">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMahallu(m)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3" /> Edit / Correct
                            </button>
                            <button
                              onClick={() => handleDeleteMahallu(m.id, m.name)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded text-[10px] font-semibold transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
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
