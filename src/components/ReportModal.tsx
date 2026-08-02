'use client';

import { useState } from 'react';
import { reportAction } from '@/lib/actions/content';
import { Flag, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const REASONS = [
  'Fake review / Non-student entry',
  'Harassment or personal hate speech',
  'Disclosure of real student PII identity',
  'Spam, advertising, or self-promotion',
  'Misleading ratings or off-topic abuse',
  'Other',
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
}: {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'REVIEW' | 'COMMENT';
  targetId: string;
}) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    const res = await reportAction(targetType, targetId, finalReason);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.error || 'Failed to submit report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-6 shadow-xl text-[var(--color-text-primary)] animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-center justify-center text-[var(--color-warning)]">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Report Content</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">Flag items violating community rules</p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-3 bg-[var(--color-verified)]/10 border border-[var(--color-verified)]/30 rounded-lg text-[var(--color-verified)]">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <h4 className="font-semibold text-base text-[var(--color-verified)]">Report Submitted</h4>
            <p className="text-xs text-[var(--color-verified)]/90">Thank you. Content reaching 3+ reports will be auto-hidden pending admin moderation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[var(--color-text-secondary)]">Select the primary reason for reporting this {targetType.toLowerCase()}:</p>

            <div className="space-y-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-md border text-xs cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)] text-[var(--color-warning)] font-medium'
                      : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-[var(--color-warning)]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other' && (
              <textarea
                placeholder="Specify reason for reporting..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)]"
                rows={2}
              />
            )}

            {error && (
              <div className="p-3 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-[var(--color-warning)] hover:opacity-90 font-medium text-white text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <span>Submitting Report...</span> : <span>Submit Report for Moderation</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
