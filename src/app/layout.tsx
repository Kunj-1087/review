import type { Metadata } from 'next';
import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';

const serifFont = Source_Serif_4({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-serif' });
const sansFont = Inter({ subsets: ['latin'], variable: '--font-sans' });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'CampusVoice Gujarat — Verified Student College Ratings & Scorecards',
  description: 'Trustworthy, verified student ratings & scorecards for Gujarat higher ed institutions. Minimum 5-review threshold enforced before ratings go public.',
  keywords: ['Gujarat Colleges', 'Nirma University Review', 'DAIICT Review', 'GTU Colleges', 'GNLU', 'MICA', 'Gujarat Student Reviews'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-init-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('cv_theme');
                  var theme = saved || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans antialiased min-h-screen flex flex-col selection:bg-[var(--color-accent)]/20 selection:text-[var(--color-accent)]" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar session={session} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-10 text-xs text-[var(--color-text-secondary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 font-serif font-semibold text-[var(--color-text-primary)] text-sm">
                  <span>CampusVoice Gujarat</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-verified)]/10 text-[var(--color-verified)] border border-[var(--color-verified)]/30">
                    Verified Audit Layer
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)] text-xs max-w-xl">
                  Identity and public content are structurally separated. Student emails are verified for authenticity but never joined or exposed alongside reviews.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 font-medium">
                <Link href="/colleges" className="hover:text-[var(--color-accent)] transition-colors">College Directory</Link>
                <Link href="/feed" className="hover:text-[var(--color-accent)] transition-colors">Campus Feed</Link>
                <Link href="/grievance" className="hover:text-[var(--color-accent)] transition-colors text-[var(--color-text-secondary)]">IT Rules Grievances</Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
