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
  Heart
} from 'lucide-react';

export const StudentAdmissionForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
  }, []);

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
      }
    } catch (err) {
      console.error('Failed to load masters:', err);
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
    setLocalBodies([]);
    setPostOffices([]);
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
    fetchLocalBodies(dstId, formData.localBodyTypeId);
    fetchPostOffices(dstId, '');
  };

  const handleLocalBodyTypeChange = async (typeId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      localBodyTypeId: typeId,
      localBodyId: '',
    }));
    fetchLocalBodies(formData.districtId, typeId);
  };

  const fetchLocalBodies = async (dstId: string, typeId: string) => {
    if (!dstId) return;
    const res = await fetch(
      `/api/locations?type=localBodies&districtId=${dstId}&localBodyTypeId=${typeId}`
    );
    const lbs = await res.json();
    setLocalBodies(lbs || []);
  };

  const fetchPostOffices = async (dstId: string, lbId: string) => {
    if (!dstId) return;
    const res = await fetch(
      `/api/locations?type=postOffices&districtId=${dstId}&localBodyId=${lbId}`
    );
    const pos = await res.json();
    setPostOffices(pos || []);
  };

  // Auto-fill Pin Code when Post Office selected
  const handlePostOfficeChange = async (poId: string) => {
    setFormData((prev: any) => ({ ...prev, postOfficeId: poId }));
    const res = await fetch(`/api/locations?type=pinCode&postOfficeId=${poId}`);
    const data = await res.json();
    if (data.pinCode) {
      setFormData((prev: any) => ({ ...prev, pinCode: data.pinCode }));
    }
  };

  // File & Camera Photo Upload via Storage Adapter
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      if (data.key) {
        setFormData((prev: any) => ({
          ...prev,
          photoKey: data.key,
          photoPreviewUrl: data.url,
        }));
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
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
            <span>Student Admission & Historical Educational Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register new orphan/student record with cascading location lookups, photo upload, and multi-year educational lineage.
          </p>
        </div>
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
                Saved via active IStorageService ({process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'Local Disk Adapter'})
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
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>3. Cascading Administrative Location & Address</span>
          </h3>

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
                  fetchPostOffices(formData.districtId, e.target.value);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Local Body --</option>
                {localBodies.map((lb) => (
                  <option key={lb.id} value={lb.id}>{lb.name}</option>
                ))}
              </select>
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
                  <option key={po.id} value={po.id}>{po.name} ({po.pinCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-emerald-400 mb-1 font-medium">Pin Code (Auto-filled)</label>
              <input
                type="text"
                readOnly
                value={formData.pinCode}
                placeholder="Auto-filled from Post Office"
                className="w-full bg-slate-800/80 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Mahallu Selection</label>
              <select
                value={formData.mahalluId}
                onChange={(e) => setFormData({ ...formData, mahalluId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Mahallu --</option>
                {mahallus.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
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
    </div>
  );
};
