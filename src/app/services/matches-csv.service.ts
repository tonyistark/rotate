import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';

export interface MatchCsvRow {
  id: string;
  employeeId: string;
  opportunityId: string;
  score: number;
  matchReasons: string[];
  skillGaps: string[];
}

@Injectable({ providedIn: 'root' })
export class MatchesCsvService {
  constructor(private indexedDb: IndexedDbService) {}

  async importFromFile(file: File): Promise<{ success: number; errors: string[] }> {
    try {
      const text = await this.readFileAsText(file);
      const rows = this.parseCSV(text);
      if (rows.length === 0) {
        return { success: 0, errors: ['No valid matches found in CSV'] };
      }

      // Save to IndexedDB (replace existing set)
      await this.indexedDb.clearAllMatches();
      await this.indexedDb.saveMatches(rows);
      return { success: rows.length, errors: [] };
    } catch (e: any) {
      return { success: 0, errors: [e?.message || 'Failed to import matches CSV'] };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSV(text: string): MatchCsvRow[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = this.parseLine(lines[0]).map(h => h.toLowerCase());

    const required = ['id','employeeid','opportunityid','score'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) {
      throw new Error(`Missing required headers: ${missing.join(', ')}`);
    }

    const idx = (name: string) => headers.indexOf(name);
    const out: MatchCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = this.parseLine(lines[i]);
      if (vals.length === 0) continue;
      try {
        const id = vals[idx('id')] || `m_${Date.now()}_${i}`;
        const employeeId = vals[idx('employeeid')] || '';
        const opportunityId = vals[idx('opportunityid')] || '';
        const score = parseInt(vals[idx('score')] || '0', 10);
        const matchReasons = (vals[idx('matchreasons')] || '').split('|').map(s => s.trim()).filter(Boolean);
        const skillGaps = (vals[idx('skillgaps')] || '').split('|').map(s => s.trim()).filter(Boolean);
        if (!employeeId || !opportunityId) continue;
        out.push({ id, employeeId, opportunityId, score, matchReasons, skillGaps });
      } catch {
        // skip row
      }
    }
    return out;
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map(s => s.trim());
  }
}
