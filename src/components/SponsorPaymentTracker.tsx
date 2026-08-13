'use client';

import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  CreditCard,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface PaymentTrackerProps {
  sponsorId: string;
  sponsorName: string;
  onClose: () => void;
}

export const SponsorPaymentTracker: React.FC<PaymentTrackerProps> = ({
  sponsorId,
  sponsorName,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    reference: '',
    notes: '',
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/payments`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [sponsorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Failed to record payment' });
      } else {
        setMsg({ type: 'success', text: `₹${Number(form.amount).toLocaleString('en-IN')} payment recorded successfully.` });
        setForm({ amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash', reference: '', notes: '' });
        fetchPayments();
      }
    } catch {
      setMsg({ type: 'error', text: 'Unexpected error while recording payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Remove this payment record?')) return;
    setDeletingId(paymentId);
    try {
      await fetch(`/api/sponsors/${sponsorId}/payments?paymentId=${paymentId}`, { method: 'DELETE' });
      fetchPayments();
    } finally {
      setDeletingId(null);
    }
  };

  const formatINR = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const summary = data?.summary;
  const payments: any[] = data?.payments ?? [];

  const modeColors: Record<string, string> = {
    Cash: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPI: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Bank Transfer': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Cheque: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              Payment Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{sponsorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Summary Cards */}
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">Loading payment data…</div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Annual Commitment', value: formatINR(summary.annualCommitment), icon: TrendingUp, color: 'text-cyan-400' },
                  { label: 'Total Paid So Far', value: formatINR(summary.totalPaid), icon: CheckCircle2, color: 'text-emerald-400' },
                  { label: 'Balance Remaining', value: formatINR(Math.max(0, summary.balance)), icon: Clock, color: summary.balance > 0 ? 'text-amber-400' : 'text-emerald-400' },
                  { label: 'Completion', value: `${summary.percentPaid.toFixed(1)}%`, icon: IndianRupee, color: summary.percentPaid >= 100 ? 'text-emerald-400' : 'text-rose-400' },
                ].map((card) => (
                  <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
                    <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Payment Progress</span>
                  <span>{summary.percentPaid.toFixed(1)}% of {formatINR(summary.annualCommitment)}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      summary.percentPaid >= 100
                        ? 'bg-emerald-500'
                        : summary.percentPaid >= 60
                        ? 'bg-cyan-500'
                        : summary.percentPaid >= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, summary.percentPaid)}%` }}
                  />
                </div>
                {summary.balance > 0 ? (
                  <p className="text-[10px] text-amber-400 mt-1.5">
                    {formatINR(summary.balance)} still pending for this year's commitment.
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-400 mt-1.5">
                    ✓ Annual commitment fully paid!
                    {summary.totalPaid > summary.annualCommitment && ` (Extra: ${formatINR(summary.totalPaid - summary.annualCommitment)})`}
                  </p>
                )}
              </div>
            </>
          ) : null}

          {/* Feedback */}
          {msg && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          {/* New Payment Form */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
              <PlusCircle className="w-4 h-4" />
              Record New Payment
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 2000"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm((p) => ({ ...p, paymentMode: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Reference No (UTR / Cheque No)</label>
                  <input
                    type="text"
                    placeholder="Optional — transaction ID, cheque no..."
                    value={form.reference}
                    onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Notes</label>
                <input
                  type="text"
                  placeholder="Optional note about this payment..."
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Record Payment'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              Payment History
              <span className="ml-auto text-[10px] text-slate-400 font-normal">{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
            </h3>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm italic border border-dashed border-slate-700 rounded-xl">
                No payments recorded yet. Use the form above to add the first installment.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 hover:border-slate-600 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-emerald-400">{formatINR(p.amount)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modeColors[p.paymentMode] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                          {p.paymentMode}
                        </span>
                        {p.reference && (
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {p.reference}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {p.notes && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            {p.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="text-rose-500/50 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-rose-500/10 disabled:opacity-40"
                      title="Remove payment record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
