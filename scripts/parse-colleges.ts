import fs from 'fs';

export interface RawCollegeRow {
  name: string;
  city: string;
  streams: string[];
  affiliation: string;
  type: string; // GOVERNMENT, PRIVATE, DEEMED
  typeDetail: string | null;
  website: string;
  officialDomains: string[];
  domainConfidence: 'confirmed' | 'likely' | 'unconfirmed' | 'none';
  establishedYear: number | null;
  formerNames: string[];
  sourceNotes: string | null;
}

export interface ParseResult {
  colleges: RawCollegeRow[];
  unmappedRows: string[];
  mergedDecisions: { oldName: string; parentName: string; city: string; reason: string }[];
  possibleDuplicates: { name: string; city1: string; city2: string; reason: string }[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseResearchMarkdown(filePath: string): ParseResult {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/);

  const rawParsedRows: {
    rawName: string;
    rawCity: string;
    rawStreams: string;
    rawAffiliation: string;
    rawType: string;
    rawWebsite: string;
    rawEmailDomain: string;
    rawConfidence: string;
    rawEstYear: string;
    rawNotes: string;
    lineNo: number;
  }[] = [];

  const unmappedRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip Category headers, section summaries, disclaimers
    if (
      line.startsWith('Gujarat Colleges & Universities Database') ||
      line.startsWith('Compiled from') ||
      line.startsWith('Category') ||
      line.startsWith('Note:') ||
      line.startsWith('Summary') ||
      line.startsWith('Total') ||
      line.startsWith('Status\tCount') ||
      line.startsWith('Confirmed (found') ||
      line.startsWith('Likely (domain') ||
      line.startsWith('Unconfirmed (domain') ||
      line.startsWith('Institutions with Confirmed Domains') ||
      line.startsWith('Engineering & Technology') ||
      line.startsWith('Medical & Dental') ||
      line.startsWith('Arts, Commerce & Science') ||
      line.startsWith('Law') ||
      line.startsWith('Management') ||
      line.startsWith('Pharmacy') ||
      line.startsWith('Private & Deemed Universities') ||
      line.startsWith('Government Universities') ||
      line.startsWith('Government Medical Colleges') ||
      line.startsWith('Private Medical Colleges') ||
      line.startsWith('Government Dental Colleges') ||
      line.startsWith('Private Dental Colleges') ||
      line.startsWith('(Source:')
    ) {
      continue;
    }

    const parts = line.split('\t');

    // Skip table header
    if (parts[0] === 'Name' && parts[1] === 'City') {
      continue;
    }

    if (parts.length >= 8) {
      const rawName = parts[0]?.trim() || '';
      const rawCity = parts[1]?.trim() || '';
      const rawStreams = parts[2]?.trim() || '';
      const rawAffiliation = parts[3]?.trim() || '';
      const rawType = parts[4]?.trim() || '';
      const rawWebsite = parts[5]?.trim() || '';
      const rawEmailDomain = parts[6]?.trim() || '';
      const rawConfidence = parts[7]?.trim() || '';
      const rawEstYear = parts[8]?.trim() || '';
      const rawNotes = parts[9]?.trim() || '';

      if (rawName && rawCity) {
        rawParsedRows.push({
          rawName,
          rawCity,
          rawStreams,
          rawAffiliation,
          rawType,
          rawWebsite,
          rawEmailDomain,
          rawConfidence,
          rawEstYear,
          rawNotes,
          lineNo: i + 1,
        });
      } else {
        unmappedRows.push(`Line ${i + 1}: Missing name or city -> "${line}"`);
      }
    } else if (line.includes('\t')) {
      unmappedRows.push(`Line ${i + 1}: Insufficient tab columns (${parts.length}) -> "${line}"`);
    }
  }

  // Deduplication & Explicit Mergers
  const mergedDecisions: { oldName: string; parentName: string; city: string; reason: string }[] = [];
  const possibleDuplicates: { name: string; city1: string; city2: string; reason: string }[] = [];

  // Known parent universities mapping from Notes (e.g., "Now Marwadi University campus")
  const explicitMergerMap: Record<string, { parentName: string; formerName: string }> = {
    'marwadi education foundation group of institutions': {
      parentName: 'Marwadi University',
      formerName: 'Marwadi Education Foundation Group of Institutions',
    },
    'darshan institute of engineering & technology': {
      parentName: 'Darshan University',
      formerName: 'Darshan Institute of Engineering & Technology',
    },
    'noble group of institutions': {
      parentName: 'Noble University',
      formerName: 'Noble Group of Institutions',
    },
    'vidhyadeep institute of engineering and technology': {
      parentName: 'Vidhyadeep University',
      formerName: 'Vidhyadeep Institute of Engineering and Technology',
    },
    'indus institute of technology & engineering': {
      parentName: 'Indus University',
      formerName: 'Indus Institute of Technology & Engineering',
    },
    'gyanmanjari institute of technology': {
      parentName: 'Gyanmanjari Innovative University',
      formerName: 'Gyanmanjari Institute of Technology',
    },
    'sankalchand patel college of engineering': {
      parentName: 'Sankalchand Patel University',
      formerName: 'Sankalchand Patel College of Engineering',
    },
    'shree pandit nathulalji vyas technical campus': {
      parentName: 'Surendranagar University',
      formerName: 'Shree Pandit Nathulalji Vyas Technical Campus',
    },
    'adani institute of infrastructure management': {
      parentName: 'Adani University',
      formerName: 'Adani Institute of Infrastructure Management',
    },
  };

  const processedCollegesMap = new Map<string, RawCollegeRow>();

  // Check for potential duplicate flags first
  const nameCounts = new Map<string, { city: string; lineNo: number }[]>();
  for (const r of rawParsedRows) {
    const cleanNameKey = r.rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = nameCounts.get(cleanNameKey) || [];
    existing.push({ city: r.rawCity, lineNo: r.lineNo });
    nameCounts.set(cleanNameKey, existing);
  }

  for (const [key, entries] of nameCounts.entries()) {
    if (entries.length > 1) {
      // Check if it's explicitly merged or a possible duplicate
      const firstEntry = rawParsedRows.find((r) => r.rawName.toLowerCase().replace(/[^a-z0-9]/g, '') === key);
      const isExplicitMerger = firstEntry && explicitMergerMap[firstEntry.rawName.toLowerCase().trim()];
      if (!isExplicitMerger) {
        possibleDuplicates.push({
          name: firstEntry?.rawName || key,
          city1: entries[0].city,
          city2: entries[1].city,
          reason: `Appears ${entries.length} times with different city/location detail (Lines ${entries.map((e) => e.lineNo).join(', ')}). Kept separate per Rule 1.`,
        });
      }
    }
  }

  // Parse and build models
  for (const r of rawParsedRows) {
    const lowerName = r.rawName.toLowerCase().trim();

    // 1. Clean City
    const city = r.rawCity.replace(/\(unconfirmed\)/gi, '').trim();

    // 2. Clean Streams
    const streams = r.rawStreams
      ? r.rawStreams
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['General'];

    // 3. Established Year
    let establishedYear: number | null = null;
    const yearMatch = r.rawEstYear.match(/\b(18|19|20)\d{2}\b/);
    if (yearMatch) {
      establishedYear = parseInt(yearMatch[0], 10);
    }

    // 4. Type & Type Detail
    const rawTypeUpper = r.rawType.toUpperCase();
    const rawAffUpper = r.rawAffiliation.toUpperCase();
    let type = 'PRIVATE';
    if (rawTypeUpper.includes('DEEMED') || rawAffUpper.includes('DEEMED')) {
      type = 'DEEMED';
    } else if (
      rawTypeUpper.includes('GOVERNMENT') ||
      rawTypeUpper.includes('GOVT') ||
      rawTypeUpper.includes('GRANT-IN-AID') ||
      rawTypeUpper.includes('GIA') ||
      rawTypeUpper.includes('MUNICIPAL') ||
      rawTypeUpper.includes('CENTRAL') ||
      rawAffUpper.includes('NATIONAL IMPORTANCE') ||
      rawAffUpper.includes('NIT')
    ) {
      type = 'GOVERNMENT';
    }

    const typeDetail = r.rawType || null;

    // 5. Domain & Confidence (EXACT match to avoid 'unconfirmed' matching 'confirmed')
    let domainConfidence: 'confirmed' | 'likely' | 'unconfirmed' | 'none' = 'unconfirmed';
    const confLower = r.rawConfidence.toLowerCase().trim();
    if (confLower === 'confirmed') {
      domainConfidence = 'confirmed';
    } else if (confLower === 'likely') {
      domainConfidence = 'likely';
    } else if (confLower === 'none') {
      domainConfidence = 'none';
    } else {
      domainConfidence = 'unconfirmed';
    }

    let cleanDomain = r.rawEmailDomain.replace(/^@/, '').trim().toLowerCase();
    if (cleanDomain === '—' || cleanDomain === '-') cleanDomain = '';

    // Rule 5: Only store domain in officialDomains if Confirmed or Likely
    const officialDomains: string[] = [];
    if ((domainConfidence === 'confirmed' || domainConfidence === 'likely') && cleanDomain) {
      officialDomains.push(cleanDomain);
    }

    // 6. Source Notes
    let sourceNotes: string | null = r.rawNotes || null;
    if (sourceNotes === '—' || sourceNotes === '-') sourceNotes = null;

    // 7. Former Names & Merger Logic (Rule 1)
    const formerNames: string[] = [];
    let name = r.rawName;

    // Check for inline "formerly" in name e.g. "Sabarmati University (formerly Calorx Teacher's University)"
    const formerMatch = name.match(/\(formerly\s+(.+?)\)/i);
    if (formerMatch) {
      formerNames.push(formerMatch[1].trim());
      name = name.replace(/\(formerly\s+.+?\)/i, '').trim();
    }

    // Check for "Formerly" in notes e.g. "Formerly RAKSHA SHAKTI University"
    if (sourceNotes) {
      const noteFormerMatch = sourceNotes.match(/formerly\s+([^,.;]+)/i);
      if (noteFormerMatch && !formerNames.includes(noteFormerMatch[1].trim())) {
        formerNames.push(noteFormerMatch[1].trim());
      }
    }

    // Explicit Merger check
    if (explicitMergerMap[lowerName]) {
      const merger = explicitMergerMap[lowerName];
      mergedDecisions.push({
        oldName: r.rawName,
        parentName: merger.parentName,
        city,
        reason: `Note explicitly stated merger: "${r.rawNotes}". Merged into ${merger.parentName}.`,
      });

      // Check if parent already exists in map or will be added later
      const parentKey = `${merger.parentName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${city.toLowerCase()}`;
      const existingParent = processedCollegesMap.get(parentKey);
      if (existingParent) {
        if (!existingParent.formerNames.includes(merger.formerName)) {
          existingParent.formerNames.push(merger.formerName);
        }
        // Combine streams
        streams.forEach((st) => {
          if (!existingParent.streams.includes(st)) existingParent.streams.push(st);
        });
        continue; // Skip creating separate row
      } else {
        // Tag formerName onto raw object so when parent row is encountered or created it retains it
        formerNames.push(merger.formerName);
      }
    }

    const uniqueKey = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${city.toLowerCase()}`;
    const existing = processedCollegesMap.get(uniqueKey);

    if (existing) {
      // Merge streams, domains, formerNames
      streams.forEach((st) => {
        if (!existing.streams.includes(st)) existing.streams.push(st);
      });
      officialDomains.forEach((d) => {
        if (!existing.officialDomains.includes(d)) existing.officialDomains.push(d);
      });
      formerNames.forEach((fn) => {
        if (!existing.formerNames.includes(fn)) existing.formerNames.push(fn);
      });
      if (domainConfidence === 'confirmed') existing.domainConfidence = 'confirmed';
      if (sourceNotes && !existing.sourceNotes?.includes(sourceNotes)) {
        existing.sourceNotes = existing.sourceNotes ? `${existing.sourceNotes}; ${sourceNotes}` : sourceNotes;
      }
    } else {
      processedCollegesMap.set(uniqueKey, {
        name,
        city,
        streams,
        affiliation: r.rawAffiliation || 'State University',
        type,
        typeDetail,
        website: r.rawWebsite === '—' ? '' : r.rawWebsite,
        officialDomains,
        domainConfidence,
        establishedYear,
        formerNames,
        sourceNotes,
      });
    }
  }

  return {
    colleges: Array.from(processedCollegesMap.values()),
    unmappedRows,
    mergedDecisions,
    possibleDuplicates,
  };
}
