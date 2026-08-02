import { getAdminDashboardDataAction } from '@/lib/actions/admin';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { Sparkles } from 'lucide-react';

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const data = await getAdminDashboardDataAction();

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
              Admin Portal
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">CampusVoice Backoffice</h1>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Manage institution email domains, process student ID card verification requests, moderate reported content, and view platform metrics.
        </p>
      </div>

      <AdminDashboardClient initialData={data} />
    </div>
  );
}
