'use client';

import { Mail, Clock, ShieldCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';

export default function GrievancePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)] relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[var(--color-bg-primary)] text-[var(--color-accent)] border border-[var(--color-border)] font-semibold">
              India IT Rules 2021 Intermediary Compliance
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--color-text-primary)] mt-1">Grievance Redressal Mechanism</h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-primary)] p-4 rounded-lg border border-[var(--color-border)]">
          In accordance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, CV Gujarat Registry maintains a published Grievance Redressal mechanism for handling copyright, defamation, PII disclosure, or harassment complaints.
        </p>
      </div>

      {/* Grid: Officer Info & Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Officer Contact Box */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
          <div className="flex items-center gap-2.5 text-[var(--color-text-primary)] font-serif font-semibold">
            <ShieldCheck className="w-4 h-4 text-[var(--color-verified)]" />
            <h3>Designated Grievance Officer</h3>
          </div>

          <div className="space-y-3 text-xs text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] p-4 rounded-lg border border-[var(--color-border)] font-mono">
            <div>
              <p className="text-[var(--color-text-secondary)] text-[10px]">Officer Name:</p>
              <p className="text-[var(--color-verified)] font-bold">Aditya V. Joshi</p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] text-[10px]">Designation:</p>
              <p className="text-[var(--color-text-primary)]">Nodal Grievance & Compliance Officer</p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] text-[10px]">Official Jurisdiction:</p>
              <p className="text-[var(--color-text-primary)]">Gujarat High Court Jurisdiction, Ahmedabad, India</p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] text-[10px]">Direct Email:</p>
              <p className="text-[var(--color-accent)] underline">grievance@campusvoice.in</p>
            </div>
          </div>
        </div>

        {/* SLA & Resolution Timeline */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
          <div className="flex items-center gap-2.5 text-[var(--color-text-primary)] font-serif font-semibold">
            <Clock className="w-4 h-4 text-[var(--color-accent)]" />
            <h3>Stated Resolution SLA Timeline</h3>
          </div>

          <div className="space-y-3 text-xs text-[var(--color-text-primary)]">
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-verified)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] font-mono">Acknowledgment SLA:</strong>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5">Complaints acknowledged within 24 hours of receipt.</p>
              </div>
            </div>

            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] font-mono">Resolution SLA:</strong>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5">Final decision & action executed within 15 days as mandated by IT Rules 2021.</p>
              </div>
            </div>

            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-text-primary)] font-mono">Emergency Takedown (24h):</strong>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5 font-mono">Non-consensual personal imagery or identity leaks removed within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grievance Complaint Submission Form */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
        <div className="flex items-center gap-2 font-serif font-semibold text-base text-[var(--color-text-primary)]">
          <FileText className="w-4 h-4 text-[var(--color-accent)]" />
          <h2>Submit Official Grievance Notice</h2>
        </div>

        <form className="space-y-4 text-xs" onSubmit={(e) => { e.preventDefault(); alert('Grievance submission logged. The Grievance Officer will issue a reference ticket to your email within 24 hours.'); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--color-text-primary)] font-medium mb-1">Complainant Full Legal Name</label>
              <input
                type="text"
                required
                placeholder="Ramesh Patel"
                className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-[var(--color-text-primary)] font-medium mb-1">Contact Email Address</label>
              <input
                type="email"
                required
                placeholder="complainant@gmail.com"
                className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-1">Target Content URL / Post ID</label>
            <input
              type="text"
              required
              placeholder="/colleges/nirma-university or Post ID"
              className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-1">Detailed Description of Infringement / Violation</label>
            <textarea
              rows={4}
              required
              placeholder="State exact details of defamation, identity leak, copyright claim, or IT Rule violation..."
              className="w-full p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] font-medium text-white text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>Submit Grievance Complaint to Officer</span>
          </button>
        </form>
      </div>
    </div>
  );
}
