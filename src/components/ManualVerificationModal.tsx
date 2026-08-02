'use client';

import { useState, useEffect } from 'react';
import { submitManualVerificationAction } from '@/lib/actions/identity';
import { getCollegesAction } from '@/lib/actions/content';
import { useRouter } from 'next/navigation';
import { Upload, FileImage, ShieldCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ManualVerificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [colleges, setColleges] = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      getCollegesAction().then(res => {
        setColleges(res.map(c => ({ id: c.id, name: c.name, city: c.city })));
        if (res.length > 0) setSelectedCollegeId(res[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) {
      setError('Please select your college.');
      return;
    }
    if (!file) {
      setError('Please select or upload your student ID card image.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      const res = await submitManualVerificationAction(selectedCollegeId, uploadData.url);
      setUploading(false);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || 'Failed to submit verification request.');
      }
    } catch (err: unknown) {
      setUploading(false);
      const errorMsg = err instanceof Error ? err.message : 'File upload error.';
      setError(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-6 sm:p-8 shadow-xl text-[var(--color-text-primary)] animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold tracking-tight text-[var(--color-text-primary)]">Student ID Verification</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">Manual review for non-domain student emails</p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 bg-[var(--color-bg-secondary)] p-3.5 rounded-lg border border-[var(--color-border)]">
          Upload a clear photo of your college ID card or current semester fee receipt. Admin verification takes ~24h.<br />
          <span className="text-[var(--color-text-secondary)] text-[11px] block mt-1">ID documents are audited privately by admins and never made public.</span>
        </p>

        {success ? (
          <div className="p-6 text-center space-y-3 bg-[var(--color-verified)]/10 border border-[var(--color-verified)]/30 rounded-lg text-[var(--color-verified)]">
            <CheckCircle2 className="w-9 h-9 mx-auto text-[var(--color-verified)]" />
            <h4 className="font-semibold text-base text-[var(--color-verified)] font-serif">Verification Submitted</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Your student ID is now in the admin audit queue.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1.5">
                Select Your Gujarat Institution
              </label>
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1.5">
                Upload Student ID Card / Fee Receipt
              </label>
              <div className="relative border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg p-6 text-center bg-[var(--color-bg-secondary)] transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-9 h-9 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                    <FileImage className="w-4 h-4" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-accent)] font-mono">{file.name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[var(--color-text-primary)] font-medium">Click or drag student ID image here</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-mono">JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 px-4 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] font-medium text-white text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <span>Uploading Document...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
