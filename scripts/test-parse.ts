import path from 'path';
import { parseResearchMarkdown } from './parse-colleges';

const filePath = path.join(process.cwd(), 'data/raw/gujarat-colleges-research-2026-08.md');
const result = parseResearchMarkdown(filePath);

console.log('Unmapped Rows:', result.unmappedRows);
