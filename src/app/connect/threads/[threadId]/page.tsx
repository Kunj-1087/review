import { getConnectThreadAction } from '@/lib/actions/connect';
import ConnectThreadClient from '@/components/ConnectThreadClient';
import { notFound, redirect } from 'next/navigation';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default async function ConnectThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const threadData = await getConnectThreadAction(threadId);

  if ('error' in threadData) {
    if (threadData.error === 'Authentication required') {
      redirect('/feed');
    }
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-background-secondary border border-border rounded-xl text-center space-y-4 shadow-sm">
        <Lock className="w-10 h-10 text-accent mx-auto" />
        <h2 className="text-lg font-serif font-semibold text-text-primary">Access Restricted</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          {threadData.error || 'You do not have permission to access this connect thread.'}
        </p>
        <Link
          href="/feed"
          className="inline-block px-4 py-2 rounded-md bg-accent text-white text-xs font-mono font-medium hover:bg-accent-hover transition-colors"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return <ConnectThreadClient threadData={threadData} />;
}
