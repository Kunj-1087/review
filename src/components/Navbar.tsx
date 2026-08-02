'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SessionData } from '@/lib/types';
import AuthModal from './AuthModal';
import ManualVerificationModal from './ManualVerificationModal';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { ShieldCheck, UserCheck, LogOut, Lock, Building2, MessageSquareText, ShieldAlert, Sparkles, Menu, X, Award } from 'lucide-react';
import { logoutAction } from '@/lib/actions/identity';
import { useRouter } from 'next/navigation';

export default function Navbar({ session }: { session: SessionData | null }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isManualVerifyOpen, setIsManualVerifyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] text-[var(--text-primary)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-all">
              CV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight font-heading text-gradient-purple">CampusVoice</span>
                <span className="badge-tag font-mono">
                  Gujarat Registry
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">Verified Student Report Cards</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--text-secondary)]">
            <Link href="/colleges" className="hover:text-[var(--accent-secondary)] transition-colors flex items-center gap-1.5 py-1">
              <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>College Directory</span>
            </Link>
            <Link href="/feed" className="hover:text-[var(--accent-secondary)] transition-colors flex items-center gap-1.5 py-1">
              <MessageSquareText className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Campus Feed</span>
            </Link>
            <Link href="/colleges/leaderboard" className="hover:text-[var(--accent-secondary)] transition-colors flex items-center gap-1.5 py-1">
              <Award className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Leaderboards</span>
            </Link>
            <Link href="/grievance" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 py-1">
              <ShieldAlert className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Grievances</span>
            </Link>
            {session?.role === 'ADMIN' && (
              <Link href="/admin" className="px-2.5 py-1 rounded-md bg-[var(--accent-soft)] border border-[var(--border-primary)] text-[var(--accent-secondary)] hover:border-[var(--border-active)] font-mono text-[11px] flex items-center gap-1 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                <span>Admin Audit</span>
              </Link>
            )}
          </nav>

          {/* User Auth & Theme Toggle Section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session && <NotificationBell />}

            {session ? (
              <div className="flex items-center gap-3">
                {/* Verification Stamp Badge */}
                {session.verificationStatus === 'DOMAIN_VERIFIED' || session.verificationStatus === 'MANUALLY_VERIFIED' ? (
                  <div className="hidden sm:inline-flex verification-stamp" title="Identity verified. Public posts remain anonymous under pseudonymous handle.">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
                    <span>Verified Student</span>
                  </div>
                ) : session.verificationStatus === 'PENDING' ? (
                  <div className="hidden sm:inline-flex threshold-lock-stamp">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--error)] animate-pulse" />
                    <span>ID Verification Pending</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsManualVerifyOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-active)] text-xs font-medium transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>Verify Student ID</span>
                  </button>
                )}

                {/* Handle Chip */}
                <div className="px-3 py-1.5 rounded-md bg-[var(--surface-primary)] border border-[var(--border-primary)] text-xs flex items-center gap-2 font-mono text-[var(--text-primary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                  <span className="font-medium">{session.publicHandle}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-md bg-[var(--surface-primary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white font-medium text-xs shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(192,132,252,0.5)] transition-all flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Student Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-primary)] bg-[var(--background-secondary)] p-4 space-y-3 font-medium text-xs text-[var(--text-primary)]">
            <Link href="/colleges" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--surface-primary)]">
              <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>College Directory</span>
            </Link>
            <Link href="/feed" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--surface-primary)]">
              <MessageSquareText className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Campus Feed</span>
            </Link>
            <Link href="/colleges/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--surface-primary)]">
              <Award className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Leaderboards</span>
            </Link>
            <Link href="/grievance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--surface-primary)]">
              <ShieldAlert className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>IT Rules Grievances</span>
            </Link>
            {session?.role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md bg-[var(--accent-soft)] text-[var(--accent-secondary)]">
                <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
                <span>Admin Audit Portal</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {isAuthOpen && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      {isManualVerifyOpen && (
        <ManualVerificationModal isOpen={isManualVerifyOpen} onClose={() => setIsManualVerifyOpen(false)} />
      )}
    </>
  );
}
