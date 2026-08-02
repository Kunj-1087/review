import type { Metadata } from 'next';
import { Outfit, Inter, Caveat, Gloria_Hallelujah } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { ThemeProvider } from '@/components/ThemeProvider';

const outfitFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-heading' });
const interFont = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sans' });
const caveatFont = Caveat({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-handwritten' });
const gloriaFont = Gloria_Hallelujah({ subsets: ['latin'], weight: ['400'], variable: '--font-title' });

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
    <html 
      lang="en" 
      className={`dark ${outfitFont.variable} ${interFont.variable} ${caveatFont.variable} ${gloriaFont.variable}`} 
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-init-script"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--background-primary)] text-[var(--text-primary)] font-sans antialiased min-h-screen flex flex-col selection:bg-[var(--accent-primary)] selection:text-white" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar session={session} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="border-t border-[var(--border-primary)] bg-[var(--background-secondary)]/80 backdrop-blur-md py-10 text-xs text-[var(--text-secondary)] mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 font-heading font-semibold text-[var(--text-primary)] text-sm">
                  <span className="text-gradient-purple">CampusVoice Gujarat</span>
                  <span className="badge-tag font-mono">
                    Verified Audit Layer
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-xs max-w-xl leading-relaxed">
                  Identity and public content are structurally separated. Student emails are verified for authenticity but never joined or exposed alongside reviews.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 font-medium">
                <Link href="/colleges" className="hover:text-[var(--accent-secondary)] transition-colors">College Directory</Link>
                <Link href="/feed" className="hover:text-[var(--accent-secondary)] transition-colors">Campus Feed</Link>
                <Link href="/grievance" className="hover:text-[var(--accent-secondary)] transition-colors text-[var(--text-muted)]">IT Rules Grievances</Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

