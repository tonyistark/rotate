import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Opportunity } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
  private opportunities: Opportunity[] = [];
  private opportunitiesSubject = new BehaviorSubject<Opportunity[]>([]);

  constructor(private http: HttpClient) {
    this.loadOpportunityData();
  }

  private loadOpportunityData(): void {
    this.http.get<Opportunity[]>('/assets/data/opportunities.json')
      .pipe(
        tap(opportunities => console.log('Loaded opportunities from JSON:', opportunities))
      )
      .subscribe({
        next: (opportunities) => {
          this.opportunities = opportunities;
          this.opportunitiesSubject.next(opportunities);
        },
        error: (error) => {
          console.error('Error loading opportunity data:', error);
          // Fallback to empty array if JSON fails to load
          this.opportunitiesSubject.next([]);
        }
      });
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

  uploadOpportunities(opportunities: Opportunity[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Add unique IDs to opportunities that don't have them
        const processedOpportunities = opportunities.map(opp => ({
          ...opp,
          id: opp.id || this.generateId()
        }));

        // Replace existing opportunities with uploaded ones
        this.opportunities = processedOpportunities;
        this.opportunitiesSubject.next([...this.opportunities]);
        
        console.log(`Successfully uploaded ${opportunities.length} opportunities`);
        resolve();
      } catch (error) {
        console.error('Error uploading opportunities:', error);
        reject(error);
      }
    });
  }

  private generateId(): string {
    return 'opp_' + Math.random().toString(36).substr(2, 9);
  }
}
