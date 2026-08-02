'use client';

import { useState } from 'react';
import { createConnectRequestAction } from '@/lib/actions/connect';
import { X, Send, AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConnectRequestModal({
  postId,
  postTitle,
  isOpen,
  onClose,
}: {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createConnectRequestAction(postId, message);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Connect request sent successfully! The author has been notified.');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || 'Failed to send connect request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background-secondary border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-base font-serif font-semibold text-text-primary">Express Interest / Join Team</h2>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Send a short intro to the anonymous post author. If they accept, a private auto-expiring 1-to-1 thread will open.
        </p>

        <div className="p-3 rounded-lg bg-background border border-border text-xs text-text-primary italic line-clamp-2">
          &ldquo;{postTitle}&rdquo;
        </div>

        {successMsg ? (
          <div className="p-3 rounded-md bg-verified/10 border border-verified/30 text-verified text-xs font-medium text-center">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1">
                Optional Intro Message (skills, experience, etc.)
              </label>
              <textarea
                rows={4}
                placeholder="Hi! I am interested in joining your team. I have experience with React and UI design..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
                className="w-full p-3 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent resize-none"
              />
              <span className="text-[10px] font-mono text-text-secondary text-right block mt-1">
                {message.length}/300
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md bg-background border border-border text-xs text-text-secondary hover:text-text-primary font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Interest</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
