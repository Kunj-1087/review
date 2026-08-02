'use client';

import { useState } from 'react';
import { createPostAction } from '@/lib/actions/content';
import { SessionData, PostType, EventType, VisibilityScope } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Send, AlertCircle, Lock, Calendar, Users, Link as LinkIcon, Globe, Building2, X, Plus } from 'lucide-react';

const EVENT_TYPES: { key: EventType; label: string }[] = [
  { key: 'HACKATHON', label: 'Hackathon' },
  { key: 'FEST', label: 'College Fest' },
  { key: 'WORKSHOP', label: 'Workshop' },
  { key: 'SEMINAR', label: 'Seminar / Talk' },
  { key: 'CULTURAL', label: 'Cultural Event' },
  { key: 'SPORTS', label: 'Sports Meet' },
  { key: 'OTHER', label: 'Other Event' },
];

export default function CreatePostForm({
  collegeId,
  session,
}: {
  collegeId: string;
  session: SessionData | null;
}) {
  const [postType, setPostType] = useState<PostType>('GENERAL');
  const [body, setBody] = useState('');
  const [eventType, setEventType] = useState<EventType>('HACKATHON');
  const [eventDate, setEventDate] = useState('');
  const [visibilityScope, setVisibilityScope] = useState<VisibilityScope>('OPEN_GUJARAT');
  const [externalLink, setExternalLink] = useState('');
  const [teamSizeNeeded, setTeamSizeNeeded] = useState<string>('');
  const [rolesNeededInput, setRolesNeededInput] = useState('');
  const [skillsNeededInput, setSkillsNeededInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!session) {
    return (
      <div className="p-4 rounded-lg bg-background border border-border text-xs text-text-secondary space-y-2">
        <p className="flex items-center gap-1.5 text-text-primary font-medium">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>Sign in to Post</span>
        </p>
        <p>Sign in using your verified student email to participate in campus discussions and Campus Connect teammate requests.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const combined = [...files, ...selectedFiles].slice(0, 4);
      setFiles(combined);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('Post body content cannot be empty.');
      return;
    }

    const rolesNeeded = rolesNeededInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const skillsNeeded = skillsNeededInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (postType === 'TEAM_REQUEST' && rolesNeeded.length === 0) {
      setError('Team Request posts must specify at least one role needed (e.g., "Frontend Developer").');
      return;
    }

    setLoading(true);

    // Image Upload Pipeline with EXIF stripping
    const uploadedUrls: string[] = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        } else if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    const res = await createPostAction({
      collegeId,
      body: body.trim(),
      imageUrls: uploadedUrls,
      postType,
      eventType: postType !== 'GENERAL' ? eventType : undefined,
      eventDate: postType !== 'GENERAL' && eventDate ? eventDate : undefined,
      visibilityScope,
      externalLink: externalLink.trim() || undefined,
      teamSizeNeeded: teamSizeNeeded ? parseInt(teamSizeNeeded, 10) : undefined,
      rolesNeeded: postType === 'TEAM_REQUEST' ? rolesNeeded : [],
      skillsNeeded,
    });

    setLoading(false);

    if (res.success) {
      setBody('');
      setFiles([]);
      setExternalLink('');
      setTeamSizeNeeded('');
      setRolesNeededInput('');
      setSkillsNeededInput('');
      setEventDate('');
      router.refresh();
    } else {
      setError(res.error || 'Failed to submit post.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Post Type Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-background rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setPostType('GENERAL')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium font-mono transition-all ${
            postType === 'GENERAL'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
          }`}
        >
          💬 General Post
        </button>
        <button
          type="button"
          onClick={() => setPostType('EVENT')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium font-mono transition-all ${
            postType === 'EVENT'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
          }`}
        >
          🎪 Event Post
        </button>
        <button
          type="button"
          onClick={() => setPostType('TEAM_REQUEST')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium font-mono transition-all ${
            postType === 'TEAM_REQUEST'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
          }`}
        >
          🤝 Team Request
        </button>
      </div>

      {/* Main Content Body */}
      <textarea
        rows={3}
        placeholder={
          postType === 'GENERAL'
            ? `Share an update or question under anonymous handle ${session.publicHandle}...`
            : postType === 'EVENT'
            ? `Describe the upcoming event, schedule, and details...`
            : `Describe your hackathon project or fest idea and what teammates you are looking for...`
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full p-3.5 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent resize-none"
      />

      {/* Structured Fields for Event & Team Request */}
      {postType !== 'GENERAL' && (
        <div className="p-3.5 bg-background border border-border rounded-lg space-y-3.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Event Type */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1">
                Event Category <span className="text-warning">*</span>
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-accent" />
                <span>Event Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent"
              />
            </div>
          </div>

          {/* Team Request Specific Fields */}
          {postType === 'TEAM_REQUEST' && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1">
                    Roles Needed <span className="text-warning">*</span> (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Dev, UI/UX Designer, Backend"
                    value={rolesNeededInput}
                    onChange={(e) => setRolesNeededInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-accent" />
                    <span>Teammates Count</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g. 2"
                    value={teamSizeNeeded}
                    onChange={(e) => setTeamSizeNeeded(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1">
                  Skills Preferred (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Python, Tailwind, Figma, Machine Learning"
                  value={skillsNeededInput}
                  onChange={(e) => setSkillsNeededInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
                />
              </div>
            </div>
          )}

          {/* Visibility Scope & Registration Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <div>
              <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1">
                Feed Visibility Scope
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibilityScope('OPEN_GUJARAT')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-mono flex items-center justify-center gap-1 border transition-colors ${
                    visibilityScope === 'OPEN_GUJARAT'
                      ? 'bg-accent/10 border-accent text-accent font-semibold'
                      : 'bg-background-secondary border-border text-text-secondary'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>All Gujarat Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityScope('COLLEGE_ONLY')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-mono flex items-center justify-center gap-1 border transition-colors ${
                    visibilityScope === 'COLLEGE_ONLY'
                      ? 'bg-accent/10 border-accent text-accent font-semibold'
                      : 'bg-background-secondary border-border text-text-secondary'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>College Only</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-text-secondary mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-accent" />
                <span>External Link (Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://hackathon-reg.com"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full px-3 py-1.5 bg-background-secondary border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Multi-Image Upload & Preview Badges (Up to 4 images) */}
      <div className="space-y-2">
        {files.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-xs text-text-primary font-mono">
                <ImageIcon className="w-3 h-3 text-accent" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-text-secondary hover:text-warning ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="cursor-pointer px-3 py-1.5 rounded-md bg-background hover:bg-border/50 text-text-secondary hover:text-text-primary text-xs flex items-center gap-1.5 transition-colors border border-border font-mono">
            <ImageIcon className="w-3.5 h-3.5 text-accent" />
            <span>
              {files.length === 0 ? 'Attach Images (Max 4)' : `Add More (${files.length}/4)`}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={files.length >= 4}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover font-medium text-white text-xs rounded-md transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>
                  {postType === 'GENERAL' ? 'Post to Feed' : postType === 'EVENT' ? 'Publish Event' : 'Post Team Request'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
