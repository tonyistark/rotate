import { Injectable } from '@angular/core';
import { Opportunity } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class CsvParserService {

  /**
   * Parse a CSV line handling quoted fields and commas within quotes
   */
  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse a comma-separated string into an array of trimmed strings
   */
  parseSkillsArray(skillsString: string): string[] {
    if (!skillsString || skillsString.trim() === '') return [];
    return skillsString.split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  /**
   * Parse a string value to boolean
   */
  parseBoolean(value: string): boolean {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  /**
   * Parse and normalize job level values
   */
  parseLevel(value: string): Opportunity['level'] {
    const normalized = value.toLowerCase().trim();

    // Check for exact matches first
    if (normalized === 'executive') return 'Executive';
    if (normalized === 'sr. director' || normalized === 'sr director') return 'Sr. Director';
    if (normalized === 'senior director') return 'Senior Director';
    if (normalized === 'director') return 'Director';
    if (normalized === 'sr. manager' || normalized === 'sr manager') return 'Sr. Manager';
    if (normalized === 'manager') return 'Manager';
    if (normalized === 'principal associate') return 'Principal Associate';
    if (normalized === 'principal') return 'Principal';
    if (normalized === 'senior associate') return 'Senior Associate';
    if (normalized === 'associate') return 'Associate';

    // Check for partial matches if no exact match found
    if (normalized.includes('executive')) return 'Executive';
    if (normalized.includes('sr. director') || normalized.includes('sr director')) return 'Sr. Director';
    if (normalized.includes('senior director')) return 'Senior Director';
    if (normalized.includes('director')) return 'Director';
    if (normalized.includes('sr. manager') || normalized.includes('sr manager')) return 'Sr. Manager';
    if (normalized.includes('manager')) return 'Manager';
    if (normalized.includes('principal associate')) return 'Principal Associate';
    if (normalized.includes('principal')) return 'Principal';
    if (normalized.includes('senior associate')) return 'Senior Associate';
    if (normalized.includes('associate')) return 'Associate';

    return 'Associate';
  }

  /**
   * Parse P&L or IC designation
   */
  parsePlIc(value: string): 'PL' | 'IC' {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('pl') || normalized.includes('p&l') || normalized.includes('p & l')) {
      return 'PL';
    }
    return 'IC';
  }

  /**
   * Parse loss impact values
   */
  parseLossImpact(value: string): 'High' | 'Medium' | 'Low' {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('high')) return 'High';
    if (normalized.includes('medium')) return 'Medium';
    return 'Low';
  }

  /**
   * Parse attrition risk values
   */
  parseAttritionRisk(value: string): 'High' | 'Medium' | 'Low' {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('high')) return 'High';
    if (normalized.includes('medium')) return 'Medium';
    return 'Low';
  }

  /**
   * Parse a numeric value, returning 0 if invalid
   */
  parseNumber(value: string): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse a date string to Date object
   */
  parseDate(value: string): Date | undefined {
    if (!value || value.trim() === '') return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  /**
   * Safely trim a string value, handling null/undefined
   */
  safeTrim(value: string | null | undefined): string {
    return value ? value.trim() : '';
  }
}
