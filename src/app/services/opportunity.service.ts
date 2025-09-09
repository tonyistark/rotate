import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Opportunity } from '../models/employee.model';
import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
  private opportunities: Opportunity[] = [];
  private opportunitiesSubject = new BehaviorSubject<Opportunity[]>([]);

  constructor(private http: HttpClient, private indexedDbService: IndexedDbService) {
    this.loadOpportunityData();
  }

  private async loadOpportunityData(): Promise<void> {
    try {
      // Load only from IndexedDB - no JSON or CSV fallback
      const indexedOpportunities = await this.indexedDbService.getAllOpportunities();
      
      if (indexedOpportunities.length > 0) {
        this.opportunities = indexedOpportunities;
        this.opportunitiesSubject.next(indexedOpportunities);
      } else {
        // No opportunities in IndexedDB - user needs to upload CSV data
        console.log('No opportunities found in IndexedDB. Please upload opportunity CSV data through the admin interface.');
        this.opportunities = [];
        this.opportunitiesSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading opportunities from IndexedDB:', error);
      this.opportunities = [];
      this.opportunitiesSubject.next([]);
    }
  }

  getOpportunities(): Observable<Opportunity[]> {
    return this.opportunitiesSubject.asObservable();
  }

  getOpportunityById(id: string): Opportunity | undefined {
    return this.opportunities.find(opp => opp.id === id);
  }

  createOpportunity(opportunity: Omit<Opportunity, 'id'>): Observable<Opportunity> {
    const newOpportunity: Opportunity = {
      ...opportunity,
      id: this.generateId()
    };
    
    this.opportunities.push(newOpportunity);
    this.opportunitiesSubject.next([...this.opportunities]);
    
    return new Observable(observer => {
      observer.next(newOpportunity);
      observer.complete();
    });
  }

  updateOpportunity(id: string, updatedOpportunity: Omit<Opportunity, 'id'>): Observable<Opportunity> {
    const index = this.opportunities.findIndex(opp => opp.id === id);
    if (index === -1) {
      return new Observable(observer => {
        observer.error(new Error('Opportunity not found'));
      });
    }

    const opportunity: Opportunity = {
      ...updatedOpportunity,
      id: id
    };

    this.opportunities[index] = opportunity;
    this.opportunitiesSubject.next([...this.opportunities]);

    return new Observable(observer => {
      observer.next(opportunity);
      observer.complete();
    });
  }

  assignEmployee(opportunityId: string, employeeId: string, employee: any): Observable<Opportunity> {
    const index = this.opportunities.findIndex(opp => opp.id === opportunityId);
    if (index === -1) {
      return new Observable(observer => {
        observer.error(new Error('Opportunity not found'));
      });
    }

    this.opportunities[index] = {
      ...this.opportunities[index],
      assignedEmployeeId: employeeId,
      assignedEmployee: employee,
      assignmentDate: new Date().toISOString()
    };

    this.opportunitiesSubject.next([...this.opportunities]);

    return new Observable(observer => {
      observer.next(this.opportunities[index]);
      observer.complete();
    });
  }

  removeAssignment(opportunityId: string): Observable<Opportunity> {
    const index = this.opportunities.findIndex(opp => opp.id === opportunityId);
    if (index === -1) {
      return new Observable(observer => {
        observer.error(new Error('Opportunity not found'));
      });
    }

    this.opportunities[index] = {
      ...this.opportunities[index],
      assignedEmployeeId: undefined,
      assignedEmployee: undefined,
      assignmentDate: undefined
    };

    this.opportunitiesSubject.next([...this.opportunities]);

    return new Observable(observer => {
      observer.next(this.opportunities[index]);
      observer.complete();
    });
  }

  async uploadOpportunities(opportunities: Opportunity[]): Promise<void> {
    try {
      // Add unique IDs to opportunities that don't have them
      const processedOpportunities = opportunities.map(opp => ({
        ...opp,
        id: opp.id || this.generateId()
      }));

      // Save to IndexedDB
      await this.indexedDbService.saveOpportunities(processedOpportunities);
      
      // Update local cache and notify subscribers
      this.opportunities = processedOpportunities;
      this.opportunitiesSubject.next([...this.opportunities]);
    } catch (error) {
      console.error('Error uploading opportunities:', error);
      throw error;
    }
  }

  private generateId(): string {
    return 'opp_' + Math.random().toString(36).substr(2, 9);
  }

  private parseOpportunitiesCSV(csvText: string): Opportunity[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const opportunities: Opportunity[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      try {
        const opportunity: Opportunity = {
          id: values[headers.indexOf('id')] || `opp_${Date.now()}_${i}`,
          title: values[headers.indexOf('title')] || '',
          department: values[headers.indexOf('department')] || '',
          description: values[headers.indexOf('description')] || '',
          requiredSkills: this.parseSkillsArray(values[headers.indexOf('requiredskills')] || ''),
          preferredSkills: this.parseSkillsArray(values[headers.indexOf('preferredskills')] || ''),
          timeCommitment: values[headers.indexOf('timecommitment')] || '',
          duration: values[headers.indexOf('duration')] || '',
          learningOutcomes: this.parseSkillsArray(values[headers.indexOf('learningoutcomes')] || ''),
          mentorAvailable: this.parseBoolean(values[headers.indexOf('mentoravailable')] || 'true'),
          remote: this.parseBoolean(values[headers.indexOf('remote')] || 'true'),
          level: this.parseLevel(values[headers.indexOf('level')] || 'Associate'),
          applicationDeadline: values[headers.indexOf('applicationdeadline')] || '',
          startDate: values[headers.indexOf('startdate')] || '',
          submittedBy: values[headers.indexOf('submittedby')] || '',
          leader: values[headers.indexOf('leader')] || '',
          jobLevel: values[headers.indexOf('joblevel')] || '',
          jobFamily: values[headers.indexOf('jobfamily')] || '',
          jobProfile: values[headers.indexOf('jobprofile')] || '',
          plIc: this.parsePlIc(values[headers.indexOf('plic')] || 'IC'),
          tenure: values[headers.indexOf('tenure')] || '',
          location: values[headers.indexOf('location')] || '',
          dayZero: this.parseBoolean(values[headers.indexOf('dayzero')] || 'false'),
          lossImpact: this.parseLossImpact(values[headers.indexOf('lossimpact')] || 'Medium'),
          attritionRisk: this.parseAttritionRisk(values[headers.indexOf('attritionrisk')] || 'Medium'),
          attritionResponse: values[headers.indexOf('attritionresponse')] || '',
          previousPerformanceRatings: this.parseSkillsArray(values[headers.indexOf('previousperformanceratings')] || ''),
          rotationLevel: values[headers.indexOf('rotationlevel')] || '',
          rotationLength: values[headers.indexOf('rotationlength')] || ''
        };

        if (opportunity.title && opportunity.department) {
          opportunities.push(opportunity);
        }
      } catch (error) {
        console.warn(`Skipping invalid opportunity at line ${i + 1}:`, error);
      }
    }

    return opportunities;
  }

  private parseCSVLine(line: string): string[] {
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

  private parseSkillsArray(value: string): string[] {
    if (!value || value.trim() === '') return [];
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === 'true';
  }

  private parseLevel(value: string): 'Associate' | 'Senior Associate' | 'Principal Associate' | 'Manager' | 'Sr. Manager' | 'Director' | 'Sr. Director' | 'Senior Director' | 'Principal' | 'Executive' {
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

  private parsePlIc(value: string): 'PL' | 'IC' {
    return value.toUpperCase() === 'PL' ? 'PL' : 'IC';
  }

  private parseLossImpact(value: string): 'Low' | 'Medium' | 'High' {
    const normalized = value.toLowerCase();
    if (normalized.includes('low')) return 'Low';
    if (normalized.includes('high')) return 'High';
    return 'Medium';
  }

  private parseAttritionRisk(value: string): 'Low' | 'Medium' | 'High' {
    const normalized = value.toLowerCase();
    if (normalized.includes('low')) return 'Low';
    if (normalized.includes('high')) return 'High';
    return 'Medium';
  }
}
