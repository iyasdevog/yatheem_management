'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSearch,
  Database,
  GraduationCap,
  HeartHandshake,
  IndianRupee,
  Download,
  Receipt,
} from 'lucide-react';

export const ExcelImportModule: React.FC = () => {
  const [importType, setImportType] = useState<'students' | 'sponsors' | 'vouchers'>('students');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', importType);

      const res = await fetch('/api/import', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import failed');
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError('An unexpected error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = () => {
    if (importType === 'students') return 'Student';
    if (importType === 'sponsors') return 'Sponsor & Payment';
    return 'Voucher';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-lime-400" />
            Legacy Excel Data Migration Utility
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload existing XLSX/CSV spreadsheets for Students, Sponsors, or Historical Ledger Vouchers.
          </p>
        </div>
      </div>

      {/* Migration Type Switcher Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { setImportType('students'); setFile(null); setResult(null); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition border ${
            importType === 'students'
              ? 'bg-lime-500/10 text-lime-400 border-lime-500/40 shadow-lg'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Student Records Migration
        </button>
        <button
          onClick={() => { setImportType('sponsors'); setFile(null); setResult(null); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition border ${
            importType === 'sponsors'
              ? 'bg-teal-500/10 text-teal-400 border-teal-500/40 shadow-lg'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Sponsor Details & Previous Payments
        </button>
        <button
          onClick={() => { setImportType('vouchers'); setFile(null); setResult(null); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition border ${
            importType === 'vouchers'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40 shadow-lg'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Voucher & Financial Ledger Migration
        </button>
      </div>

      {/* Expected Format Card */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${
            importType === 'students' ? 'text-lime-400' : importType === 'sponsors' ? 'text-teal-400' : 'text-indigo-400'
          }`}>
            <Database className="w-4 h-4" />
            Expected Excel Column Format — {
              importType === 'students' ? 'Students Sheet' : importType === 'sponsors' ? 'Sponsors & Payments Sheet' : 'Legacy Vouchers Sheet'
            }
          </h3>
          <a
            href={`/api/import/template?type=${importType}`}
            download
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-md ${
              importType === 'students'
                ? 'bg-lime-500/10 text-lime-400 border-lime-500/30 hover:bg-lime-500/20'
                : importType === 'sponsors'
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Download {getTypeName()} Template (.xlsx)
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-slate-400">
            <thead className="bg-slate-800 text-slate-300 uppercase">
              <tr>
                {importType === 'students' ? (
                  [
                    'Admission No', 'Family No', 'Student Name', 'DOB (YYYY-MM-DD)',
                    'Gender', 'Contact Number', 'House Name', 'Place',
                    'District Name', 'Mahallu Name', 'School Name', 'Class',
                    'Sponsor Name', 'Status'
                  ].map((col) => <th key={col} className="p-2 text-left whitespace-nowrap">{col}</th>)
                ) : importType === 'sponsors' ? (
                  [
                    'Sponsor ID', 'Sponsor Name', 'C/O', 'Gender', 'Contact Number',
                    'Is Anonymous', 'House Name', 'Place', 'District Name',
                    'Annual Commitment', 'Count of Slabs', 'Slab Name',
                    'Sponsored Student Name', 'Sponsored Student Adm No',
                    'Starting Date', 'Ending Date',
                    'Payment Amount', 'Payment Date', 'Payment Mode', 'Payment Heading'
                  ].map((col) => <th key={col} className="p-2 text-left whitespace-nowrap">{col}</th>)
                ) : (
                  [
                    'Voucher No', 'Date (YYYY-MM-DD)', 'Amount', 'Type',
                    'Expense Heading', 'Payment Mode', 'Student Adm No', 'Student Name',
                    'Sponsor ID', 'Sponsor Name', 'Description', 'Created By'
                  ].map((col) => <th key={col} className="p-2 text-left whitespace-nowrap">{col}</th>)
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-800 text-slate-500 italic">
                {importType === 'students' ? (
                  [
                    'ADM-001', 'FAM-101', 'Mohammed Sahal', '2016-03-12',
                    'Male', '+91 9847112233', 'Green Cottage', 'Kondotty',
                    'Malappuram', 'Kondotty Mahallu', 'EMEA HSS', '4-A',
                    'Abdul Kareem', 'ACTIVE'
                  ].map((v, i) => <td key={i} className="p-2 whitespace-nowrap">{v}</td>)
                ) : importType === 'sponsors' ? (
                  [
                    'SP-2026-001', 'Abdul Kareem', 'Moideen Kutty', 'Male', '+91 9847112233',
                    'No', 'Rahman Manzil', 'Kondotty', 'Malappuram',
                    '50000', '1', 'Grand Fixed Sponsorship Slab',
                    'Mohammed Sahal', 'ADM-2026-001',
                    '2025-01-01', '2025-12-31',
                    '5000', '2025-04-10', 'Bank Transfer', 'Sponsorship Installment'
                  ].map((v, i) => <td key={i} className="p-2 whitespace-nowrap">{v}</td>)
                ) : (
                  [
                    'VCH-2026-001', '2025-04-15', '2500', 'STUDENT_EXPENSE',
                    'Dress exp', 'Cash', 'ADM-2026-001', 'Mohammed Sahal',
                    'SP-2026-001', 'Abdul Kareem', 'Uniform purchase', 'Office Staff'
                  ].map((v, i) => <td key={i} className="p-2 whitespace-nowrap">{v}</td>)
                )}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {importType === 'students'
            ? "Auto-generates: Admission No, Family No if empty · Auto-creates: Districts, Mahallus, Sponsors that don't exist · Flags dirty records to unmapped_records.json"
            : importType === 'sponsors'
            ? "Supports Optional Payment Fields: 'Payment Amount', 'Payment Date', 'Payment Mode', 'Payment Heading', 'Slab Name' · Creates historical vouchers automatically linked to the donor!"
            : "Supports both 'STUDENT_EXPENSE' and 'YATHEEM_COMMON' types · Auto-links to matching Students & Sponsors · Flags dirty records to unmapped_vouchers.json"}
        </p>
      </div>

      {/* File Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
          dragOver
            ? 'border-lime-400 bg-lime-500/5'
            : file
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
        }`}
      >
        {file ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
            <div className="font-bold text-white">{file.name}</div>
            <div className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB · Ready for {getTypeName()} import
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-500" />
            <div className="text-slate-300 font-medium">Drag & drop your {getTypeName()} Excel file here</div>
            <div className="text-slate-500 text-sm">or</div>
            <label className="inline-flex items-center gap-2 bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition">
              <Upload className="w-4 h-4" />
              Browse File (.xlsx / .csv)
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Import Button */}
      {file && (
        <div className="flex justify-center">
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-3 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-slate-950 font-extrabold px-12 py-3.5 rounded-xl shadow-lg shadow-lime-500/20 transition text-sm disabled:opacity-50"
          >
            <Database className="w-5 h-5" />
            {loading ? `Importing ${getTypeName()}...` : `Run ${getTypeName()} Migration`}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-white">{result.total}</div>
              <div className="text-xs text-slate-400 mt-1">Total Records in File</div>
            </div>
            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 text-center">
              <div className="text-3xl font-extrabold text-emerald-400">{result.importedCount}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {importType === 'students' ? 'Students' : importType === 'sponsors' ? 'Sponsors' : 'Vouchers'} Imported
              </div>
            </div>
            {result.paymentsRecordedCount !== undefined && (
              <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/20 text-center">
                <div className="text-3xl font-extrabold text-amber-400">{result.paymentsRecordedCount}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <IndianRupee className="w-3 h-3 text-amber-400" />
                  Payments Recorded
                </div>
              </div>
            )}
            <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/20 text-center">
              <div className="text-3xl font-extrabold text-rose-400">{result.skippedCount}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Dirty/Unmapped Records
              </div>
            </div>
          </div>

          {/* Unmapped Records Review */}
          {result.unmappedRecords?.length > 0 && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/20">
              <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                Unmapped / Dirty Records (Flagged for Manual Review)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.unmappedRecords.map((rec: any, idx: number) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">
                        {rec.row['Sponsor Name'] || rec.row['Student Name'] || rec.row['Expense Heading'] || rec.row['Heading'] || 'Unknown Record'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-medium">DIRTY RECORD #{idx + 1}</span>
                    </div>
                    <div className="text-[10px] text-rose-400 mt-1">⚠ {rec.reason}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Full dirty record log saved to{' '}
                <code className="bg-slate-800 px-1 rounded text-lime-400">
                  {importType === 'students' ? 'unmapped_records.json' : importType === 'sponsors' ? 'unmapped_sponsors.json' : 'unmapped_vouchers.json'}
                </code>{' '}
                in your project root.
              </p>
            </div>
          )}

          {result.importedCount > 0 && result.skippedCount === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Import complete! All {result.importedCount} {importType} records {result.paymentsRecordedCount ? `and ${result.paymentsRecordedCount} payments` : ''} imported cleanly.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

