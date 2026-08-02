'use client';

import { useState } from 'react';
import { sendConnectMessageAction, reportConnectThreadAction, blockConnectUserAction } from '@/lib/actions/connect';
import { Send, Clock, ShieldCheck, Flag, Ban, AlertCircle, Building2, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConnectThreadClient({
  threadData,
}: {
  threadData: {
    thread: {
      id: string;
      expiresAt: Date;
      status: string;
      createdAt: Date;
      post: {
        id: string;
        body: string;
        postType: string;
        eventType?: string | null;
        college?: { name: string; slug: string } | null;
      };
      otherProfile: {
        id?: string;
        publicHandle: string;
        batchYear?: number | null;
      };
      messages: any[];
    };
    currentProfileId: string;
  };
}) {
  const { thread, currentProfileId } = threadData;
  const [messages, setMessages] = useState<any[]>(thread.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const router = useRouter();

  const isExpired = thread.status !== 'ACTIVE' || new Date(thread.expiresAt).getTime() < Date.now();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isExpired) return;

    setLoading(true);
    setError(null);

    const res = await sendConnectMessageAction(thread.id, newMessage);
    setLoading(false);

    if (res.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: res.messageId || Math.random().toString(),
          senderProfileId: currentProfileId,
          body: newMessage.trim(),
          createdAt: new Date(),
        },
      ]);
      setNewMessage('');
    } else {
      setError(res.error || 'Failed to send message.');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    const res = await reportConnectThreadAction(thread.id, reportReason);
    if (res.success) {
      setReportSuccess(true);
      setTimeout(() => setShowReport(false), 1500);
    }
  };

  const handleBlock = async () => {
    if (!thread.otherProfile.id) return;
    if (confirm(`Block ${thread.otherProfile.publicHandle}? They will no longer be able to send connect requests to your posts.`)) {
      const res = await blockConnectUserAction(thread.otherProfile.id);
      if (res.success) {
        setBlockSuccess(true);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/feed"
          className="px-3 py-1.5 rounded-md bg-background-secondary border border-border text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 font-mono transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        {/* Safety Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className="px-3 py-1.5 rounded-md bg-background-secondary border border-border hover:border-warning/50 text-text-secondary hover:text-warning text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
          <button
            type="button"
            onClick={handleBlock}
            className="px-3 py-1.5 rounded-md bg-background-secondary border border-border hover:border-warning text-text-secondary hover:text-warning text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block</span>
          </button>
        </div>
      </div>

      {blockSuccess && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-mono">
          User {thread.otherProfile.publicHandle} has been blocked from sending connect requests to your posts.
        </div>
      )}

      {showReport && (
        <div className="p-4 rounded-lg bg-background-secondary border border-border space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-mono font-semibold text-text-primary">Report Thread to Moderation Queue</h4>
          {reportSuccess ? (
            <p className="text-xs text-verified font-mono">Report submitted. Thank you for maintaining community safety.</p>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Reason for reporting (e.g. harassment, off-topic, spam)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="px-3 py-1 rounded bg-background border border-border text-xs text-text-secondary font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="px-3 py-1 rounded bg-warning text-white text-xs font-mono font-medium"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-background-secondary border border-border rounded-xl shadow-md overflow-hidden flex flex-col min-h-[500px]">
        {/* Banner with Post Context & Auto-Expiry Countdown */}
        <div className="p-4 bg-background border-b border-border space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-xs text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-verified" />
                <span>{thread.otherProfile.publicHandle}</span>
              </span>
              {thread.otherProfile.batchYear && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background-secondary border border-border text-text-secondary">
                  Batch {thread.otherProfile.batchYear}
                </span>
              )}
            </div>

            {/* Expiry Banner */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isExpired
                  ? 'Thread Expired'
                  : `Auto-expires: ${new Date(thread.expiresAt).toLocaleDateString()}`}
              </span>
            </div>
          </div>

          <div className="text-xs text-text-secondary bg-background-secondary p-2.5 rounded-md border border-border/80 flex items-center justify-between">
            <span className="line-clamp-1 italic">&ldquo;{thread.post.body}&rdquo;</span>
            {thread.post.college && (
              <span className="text-[10px] font-mono text-accent shrink-0 ml-2">
                {thread.post.college.name}
              </span>
            )}
          </div>
        </div>

        {/* Behavioral Privacy Notice */}
        <div className="px-4 py-2 bg-background-secondary/80 border-b border-border/60 text-[10px] font-mono text-text-secondary flex items-center justify-center gap-2">
          <Lock className="w-3 h-3 text-accent" />
          <span>Anonymous 1-to-1 Thread • No read receipts or status indicators • Auto-expires</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-background/50">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-text-secondary">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderProfileId === currentProfileId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-xl text-xs space-y-1 ${
                      isMine
                        ? 'bg-accent text-white rounded-br-none shadow-sm'
                        : 'bg-background-secondary border border-border text-text-primary rounded-bl-none shadow-sm'
                    }`}
                  >
                    {!isMine && (
                      <span className="block text-[10px] font-mono font-semibold text-accent mb-0.5">
                        {thread.otherProfile.publicHandle}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-line">{m.body}</p>
                    <span
                      className={`block text-[9px] font-mono text-right mt-1 ${
                        isMine ? 'text-white/80' : 'text-text-secondary'
                      }`}
                      suppressHydrationWarning
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Input Form */}
        <div className="p-4 bg-background border-t border-border">
          {isExpired ? (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-mono text-center">
              This thread has expired. Content is archived and messaging is closed.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-2.5 p-2 rounded bg-warning/10 text-warning text-[11px] flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
