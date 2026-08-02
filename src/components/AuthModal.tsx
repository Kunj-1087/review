'use client';

import { useState } from 'react';
import { sendOtpAction, verifyOtpAction } from '@/lib/actions/identity';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, ShieldCheck, AlertCircle, ArrowRight, Sparkles, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [matchedCollegeName, setMatchedCollegeName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await sendOtpAction(email);
    setLoading(false);

    if (res.success) {
      setDemoCode(res.demoCode || null);
      setMatchedCollegeName(res.matchedCollegeName || null);
      setStep('OTP');
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await verifyOtpAction(email, code);
    setLoading(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setError(res.error || 'Invalid OTP code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-6 sm:p-8 shadow-xl text-[var(--color-text-primary)] animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'EMAIL' ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[var(--color-text-primary)]">Student Authentication</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Passwordless OTP Email Sign-in</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-6 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--color-verified)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-verified)]" />
                <span>Identity-Content Isolation Guarantee</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                Your email address is strictly used for student verification. Public reviews and feed posts reference your pseudonymous handle only.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1.5">
                  Student Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@nirmauni.ac.in or gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] font-medium text-white text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Sending 6-Digit Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold tracking-tight text-[var(--color-text-primary)]">Enter 6-Digit Code</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Code sent to {email}</p>
              </div>
            </div>

            {demoCode && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-verified)]/10 border border-[var(--color-verified)]/30 text-[var(--color-verified)] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Local Demo OTP Code: {demoCode}</span>
                </div>
                <p className="text-[11px] text-[var(--color-verified)]/90">Enter code <code className="bg-[var(--color-bg-primary)] px-1 py-0.5 rounded font-mono text-[var(--color-verified)]">{demoCode}</code> to sign in instantly.</p>
              </div>
            )}

            {matchedCollegeName ? (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-verified)]/30 text-[var(--color-verified)] text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--color-verified)] shrink-0" />
                <span>Domain Verified! Auto-linked as student of <strong>{matchedCollegeName}</strong>.</span>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
                <span>Personal email detected. You can browse, but review posting requires Student ID card upload.</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-center text-lg font-mono tracking-widest text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-2.5 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] font-medium text-white text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <span>Verifying...</span> : <span>Verify & Sign In</span>}
              </button>

              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="w-full text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-1"
              >
                Change Email Address
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
