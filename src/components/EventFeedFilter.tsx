'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Filter, Calendar, Search, Sparkles, Building2, Globe } from 'lucide-react';

export default function EventFeedFilter({
  colleges,
}: {
  colleges: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const postType = searchParams.get('postType') || 'ALL';
  const eventType = searchParams.get('eventType') || 'ALL';
  const collegeId = searchParams.get('collegeId') || 'ALL';
  const visibilityScope = searchParams.get('visibilityScope') || 'ALL';
  const sortBy = searchParams.get('sortBy') || 'recency';
  const [skills, setSkills] = useState(searchParams.get('skillsNeeded') || '');

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/feed?${params.toString()}`);
  };

  const handleSkillsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('skillsNeeded', skills.trim());
  };

  return (
    <div className="bg-background-secondary border border-border rounded-lg p-4 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-mono font-semibold text-text-primary">Events & Team-Ups Filter</h3>
        </div>

        {/* View / Post Type Tabs */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border font-mono text-[11px]">
          <button
            onClick={() => updateFilters('postType', 'ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              postType === 'ALL'
                ? 'bg-accent text-white font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => updateFilters('postType', 'EVENT')}
            className={`px-2.5 py-1 rounded transition-colors ${
              postType === 'EVENT'
                ? 'bg-accent text-white font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            🎪 Events
          </button>
          <button
            onClick={() => updateFilters('postType', 'TEAM_REQUEST')}
            className={`px-2.5 py-1 rounded transition-colors ${
              postType === 'TEAM_REQUEST'
                ? 'bg-accent text-white font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            🤝 Teammate Requests
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Event Type Filter */}
        <div>
          <label className="block text-[10px] font-mono text-text-secondary mb-1">Event Category</label>
          <select
            value={eventType}
            onChange={(e) => updateFilters('eventType', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="ALL">All Categories</option>
            <option value="HACKATHON">Hackathons</option>
            <option value="FEST">College Fests</option>
            <option value="WORKSHOP">Workshops</option>
            <option value="SEMINAR">Seminars & Talks</option>
            <option value="CULTURAL">Cultural</option>
            <option value="SPORTS">Sports</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Institution / College Filter */}
        <div>
          <label className="block text-[10px] font-mono text-text-secondary mb-1">Institution</label>
          <select
            value={collegeId}
            onChange={(e) => updateFilters('collegeId', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="ALL">All Gujarat Institutions</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scope Filter */}
        <div>
          <label className="block text-[10px] font-mono text-text-secondary mb-1">Visibility Scope</label>
          <select
            value={visibilityScope}
            onChange={(e) => updateFilters('visibilityScope', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="ALL">All Scopes</option>
            <option value="OPEN_GUJARAT">Open Gujarat Feed</option>
            <option value="COLLEGE_ONLY">College Only</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[10px] font-mono text-text-secondary mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => updateFilters('sortBy', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="recency">Newest Posts First</option>
            <option value="eventDate">Soonest Event Date First</option>
          </select>
        </div>
      </div>

      {/* Skills Search Input */}
      <form onSubmit={handleSkillsSubmit} className="flex gap-2 pt-1">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by required skill (e.g., React, Python, Figma)..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-md transition-colors"
        >
          Search Skill
        </button>
      </form>
    </div>
  );
}
