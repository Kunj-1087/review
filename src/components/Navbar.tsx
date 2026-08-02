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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border text-text-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-md bg-accent text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm group-hover:bg-accent-hover transition-colors">
              CV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight font-serif text-text-primary">CampusVoice</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-verified/10 text-verified border border-verified/30">
                  Gujarat Registry
                </span>
              </div>
              <p className="text-[11px] text-text-secondary font-medium">Verified Student Report Cards</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-text-secondary">
            <Link href="/colleges" className="hover:text-accent transition-colors flex items-center gap-1.5 py-1">
              <Building2 className="w-4 h-4 text-accent" />
              <span>College Directory</span>
            </Link>
            <Link href="/feed" className="hover:text-accent transition-colors flex items-center gap-1.5 py-1">
              <MessageSquareText className="w-4 h-4 text-accent" />
              <span>Campus Feed</span>
            </Link>
            <Link href="/colleges/leaderboard" className="hover:text-accent transition-colors flex items-center gap-1.5 py-1">
              <Award className="w-4 h-4 text-accent" />
              <span>Leaderboards</span>
            </Link>
            <Link href="/grievance" className="hover:text-text-primary transition-colors flex items-center gap-1.5 py-1">
              <ShieldAlert className="w-4 h-4 text-text-secondary" />
              <span>Grievances</span>
            </Link>
            {session?.role === 'ADMIN' && (
              <Link href="/admin" className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 font-mono text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
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
                    <ShieldCheck className="w-3.5 h-3.5 text-verified" />
                    <span>Verified Student</span>
                  </div>
                ) : session.verificationStatus === 'PENDING' ? (
                  <div className="hidden sm:inline-flex threshold-lock-stamp">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                    <span>ID Verification Pending</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsManualVerifyOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background-secondary border border-border text-text-primary hover:border-accent text-xs font-medium transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-accent" />
                    <span>Verify Student ID</span>
                  </button>
                )}

                {/* Handle Chip */}
                <div className="px-3 py-1.5 rounded-md bg-background-secondary border border-border text-xs flex items-center gap-2 font-mono text-text-primary">
                  <span className="w-2 h-2 rounded-full bg-verified" />
                  <span className="font-medium">{session.publicHandle}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-md bg-background-secondary hover:bg-border border border-border text-text-secondary hover:text-warning transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-xs shadow-sm transition-all flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Student Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md bg-background-secondary border border-border text-text-primary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-3 font-medium text-xs text-text-primary">
            <Link href="/colleges" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-background-secondary">
              <Building2 className="w-4 h-4 text-accent" />
              <span>College Directory</span>
            </Link>
            <Link href="/feed" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-background-secondary">
              <MessageSquareText className="w-4 h-4 text-accent" />
              <span>Campus Feed</span>
            </Link>
            <Link href="/colleges/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-background-secondary">
              <Award className="w-4 h-4 text-accent" />
              <span>Leaderboards</span>
            </Link>
            <Link href="/grievance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-background-secondary">
              <ShieldAlert className="w-4 h-4 text-text-secondary" />
              <span>IT Rules Grievances</span>
            </Link>
            {session?.role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-md bg-accent/10 text-accent">
                <Sparkles className="w-4 h-4 text-accent" />
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
