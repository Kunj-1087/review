'use client';

import { useState } from 'react';
import {
  reviewVerificationRequestAction,
  resolveReportAction,
  createCollegeAction,
  updateCollegeDomainsAction,
  resolveAnomalyFlagAction,
} from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Flag,
  Building2,
  BarChart3,
  CheckCircle2,
  XCircle,
  FileImage,
  Plus,
  AlertTriangle,
  ShieldCheck,
  CheckCheck,
  X,
  TrendingUp,
} from 'lucide-react';

export interface AdminVerificationRequest {
  id: string;
  userId: string;
  collegeId: string;
  collegeName?: string;
  idCardUrl: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
  user: { email: string; verificationStatus?: string };
}

export interface AdminReport {
  id: string;
  anonymousProfile: { publicHandle: string };
  targetType: string;
  targetId: string;
  reason: string;
  contentPreview?: string;
  status: string;
  isHidden?: boolean;
}

export interface AdminAnomalyFlag {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeSlug: string;
  reason: string;
  status: string;
  createdAt: Date | string;
}

export interface AdminCollege {
  id: string;
  name: string;
  slug: string;
  city: string;
  establishedYear?: number | null;
  officialDomains: string | string[];
  domainConfidence?: string;
  typeDetail?: string | null;
  formerNames?: string | null | string[];
  sourceNotes?: string | null;
}

export interface AdminDashboardData {
  verificationRequests: AdminVerificationRequest[];
  reports: AdminReport[];
  anomalyFlags: AdminAnomalyFlag[];
  colleges: AdminCollege[];
  analytics: {
    totalColleges: number;
    totalReviews: number;
    totalPosts: number;
    totalUsers: number;
    verifiedUsers: number;
    collegesAboveThreshold: number;
    collegesBelowThreshold: number;
    activityOverTime: { date: string; reviewCount: number; postCount: number }[];
    collegeReviewDistribution: { name: string; reviewCount: number }[];
    connectAbuseMetrics?: {
      totalConnectRequests: number;
      acceptedRequests: number;
      declinedRequests: number;
      declineRate: number;
      connectThreadReports: number;
      totalConnectBlocks: number;
    };
  };
}

type ActiveTab = 'VERIFICATIONS' | 'MODERATION' | 'ANOMALY_FLAGS' | 'COLLEGES' | 'ANALYTICS';

// Pure-CSS bar chart for activity over time
function ActivityBarChart({
  data,
}: {
  data: { date: string; reviewCount: number; postCount: number }[];
}) {
  const max = Math.max(...data.map((d) => d.reviewCount + d.postCount), 1);
  // Show last 14 days for readability
  const visible = data.slice(-14);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px] h-24 px-1">
        {visible.map((d) => {
          const total = d.reviewCount + d.postCount;
          const totalPct = Math.round((total / max) * 100);
          const reviewPct = total > 0 ? Math.round((d.reviewCount / total) * 100) : 0;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end gap-0 group relative"
              title={`${d.date}: ${d.reviewCount} reviews, ${d.postCount} posts`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {d.reviewCount}R {d.postCount}P
              </div>
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${totalPct}%`, minHeight: total > 0 ? '4px' : '0' }}
              >
                {/* Review portion */}
                <div
                  className="w-full bg-[var(--color-accent)] rounded-t-sm"
                  style={{ height: `${reviewPct}%`, minHeight: d.reviewCount > 0 ? '2px' : '0' }}
                />
                {/* Post portion */}
                <div
                  className="w-full bg-[var(--color-verified)]"
                  style={{ height: `${100 - reviewPct}%`, minHeight: d.postCount > 0 ? '2px' : '0' }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-secondary)]">
        <span suppressHydrationWarning>{visible[0]?.date.slice(5)}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--color-accent)] inline-block" />Reviews
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--color-verified)] inline-block" />Posts
          </span>
        </div>
        <span suppressHydrationWarning>{visible[visible.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ initialData }: { initialData: AdminDashboardData }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('VERIFICATIONS');
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [newDomainInput, setNewDomainInput] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);

  // New college form state
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeSlug, setNewCollegeSlug] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('Ahmedabad');
  const [newCollegeAffiliation, setNewCollegeAffiliation] = useState('Autonomous');
  const [newCollegeType, setNewCollegeType] = useState('PRIVATE');
  const [newCollegeEstYear, setNewCollegeEstYear] = useState(2010);
  const [newCollegeDomains, setNewCollegeDomains] = useState('');
  const [newCollegeStreams, setNewCollegeStreams] = useState('Engineering, Management');

  const router = useRouter();

  const handleReviewVerification = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const notes = notesInput[requestId] || '';
    if (status === 'REJECTED' && !confirm('Are you sure you want to reject this verification request?')) return;

    setLoadingAction(requestId);
    const res = await reviewVerificationRequestAction(requestId, status, notes);
    setLoadingAction(null);

    if (res.success) {
      router.refresh();
      setData((prev) => ({
        ...prev,
        verificationRequests: prev.verificationRequests.map((r) =>
          r.id === requestId ? { ...r, status, notes } : r
        ),
      }));
    } else {
      alert(res.error || 'Action failed');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'HIDE_CONTENT' | 'RESTORE_CONTENT' | 'DISMISS') => {
    const notes = notesInput[reportId] || '';
    if (action === 'HIDE_CONTENT' && !confirm('Are you sure you want to hide this content from public view?')) return;

    setLoadingAction(reportId);
    const res = await resolveReportAction(reportId, action, notes);
    setLoadingAction(null);

    if (res.success) {
      router.refresh();
      setData((prev) => ({
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === reportId ? { ...r, status: action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED', isHidden: action === 'HIDE_CONTENT' } : r
        ),
      }));
    } else {
      alert(res.error || 'Action failed');
    }
  };

  const handleResolveAnomalyFlag = async (flagId: string, status: 'DISMISSED' | 'RESOLVED') => {
    if (!confirm(`Mark this anomaly flag as ${status.toLowerCase()}?`)) return;

    setLoadingAction(flagId);
    const res = await resolveAnomalyFlagAction(flagId, status);
    setLoadingAction(null);

    if (res.success) {
      setData((prev) => ({
        ...prev,
        anomalyFlags: prev.anomalyFlags.map((f) =>
          f.id === flagId ? { ...f, status } : f
        ),
      }));
      router.refresh();
    } else {
      alert(res.error || 'Action failed');
    }
  };

  const handleUpdateDomains = async (collegeId: string) => {
    const domainStr = newDomainInput[collegeId];
    if (!domainStr) return;
    const domains = domainStr.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);

    setLoadingAction(collegeId);
    const res = await updateCollegeDomainsAction(collegeId, domains);
    setLoadingAction(null);

    if (res.success) {
      alert('College domains updated successfully!');
      router.refresh();
    } else {
      alert(res.error || 'Failed to update domains');
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    const domains = newCollegeDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    const streams = newCollegeStreams.split(',').map((s) => s.trim()).filter(Boolean);

    setLoadingAction('CREATE_COLLEGE');
    const res = await createCollegeAction({
      name: newCollegeName,
      slug: newCollegeSlug,
      city: newCollegeCity,
      affiliation: newCollegeAffiliation,
      type: newCollegeType,
      establishedYear: Number(newCollegeEstYear),
      officialDomains: domains,
      streams,
    });
    setLoadingAction(null);

    if (res.success) {
      setShowAddCollegeModal(false);
      alert('New college added!');
      router.refresh();
    } else {
      alert(res.error || 'Failed to create college');
    }
  };

  const pendingRequestsCount = data.verificationRequests.filter((r) => r.status === 'PENDING').length;
  const pendingReportsCount = data.reports.filter((r) => r.status === 'PENDING').length;
  const pendingAnomalyCount = data.anomalyFlags.filter((f) => f.status === 'PENDING').length;

  const tabBtn = (tab: ActiveTab, label: string, icon: React.ReactNode, badge?: number, color = 'accent') => {
    const colorMap: Record<string, string> = {
      accent: 'bg-[var(--color-accent)]',
      warning: 'bg-[var(--color-warning)]',
      verified: 'bg-[var(--color-verified)]',
    };
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 rounded-md text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
          activeTab === tab
            ? `${colorMap[color]} text-white shadow-sm`
            : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]'
        }`}
      >
        {icon}
        <span>{label}</span>
        {badge && badge > 0 ? (
          <span className="px-2 py-0.5 rounded bg-[var(--color-bg-primary)] text-[var(--color-accent)] font-mono text-[10px]">
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        {tabBtn('VERIFICATIONS', 'ID Audit Queue', <UserCheck className="w-3.5 h-3.5" />, pendingRequestsCount)}
        {tabBtn('MODERATION', 'Moderation Queue', <Flag className="w-3.5 h-3.5" />, pendingReportsCount, 'warning')}
        {tabBtn('ANOMALY_FLAGS', 'Anomaly Flags', <AlertTriangle className="w-3.5 h-3.5" />, pendingAnomalyCount, 'warning')}
        {tabBtn('COLLEGES', 'Manage Institutions', <Building2 className="w-3.5 h-3.5" />, undefined, 'verified')}
        {tabBtn('ANALYTICS', 'Analytics Overview', <BarChart3 className="w-3.5 h-3.5" />)}
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[var(--color-text-primary)]">Student ID Verification Requests</h3>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">Total: {data.verificationRequests.length}</span>
          </div>

          {data.verificationRequests.length === 0 ? (
            <div className="p-8 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-xs">
              No pending verification requests in queue.
            </div>
          ) : (
            <div className="space-y-4">
              {data.verificationRequests.map((req) => (
                <div key={req.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                    <div>
                      <span className="font-mono text-xs text-[var(--color-text-secondary)]">User Account Email:</span>{' '}
                      <strong className="text-[var(--color-text-primary)] text-xs font-mono">{req.user?.email || 'N/A'}</strong>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Target Institution: <strong className="text-[var(--color-verified)]">{req.collegeName}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded ${
                        req.status === 'PENDING'
                          ? 'bg-[var(--color-bg-primary)] border border-[var(--color-warning)]/30 text-[var(--color-warning)]'
                          : req.status === 'APPROVED'
                          ? 'bg-[var(--color-bg-primary)] border border-[var(--color-verified)]/30 text-[var(--color-verified)]'
                          : 'bg-[var(--color-bg-primary)] border border-[var(--color-warning)]/30 text-[var(--color-warning)]'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <a
                      href={req.idCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md flex items-center gap-2 hover:border-[var(--color-accent)] transition-colors shrink-0 font-mono text-xs"
                    >
                      <FileImage className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="text-[var(--color-text-primary)] underline">View Uploaded Student ID Document</span>
                    </a>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Admin audit notes..."
                        value={notesInput[req.id] || ''}
                        onChange={(e) => setNotesInput({ ...notesInput, [req.id]: e.target.value })}
                        className="w-full px-3.5 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:outline-[var(--color-accent)]"
                      />
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleReviewVerification(req.id, 'APPROVED')}
                        disabled={loadingAction === req.id}
                        className="px-4 py-2 bg-[var(--color-verified)] hover:opacity-90 text-white font-medium text-xs rounded-md transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Verification</span>
                      </button>
                      <button
                        onClick={() => handleReviewVerification(req.id, 'REJECTED')}
                        disabled={loadingAction === req.id}
                        className="px-4 py-2 bg-[var(--color-warning)] hover:opacity-90 text-white font-medium text-xs rounded-md transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODERATION QUEUE */}
      {activeTab === 'MODERATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[var(--color-text-primary)]">Content Moderation Queue</h3>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">Total Reports: {data.reports.length}</span>
          </div>

          {data.reports.length === 0 ? (
            <div className="p-8 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-xs">
              No content reports submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {data.reports.map((rep) => (
                <div key={rep.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-xs">
                    <div>
                      <span className="text-[var(--color-text-secondary)] font-mono">Reporter:</span>{' '}
                      <span className="font-mono text-[var(--color-text-primary)] font-bold">{rep.anonymousProfile.publicHandle}</span>
                    </div>
                    <span className="text-[var(--color-warning)] font-mono font-bold">{rep.targetType} Report</span>
                  </div>

                  <div className="bg-[var(--color-bg-primary)] p-4 rounded-md border border-[var(--color-border)] space-y-2 text-xs">
                    <p className="text-[var(--color-text-secondary)]">
                      Reason: <strong className="text-[var(--color-warning)]">{rep.reason}</strong>
                    </p>
                    <p className="text-[var(--color-text-primary)] italic">Target Content Snippet: &quot;{rep.contentPreview}&quot;</p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-mono text-xs ${rep.isHidden ? 'text-[var(--color-warning)]' : 'text-[var(--color-verified)]'}`}>
                      Visibility Status: {rep.isHidden ? 'Auto-Hidden (3+ Reports)' : 'Visible'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!rep.isHidden && (
                        <button
                          onClick={() => handleResolveReport(rep.id, 'HIDE_CONTENT')}
                          className="px-3 py-1.5 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-[var(--color-warning)] hover:text-white font-medium text-xs rounded-md transition-all font-mono"
                        >
                          Hide Content
                        </button>
                      )}
                      {rep.isHidden && (
                        <button
                          onClick={() => handleResolveReport(rep.id, 'RESTORE_CONTENT')}
                          className="px-3 py-1.5 bg-[var(--color-verified)]/10 border border-[var(--color-verified)]/30 text-[var(--color-verified)] hover:bg-[var(--color-verified)] hover:text-white font-medium text-xs rounded-md transition-all font-mono"
                        >
                          Restore Content
                        </button>
                      )}
                      <button
                        onClick={() => handleResolveReport(rep.id, 'DISMISS')}
                        className="px-3 py-1.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-xs rounded-md border border-[var(--color-border)] transition-all"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANOMALY FLAGS */}
      {activeTab === 'ANOMALY_FLAGS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-semibold text-[var(--color-text-primary)]">Anti-Gaming Anomaly Flag Queue</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Colleges automatically flagged for coordinated brigading patterns (burst reviews from new accounts).
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
              {pendingAnomalyCount} Pending
            </span>
          </div>

          {data.anomalyFlags.length === 0 ? (
            <div className="p-8 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg space-y-2">
              <ShieldCheck className="w-8 h-8 text-[var(--color-verified)] mx-auto" />
              <p className="text-sm font-serif font-semibold text-[var(--color-text-primary)]">No anomaly flags raised</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                The automated burst detection system has not flagged any suspicious review patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.anomalyFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`bg-[var(--color-bg-secondary)] border rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)] ${
                    flag.status === 'PENDING'
                      ? 'border-[var(--color-warning)]/40'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${flag.status === 'PENDING' ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-secondary)]'}`} />
                        <h4 className="font-serif font-semibold text-sm text-[var(--color-text-primary)]">
                          {flag.collegeName}
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-mono pl-6">
                        {flag.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded border ${
                        flag.status === 'PENDING'
                          ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-warning)]'
                          : flag.status === 'RESOLVED'
                          ? 'bg-[var(--color-verified)]/10 border-[var(--color-verified)]/30 text-[var(--color-verified)]'
                          : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}>
                        {flag.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-[var(--color-border)] pt-3">
                    <span className="font-mono text-[var(--color-text-secondary)]" suppressHydrationWarning>
                      Flagged: {new Date(flag.createdAt).toLocaleDateString()}
                    </span>

                    {flag.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveAnomalyFlag(flag.id, 'RESOLVED')}
                          disabled={loadingAction === flag.id}
                          className="px-3 py-1.5 bg-[var(--color-verified)]/10 border border-[var(--color-verified)]/30 text-[var(--color-verified)] hover:bg-[var(--color-verified)] hover:text-white font-medium text-xs rounded-md transition-all font-mono flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                        <button
                          onClick={() => handleResolveAnomalyFlag(flag.id, 'DISMISSED')}
                          disabled={loadingAction === flag.id}
                          className="px-3 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-mono text-xs rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE COLLEGES */}
      {activeTab === 'COLLEGES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[var(--color-text-primary)]">Gujarat Colleges & Official Email Domains</h3>
            <button
              onClick={() => setShowAddCollegeModal(true)}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-xs rounded-md shadow-sm flex items-center gap-1.5 transition-all font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Institution</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.colleges.map((col) => (
              <div key={col.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)] text-sm font-serif">{col.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">{col.city} • Est. {col.establishedYear}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)]">{col.slug}</span>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] font-semibold mb-1 font-mono">Official Email Domains (Comma separated):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={
                        Array.isArray(col.officialDomains)
                          ? col.officialDomains.join(', ')
                          : typeof col.officialDomains === 'string'
                            ? (col.officialDomains.startsWith('[')
                              ? JSON.parse(col.officialDomains).join(', ')
                              : col.officialDomains)
                            : ''
                      }
                      onChange={(e) => setNewDomainInput({ ...newDomainInput, [col.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs text-[var(--color-verified)] font-mono focus:outline-none focus:outline-[var(--color-accent)]"
                    />
                    <button
                      onClick={() => handleUpdateDomains(col.id)}
                      disabled={loadingAction === col.id}
                      className="px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-xs rounded-md transition-all disabled:opacity-50 font-mono"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS OVERVIEW */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8">
          <h3 className="text-base font-serif font-semibold text-[var(--color-text-primary)]">Platform Analytics Overview</h3>

          {/* Campus Connect Abuse & Safety Metrics */}
          {data.analytics.connectAbuseMetrics && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
                <h4 className="text-sm font-serif font-semibold text-[var(--color-text-primary)]">Campus Connect Safety & Abuse Metrics</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Total Requests Sent</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-accent)]">{data.analytics.connectAbuseMetrics.totalConnectRequests}</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Accepted Requests</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-verified)]">{data.analytics.connectAbuseMetrics.acceptedRequests}</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Declined Requests</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-warning)]">{data.analytics.connectAbuseMetrics.declinedRequests}</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Global Decline Rate</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-warning)]">{data.analytics.connectAbuseMetrics.declineRate}%</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Thread Reports</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-warning)]">{data.analytics.connectAbuseMetrics.connectThreadReports}</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)]">
                  <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">Active Profile Blocks</p>
                  <p className="text-xl font-bold font-mono text-[var(--color-text-primary)]">{data.analytics.connectAbuseMetrics.totalConnectBlocks}</p>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Users', value: data.analytics.totalUsers, color: 'accent' },
              { label: 'Verified Students', value: data.analytics.verifiedUsers, color: 'verified' },
              { label: 'Submitted Reviews', value: data.analytics.totalReviews, color: 'accent' },
              { label: 'Campus Posts', value: data.analytics.totalPosts, color: 'text-primary' },
              { label: 'Colleges w/ ≥5 Reviews', value: data.analytics.collegesAboveThreshold, color: 'verified' },
              { label: 'Colleges < 5 Reviews', value: data.analytics.collegesBelowThreshold, color: 'warning' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4 space-y-1">
                <p className="text-[var(--color-text-secondary)] text-[11px] font-semibold leading-tight">{label}</p>
                <p className={`text-2xl font-bold font-mono text-[var(--color-${color})]`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Threshold Distribution Visual */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
              <h4 className="text-sm font-serif font-semibold text-[var(--color-text-primary)]">5-Review Threshold Distribution</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-[var(--color-text-secondary)] font-mono shrink-0">Threshold Unlocked</span>
                <div className="flex-1 h-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-verified)] rounded-full transition-all"
                    style={{
                      width: `${data.analytics.totalColleges > 0
                        ? Math.round((data.analytics.collegesAboveThreshold / data.analytics.totalColleges) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-mono font-bold text-[var(--color-verified)] shrink-0">
                  {data.analytics.collegesAboveThreshold}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-[var(--color-text-secondary)] font-mono shrink-0">Scorecard Locked</span>
                <div className="flex-1 h-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-warning)] rounded-full transition-all"
                    style={{
                      width: `${data.analytics.totalColleges > 0
                        ? Math.round((data.analytics.collegesBelowThreshold / data.analytics.totalColleges) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-mono font-bold text-[var(--color-warning)] shrink-0">
                  {data.analytics.collegesBelowThreshold}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Over Time Chart */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" />
              <h4 className="text-sm font-serif font-semibold text-[var(--color-text-primary)]">Activity — Last 30 Days</h4>
            </div>
            <ActivityBarChart data={data.analytics.activityOverTime} />
          </div>

          {/* Top Colleges by Review Count */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
              <h4 className="text-sm font-serif font-semibold text-[var(--color-text-primary)]">Review Distribution — Top 20 Colleges</h4>
            </div>
            <div className="space-y-2">
              {data.analytics.collegeReviewDistribution.map((col, i) => {
                const maxCount = data.analytics.collegeReviewDistribution[0]?.reviewCount || 1;
                const pct = Math.round((col.reviewCount / maxCount) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-4 text-[var(--color-text-secondary)] font-mono text-right shrink-0">{i + 1}</span>
                    <span className="w-40 truncate text-[var(--color-text-primary)] shrink-0" title={col.name}>{col.name}</span>
                    <div className="flex-1 h-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${col.reviewCount >= 5 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-warning)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-6 text-right font-mono font-bold shrink-0 ${col.reviewCount >= 5 ? 'text-[var(--color-accent)]' : 'text-[var(--color-warning)]'}`}>
                      {col.reviewCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add New College */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-6 space-y-4 shadow-xl text-[var(--color-text-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Add Gujarat Higher Ed Institution</h3>
              <button onClick={() => setShowAddCollegeModal(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-mono">✕</button>
            </div>

            <form onSubmit={handleCreateCollege} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--color-text-primary)] font-medium mb-1">College Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Pandit Deendayal Energy University"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-1 font-mono">Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="pdeu"
                    value={newCollegeSlug}
                    onChange={(e) => setNewCollegeSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Gandhinagar"
                    value={newCollegeCity}
                    onChange={(e) => setNewCollegeCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-1">Affiliation</label>
                  <input
                    type="text"
                    value={newCollegeAffiliation}
                    onChange={(e) => setNewCollegeAffiliation(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-1 font-mono">Type</label>
                  <select
                    value={newCollegeType}
                    onChange={(e) => setNewCollegeType(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)] font-mono"
                  >
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="GOVERNMENT">GOVERNMENT</option>
                    <option value="AUTONOMOUS">AUTONOMOUS</option>
                    <option value="DEEMED">DEEMED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-1 font-mono">Est. Year</label>
                  <input
                    type="number"
                    value={newCollegeEstYear}
                    onChange={(e) => setNewCollegeEstYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--color-text-primary)] font-medium mb-1">Streams (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="Engineering, Management"
                  value={newCollegeStreams}
                  onChange={(e) => setNewCollegeStreams(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--color-text-primary)] font-medium mb-1 font-mono">Official Email Domains (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="pdpu.ac.in, sot.pdpu.ac.in"
                  value={newCollegeDomains}
                  onChange={(e) => setNewCollegeDomains(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:outline-[var(--color-accent)] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAction === 'CREATE_COLLEGE'}
                className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] font-medium text-white text-xs rounded-md transition-all shadow-sm mt-2 font-mono disabled:opacity-50"
              >
                Create Institution Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
