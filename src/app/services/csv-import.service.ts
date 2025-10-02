import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { EmployeeService } from './employee.service';
import { ComprehensiveEmployee, CSVEmployeeData, FIELD_MAPPINGS } from '../models/comprehensive-employee.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {

  constructor(
    private indexedDbService: IndexedDbService,
    private employeeService: EmployeeService
  ) {}

  async importFromFile(file: File): Promise<{ success: number; errors: string[] }> {
    try {
      const csvText = await this.readFileAsText(file);
      const employees = this.parseCSV(csvText);
      
      if (employees.length === 0) {
        return { success: 0, errors: ['No valid employee data found in CSV'] };
      }

      // Clear existing employees before importing new ones
      await this.indexedDbService.clearAllEmployees();
      await this.indexedDbService.saveEmployees(employees);
      
      // Refresh the employee service to update all components
      await this.employeeService.refreshEmployees();
      
      return { 
        success: employees.length, 
        errors: [] 
      };
    } catch (error) {
      console.error('Error importing CSV:', error);
      return { 
        success: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  private parseCSV(csvText: string): ComprehensiveEmployee[] {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const employees: ComprehensiveEmployee[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);

        if (values.length !== headers.length) {
          continue;
        }

        const rowData: CSVEmployeeData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        const employee = this.mapCSVToEmployee(rowData);
        if (employee) {
          employees.push(employee);
        }
      } catch (error) {
      }
    }

    return employees;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  private mapCSVToEmployee(csvData: CSVEmployeeData): ComprehensiveEmployee | null {
    try {
      // Map fields using the mapping object
      const mappedEmployee: Partial<ComprehensiveEmployee> = {};
      
      // Use the FIELD_MAPPINGS from the model
      Object.entries(FIELD_MAPPINGS).forEach(([csvField, modelField]) => {
        if (csvField in csvData) {
          const value = this.transformValue(modelField as keyof ComprehensiveEmployee, csvData[csvField]);
          if (value !== undefined) {
            // Safe dynamic property assignment using Record type
            (mappedEmployee as Record<string, unknown>)[modelField] = value;
          }
        }
      });

      // Set Reports To field based on Reports to 3 (direct manager)
      if (csvData['Reports to 3']) {
        mappedEmployee.reportsTo = csvData['Reports to 3'];
      }

      if (!mappedEmployee.eid || !mappedEmployee.fullName) {
        return null;
      }

      return mappedEmployee as ComprehensiveEmployee;
    } catch (error) {
      console.error('Error mapping CSV data to employee:', error);
      return null;
    }
  }

  private transformValue(field: keyof ComprehensiveEmployee, value: string): string | number | Date | string[] | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }

    const trimmedValue = value.trim();

    switch (field) {
      case 'yearsExperience':
        return this.parseNumber(trimmedValue);

      case 'lastHire':
      case 'lastPromotedDate':
        return this.parseDate(trimmedValue);

      case 'reportsTo4':
      case 'reportsTo5':
        return this.parseStringArray(trimmedValue);

      case 'technicalSkillSet':
      case 'strengthType':
      case 'skillsetExperience':
      case 'careerInterest':
        return this.parseStringArray(trimmedValue);

      case 'jobLevel':
        return this.normalizeJobLevel(trimmedValue);

      case 'jobFamily':
        return this.normalizeJobFamily(trimmedValue);

      case 'plOrIc':
        return trimmedValue.toUpperCase() === 'PL' ? 'PL' : 'IC';

      default:
        return trimmedValue;
    }
  }

  private parseDate(dateString: string): Date {
    // Handle various date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // MM/DD/YY or MM/DD/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // MM-DD-YY or MM-DD-YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;
        
        if (format === formats[2]) { // YYYY-MM-DD
          [, year, month, day] = match;
        } else { // MM/DD/YY or MM-DD-YY
          [, month, day, year] = match;
        }

        // Handle 2-digit years
        if (year.length === 2) {
          const currentYear = new Date().getFullYear();
          const century = Math.floor(currentYear / 100) * 100;
          let yearNum = parseInt(year) + century;
          
          // If the year is more than 50 years in the future, assume it's from the previous century
          if (yearNum - currentYear > 50) {
            yearNum -= 100;
          }
          
          year = yearNum.toString();
        }

        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }

    // Fallback to Date constructor
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private parseStringArray(value: string): string[] {
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private parseNumber(value: string): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeJobLevel(value: string): ComprehensiveEmployee['jobLevel'] | string {
    const normalized = value.trim();
    const validLevels = ['Director', 'Principal Associate', 'Manager', 'Sr. Manager', 'Sr. Director'];
    
    // Find exact match or closest match
    const exactMatch = validLevels.find(level => 
      level.toLowerCase() === normalized.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    // Try partial matches
    const partialMatch = validLevels.find(level => 
      level.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(level.toLowerCase())
    );
    
    return partialMatch || normalized;
  }

  private normalizeJobFamily(value: string): ComprehensiveEmployee['jobFamily'] | string {
    const normalized = value.trim();
    const validFamilies = ['Software Engineering', 'Data Engineering'];
    
    // Handle common variations
    if (normalized.toLowerCase().includes('software') || normalized.toLowerCase().includes('engineering')) {
      if (normalized.toLowerCase().includes('data')) {
        return 'Data Engineering';
      }
      return 'Software Engineering';
    }
    
    const exactMatch = validFamilies.find(family => 
      family.toLowerCase() === normalized.toLowerCase()
    );
    
    return exactMatch || normalized;
  }

  validateCSVStructure(file: File): Promise<{ valid: boolean; errors: string[]; preview: Record<string, string>[] }> {
    return new Promise(async (resolve) => {
      try {
        const csvText = await this.readFileAsText(file);
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          resolve({
            valid: false,
            errors: ['CSV must contain at least a header row and one data row'],
            preview: []
          });
          return;
        }

        const headers = this.parseCSVLine(lines[0]);
        const errors: string[] = [];
        const preview: Record<string, string>[] = [];

        // Check for required fields
        const requiredFields = ['EID', 'Full Name'];
        const missingRequired = requiredFields.filter(field => !headers.includes(field));

        if (missingRequired.length > 0) {
          errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
        }

        // Generate preview of first few rows
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = this.parseCSVLine(lines[i]);
          const rowPreview: Record<string, string> = {};

          headers.forEach((header, index) => {
            rowPreview[header] = values[index] || '';
          });

          preview.push(rowPreview);
        }

        resolve({
          valid: errors.length === 0,
          errors,
          preview
        });
      } catch (error) {
        resolve({
          valid: false,
          errors: [error instanceof Error ? error.message : 'Failed to validate CSV'],
          preview: []
        });
      }
    });
  }
}
