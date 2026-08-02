'use client';

import { useState, useEffect } from 'react';
import { getPostConnectRequestsAction, respondConnectRequestAction } from '@/lib/actions/connect';
import { Users, Check, X, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PostRequestsPanel({
  postId,
  isOpen,
  onClose,
}: {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await getPostConnectRequestsAction(postId);
    setRequests(res.requests || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setActionLoading(requestId);
    await respondConnectRequestAction(requestId, status);
    setActionLoading(null);
    fetchRequests();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background-secondary border border-border rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col relative">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-base font-serif font-semibold text-text-primary">Incoming Teammate Requests</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-text-secondary">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-background rounded-lg border border-border">
              <Users className="w-8 h-8 text-text-secondary mx-auto" />
              <p className="text-xs font-serif text-text-primary">No requests received yet</p>
              <p className="text-[11px] text-text-secondary">Interested students will appear here when they express interest in your post.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg bg-background border border-border space-y-3 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-xs text-text-primary flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-verified" />
                      <span>{req.requesterProfile.publicHandle}</span>
                    </span>

                    {req.requesterProfile.batchYear && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background-secondary border border-border text-text-secondary">
                        Batch {req.requesterProfile.batchYear}
                      </span>
                    )}

                    {req.requesterProfile.college?.name && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background-secondary border border-border text-accent">
                        {req.requesterProfile.college.name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${
                      req.status === 'ACCEPTED'
                        ? 'bg-verified/10 border-verified text-verified'
                        : req.status === 'DECLINED'
                        ? 'bg-warning/10 border-warning text-warning'
                        : 'bg-background-secondary border-border text-text-secondary'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.message && (
                  <p className="text-xs text-text-primary leading-relaxed bg-background-secondary p-3 rounded-md border border-border/80">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary pt-1">
                  <span>Received {new Date(req.createdAt).toLocaleDateString()}</span>

                  {req.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'DECLINED')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1 rounded bg-background-secondary border border-border hover:border-warning text-text-secondary hover:text-warning text-xs font-mono transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'ACCEPTED')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1 rounded bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept & Open Thread</span>
                      </button>
                    </div>
                  ) : req.status === 'ACCEPTED' && req.thread ? (
                    <Link
                      href={`/connect/threads/${req.thread.id}`}
                      className="px-3 py-1 rounded bg-accent text-white text-xs font-mono font-medium hover:bg-accent-hover transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Go to Active Thread</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
