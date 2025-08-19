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
}
