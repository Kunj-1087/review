import { getAllPostsAction, getCollegesAction } from '@/lib/actions/content';
import { getSession } from '@/lib/auth';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import EventFeedFilter from '@/components/EventFeedFilter';
import { PostWithRelations } from '@/lib/types';
import { MessageSquareText, Flame, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function CampusFeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    collegeId?: string;
    postType?: string;
    eventType?: string;
    visibilityScope?: string;
    skillsNeeded?: string;
    sortBy?: 'eventDate' | 'recency';
  }>;
}) {
  const params = await searchParams;
  const { posts, votes, comments } = await getAllPostsAction({
    collegeId: params.collegeId,
    postType: params.postType,
    eventType: params.eventType,
    visibilityScope: params.visibilityScope,
    skillsNeeded: params.skillsNeeded,
    sortBy: params.sortBy || 'recency',
  });
  const colleges = await getCollegesAction();
  const session = await getSession();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-text-primary flex items-center gap-2.5">
            <MessageSquareText className="w-6 h-6 text-accent" />
            <span>Gujarat Campus Feed & Connect</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Discover hackathons, fests, workshops, and connect with teammates across Gujarat institutions.
          </p>
        </div>
      </div>

      {/* Post Creation Form */}
      <div className="bg-background-secondary border border-border rounded-lg p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
        <h3 className="text-sm font-serif font-semibold text-text-primary flex items-center gap-2">
          <Flame className="w-4 h-4 text-accent" />
          <span>Post to Campus Stream / Campus Connect</span>
        </h3>
        <CreatePostForm collegeId={colleges[0]?.id || ''} session={session} />
      </div>

      {/* Events & Teammates Advanced Discovery Filter Bar */}
      <EventFeedFilter colleges={colleges.map((c) => ({ id: c.id, name: c.name }))} />

      {/* Posts Stream */}
      {posts.length === 0 ? (
        <div className="p-10 text-center bg-background-secondary border border-border rounded-lg space-y-3">
          <MessageSquareText className="w-10 h-10 text-text-secondary mx-auto" />
          <h3 className="text-base font-serif font-semibold text-text-primary">No Posts Match Your Filters</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search criteria or be the first verified student to publish an event or teammate request!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {(posts as PostWithRelations[]).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              votes={votes}
              comments={comments}
              currentAnonymousProfileId={session?.anonymousProfileId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
