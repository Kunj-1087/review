'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Building2,
  Lock,
  Award,
  ArrowRight,
  SlidersHorizontal,
  Scale,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DirectoryCollege {
  id: string;
  name: string;
  slug: string;
  city: string;
  type: string;
  typeDetail?: string | null;
  establishedYear?: number | null;
  streams: string[];
  officialDomains: string[];
  stats: {
    reviewCount: number;
    hasEnoughReviews: boolean;
    overallRating: number | null;
  };
}

export default function CollegeDirectoryClient({
  initialColleges,
  initialCities,
}: {
  initialColleges: DirectoryCollege[];
  initialCities: string[];
}) {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'reviews' | 'recent'>('name');

  // Compare mode state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  const streamsList = [
    'ALL',
    'Engineering',
    'Medical',
    'Dental',
    'Management',
    'Law',
    'Pharmacy',
    'Commerce',
    'Arts',
    'Science',
    'Architecture',
  ];

  const filteredColleges = initialColleges.filter((c) => {
    // Search matching
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCity = c.city.toLowerCase().includes(q);
      const matchSlug = c.slug.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchSlug) return false;
    }

    // City Filter
    if (selectedCity !== 'ALL' && c.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }

    // Stream Filter
    if (selectedStream !== 'ALL') {
      const hasStream = c.streams.some((st) => st.toLowerCase().includes(selectedStream.toLowerCase()));
      if (!hasStream) return false;
    }

    // Type Filter
    if (selectedType !== 'ALL' && c.type.toUpperCase() !== selectedType.toUpperCase()) {
      return false;
    }

    // Rating Filter
    if (selectedRating === 'UNLOCKED' && !c.stats.hasEnoughReviews) return false;
    if (selectedRating === '4_PLUS' && (!c.stats.hasEnoughReviews || (c.stats.overallRating || 0) < 4.0)) return false;
    if (selectedRating === '3_PLUS' && (!c.stats.hasEnoughReviews || (c.stats.overallRating || 0) < 3.0)) return false;

    return true;
  });

  // Sorting
  const sortedColleges = [...filteredColleges].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.stats.overallRating || 0) - (a.stats.overallRating || 0);
    }
    if (sortBy === 'reviews') {
      return b.stats.reviewCount - a.stats.reviewCount;
    }
    return a.name.localeCompare(b.name);
  });

  const toggleCompareSelect = (id: string) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds(selectedCompareIds.filter((item) => item !== id));
    } else {
      if (selectedCompareIds.length >= 3) {
        alert('You can compare up to 3 colleges at a time.');
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, id]);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Directory Page Header */}
      <div className="bg-background-secondary border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-text-primary">
                Gujarat College Directory
              </h1>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Explore verified ratings, stream offerings, and scorecards across {initialColleges.length} higher ed institutions.
            </p>
          </div>

          {/* Compare Selection Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (isCompareMode) setSelectedCompareIds([]);
            }}
            className={`px-4 py-2.5 rounded-md font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${isCompareMode
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-background border border-border text-text-primary hover:border-accent'
              }`}
          >
            <Scale className="w-4 h-4 text-accent group-hover:text-white" />
            <span>{isCompareMode ? 'Exit Compare Mode' : 'Compare Colleges Mode'}</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by college name, city (e.g. Nirma, Surat, GTU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="ALL">All Cities ({initialCities.length})</option>
            {initialCities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          {/* Stream Filter */}
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="px-3 py-2.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
          >
            <option value="ALL">All Streams</option>
            {streamsList.filter((s) => s !== 'ALL').map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono font-medium"
          >
            <option value="name">Sort: Alphabetical Name</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="reviews">Sort: Most Reviewed</option>
          </select>
        </div>

        {/* Second Filter Row: Rating Range & Type */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border text-xs">
          <div className="flex items-center gap-2 font-mono text-text-secondary">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            <span>Scorecard Status:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedRating(selectedRating === 'UNLOCKED' ? 'ALL' : 'UNLOCKED')}
            className={`px-3 py-1 rounded-md border font-mono text-[11px] transition-colors ${selectedRating === 'UNLOCKED'
                ? 'bg-verified/10 border-verified text-verified font-bold'
                : 'bg-background border-border text-text-secondary hover:text-text-primary'
              }`}
          >
            Threshold Unlocked (≥5 Reviews)
          </button>

          <button
            type="button"
            onClick={() => setSelectedRating(selectedRating === '4_PLUS' ? 'ALL' : '4_PLUS')}
            className={`px-3 py-1 rounded-md border font-mono text-[11px] transition-colors ${selectedRating === '4_PLUS'
                ? 'bg-accent/15 border-accent text-accent font-bold'
                : 'bg-background border-border text-text-secondary hover:text-text-primary'
              }`}
          >
            4.0+ Stars Rated
          </button>

          <div className="ml-auto text-xs font-mono text-text-secondary">
            Showing <strong className="text-text-primary">{sortedColleges.length}</strong> of {initialColleges.length} Institutions
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedColleges.map((college) => {
          const isSelectedForCompare = selectedCompareIds.includes(college.id);

          return (
            <div
              key={college.id}
              className={`group bg-background-secondary border rounded-xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-sm relative ${isSelectedForCompare
                  ? 'border-accent ring-2 ring-accent/20 bg-accent/5'
                  : 'border-border hover:border-accent'
                }`}
            >
              {/* Compare Mode Checkbox */}
              {isCompareMode && (
                <button
                  type="button"
                  onClick={() => toggleCompareSelect(college.id)}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-background border border-border text-xs font-mono font-semibold transition-all hover:border-accent"
                >
                  <input
                    type="checkbox"
                    checked={isSelectedForCompare}
                    onChange={() => { }}
                    className="accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className={isSelectedForCompare ? 'text-accent' : 'text-text-secondary'}>
                    {isSelectedForCompare ? 'Selected' : 'Select'}
                  </span>
                </button>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 pr-16">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-text-secondary font-semibold">
                      {college.city}
                    </span>
                    <h3 className="text-base font-serif font-semibold text-text-primary group-hover:text-accent transition-colors mt-2">
                      {college.name}
                    </h3>
                  </div>
                </div>

                {college.stats.hasEnoughReviews ? (
                  <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md w-fit">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="font-mono font-bold text-xs text-accent">
                      {college.stats.overallRating} / 5.0
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      ({college.stats.reviewCount} reviews)
                    </span>
                  </div>
                ) : (
                  <div className="threshold-lock-stamp">
                    <Lock className="w-3.5 h-3.5 text-warning" />
                    <span>{college.stats.reviewCount}/5 reviews (Scorecard Locked)</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {college.streams.slice(0, 4).map((st: string) => (
                    <span
                      key={st}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-text-secondary"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary font-mono">
                <span>{college.type}</span>
                <Link
                  href={`/colleges/${college.slug}`}
                  className="font-medium text-accent hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Compare Action Bar (Step 5) */}
      {isCompareMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background-secondary border border-accent rounded-xl p-4 shadow-xl flex items-center gap-4 max-w-lg w-full">
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-serif font-semibold text-text-primary flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-accent" />
              <span>College Comparison Selection</span>
            </h4>
            <p className="text-[11px] text-text-secondary font-mono">
              {selectedCompareIds.length} of 3 institutions selected
            </p>
          </div>

          <Link
            href={`/colleges/compare?ids=${selectedCompareIds.join(',')}`}
            aria-disabled={selectedCompareIds.length < 2}
            className={`px-5 py-2.5 rounded-md text-xs font-medium transition-all font-mono flex items-center gap-1.5 ${selectedCompareIds.length >= 2
                ? 'bg-accent text-white hover:bg-accent-hover shadow-sm'
                : 'bg-background border border-border text-text-secondary cursor-not-allowed opacity-60'
              }`}
          >
            <span>Compare Side-by-Side</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
