'use client';

import { useState } from 'react';
import { voteAction, createCommentAction } from '@/lib/actions/content';
import ReportModal from './ReportModal';
import ConnectRequestModal from './ConnectRequestModal';
import PostRequestsPanel from './PostRequestsPanel';
import { ThumbsUp, ThumbsDown, MessageSquare, Flag, User, Building2, Calendar, Users, ExternalLink, Globe, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PostWithRelations, ContentVote, CommentWithProfile } from '@/lib/types';

export default function PostCard({
  post,
  votes,
  comments,
  currentAnonymousProfileId,
}: {
  post: PostWithRelations;
  votes: ContentVote[];
  comments: CommentWithProfile[];
  currentAnonymousProfileId?: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isRequestsPanelOpen, setIsRequestsPanelOpen] = useState(false);
  const router = useRouter();

  const isAuthor = currentAnonymousProfileId && post.anonymousProfileId === currentAnonymousProfileId;

  const postVotes = votes.filter((v) => v.targetType === 'POST' && v.targetId === post.id);
  const upvotes = postVotes.filter((v) => v.direction === 'UP').length;
  const downvotes = postVotes.filter((v) => v.direction === 'DOWN').length;
  const userVote = postVotes.find((v) => v.anonymousProfileId === currentAnonymousProfileId)?.direction;

  const postComments = comments.filter((c) => c.parentType === 'POST' && c.parentId === post.id);

  // All attached images (legacy single imageUrl or multi-images array)
  const images = post.images && post.images.length > 0
    ? post.images.map((img) => img.imageUrl)
    : post.imageUrl
    ? [post.imageUrl]
    : [];

  const handleVote = async (dir: 'UP' | 'DOWN') => {
    if (!currentAnonymousProfileId) {
      alert('Please log in to vote.');
      return;
    }
    await voteAction('POST', post.id, dir);
    router.refresh();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnonymousProfileId) {
      alert('Please log in to comment.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const res = await createCommentAction('POST', post.id, newComment);
    setSubmittingComment(false);

    if (res.success) {
      setNewComment('');
      router.refresh();
    } else {
      alert(res.error || 'Failed to post comment');
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 transition-all">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--accent-secondary)] shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-xs text-[var(--text-primary)]">{post.anonymousProfile.publicHandle}</span>
              {post.anonymousProfile.batchYear && (
                <span className="badge-tag font-mono">
                  Batch {post.anonymousProfile.batchYear}
                </span>
              )}

              {/* Type Badge */}
              {post.postType === 'EVENT' && (
                <span className="badge-tag font-mono font-semibold">
                  🎪 Event ({post.eventType})
                </span>
              )}
              {post.postType === 'TEAM_REQUEST' && (
                <span className="badge-tag font-mono font-semibold">
                  🤝 Team Request ({post.eventType})
                </span>
              )}
              {post.visibilityScope === 'OPEN_GUJARAT' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span>All Gujarat</span>
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5" suppressHydrationWarning>
              Campus Feed • {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {post.college && (
          <Link
            href={`/colleges/${post.college.slug}`}
            className="text-xs px-2.5 py-1 rounded-md bg-[var(--surface-primary)] border border-[var(--border-primary)] hover:border-[var(--border-active)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors font-mono shrink-0"
          >
            <Building2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="font-medium text-[11px]">{post.college.name}</span>
          </Link>
        )}
      </div>

      {/* Structured Details Cards (for Event / Team Request) */}
      {(post.postType === 'EVENT' || post.postType === 'TEAM_REQUEST') && (
        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-text-secondary font-mono text-[11px]">
            {post.eventDate && (
              <span className="flex items-center gap-1 text-text-primary font-medium">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>Event Date: {new Date(post.eventDate).toLocaleDateString()}</span>
              </span>
            )}

            {post.teamSizeNeeded && (
              <span className="flex items-center gap-1 text-text-primary font-medium">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span>Teammates Needed: {post.teamSizeNeeded}</span>
              </span>
            )}

            {post.externalLink && (
              <a
                href={post.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline ml-auto font-medium"
              >
                <span>Registration Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Roles Needed */}
          {post.rolesNeededParsed && post.rolesNeededParsed.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-text-secondary block">Roles Needed:</span>
              <div className="flex flex-wrap gap-1.5">
                {post.rolesNeededParsed.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills Needed */}
          {post.skillsNeededParsed && post.skillsNeededParsed.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-text-secondary block">Skills Preferred:</span>
              <div className="flex flex-wrap gap-1.5">
                {post.skillsNeededParsed.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-background-secondary border border-border text-text-primary font-mono text-[10px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Body */}
      <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line bg-background p-4 rounded-lg border border-border">
        {post.body}
      </p>

      {/* Multi-Image Gallery */}
      {images.length > 0 && (
        <div className={`grid gap-2 rounded-lg overflow-hidden border border-border bg-background p-2 ${
          images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
        }`}>
          {images.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-background-secondary">
              <Image
                src={url}
                alt={`Post Attachment ${idx + 1}`}
                fill
                unoptimized
                className="object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Campus Connect Actions Bar */}
      <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
        {/* Author Request Panel Button */}
        {isAuthor && (post.postType === 'TEAM_REQUEST' || post.postType === 'EVENT') && (
          <button
            type="button"
            onClick={() => setIsRequestsPanelOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-accent text-white text-xs font-mono font-medium hover:bg-accent-hover transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Teammate Requests</span>
          </button>
        )}

        {/* Interested Applicant Button */}
        {!isAuthor && currentAnonymousProfileId && (post.postType === 'TEAM_REQUEST' || post.postType === 'EVENT') && (
          <button
            type="button"
            onClick={() => setIsConnectOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>I&apos;m Interested / Join Team</span>
          </button>
        )}
      </div>

      {/* Footer Controls: Votes, Comments, Report */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleVote('UP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              userVote === 'UP'
                ? 'bg-verified/10 border-verified text-verified font-semibold'
                : 'bg-background border-border hover:border-text-secondary text-text-primary'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{upvotes}</span>
          </button>

          <button
            type="button"
            onClick={() => handleVote('DOWN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              userVote === 'DOWN'
                ? 'bg-warning/10 border-warning text-warning font-semibold'
                : 'bg-background border-border hover:border-text-secondary text-text-primary'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{downvotes}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border border-border hover:border-text-secondary text-text-primary transition-colors font-mono text-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>{postComments.length} Comments</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="p-1.5 rounded-md text-text-secondary hover:bg-background hover:text-warning transition-colors"
          title="Report this post"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comment Section Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-border space-y-3 animate-in fade-in duration-200">
          <div className="space-y-2">
            {postComments.length === 0 ? (
              <p className="text-xs text-text-secondary italic p-3 bg-background rounded-lg border border-border">
                No comments yet. Write a comment to join the conversation.
              </p>
            ) : (
              postComments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-background border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-mono font-semibold text-text-primary">{c.anonymousProfile.publicHandle}</span>
                    <span className="text-[10px] font-mono" suppressHydrationWarning>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-text-primary">{c.body}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Write an anonymous comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="px-4 py-2 bg-accent hover:bg-accent-hover font-medium text-white text-xs rounded-md transition-all disabled:opacity-50"
            >
              {submittingComment ? 'Sending...' : 'Post Reply'}
            </button>
          </form>
        </div>
      )}

      {/* Modals */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="POST"
          targetId={post.id}
        />
      )}

      {isConnectOpen && (
        <ConnectRequestModal
          postId={post.id}
          postTitle={post.body}
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
        />
      )}

      {isRequestsPanelOpen && (
        <PostRequestsPanel
          postId={post.id}
          isOpen={isRequestsPanelOpen}
          onClose={() => setIsRequestsPanelOpen(false)}
        />
      )}
    </div>
  );
}

