import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface JobLevelsData {
  jobLevels: string[];
}

@Injectable({
  providedIn: 'root'
})
export class JobLevelsService {
  private jobLevelsSubject = new BehaviorSubject<string[]>([]);
  private jobLevelsLoaded = false;

  // Fallback job levels in case JSON loading fails
  private fallbackJobLevels: string[] = [
    'Associate',
    'Sr. Associate', 
    'Principal Associate',
    'Manager',
    'Sr. Manager',
    'Director',
    'Sr. Director',
    'VP',
    'Managing VP',
    'Sr. VP'
  ];

  constructor(private http: HttpClient) {
    this.loadJobLevels();
  }

  /**
   * Load job levels from JSON file
   */
  private loadJobLevels(): void {
    if (this.jobLevelsLoaded) {
      return;
    }

    this.http.get<JobLevelsData>('/assets/data/job-levels.json')
      .pipe(
        map(data => data.jobLevels),
        catchError(error => {
          console.warn('Failed to load job levels from JSON, using fallback:', error);
          return of(this.fallbackJobLevels);
        })
      )
      .subscribe(jobLevels => {
        this.jobLevelsSubject.next(jobLevels);
        this.jobLevelsLoaded = true;
      });
  }

  /**
   * Get job levels as Observable
   */
  getJobLevels(): Observable<string[]> {
    return this.jobLevelsSubject.asObservable();
  }

  /**
   * Get job levels synchronously (returns current cached value)
   */
  getJobLevelsSync(): string[] {
    const currentLevels = this.jobLevelsSubject.value;
    return currentLevels.length > 0 ? currentLevels : this.fallbackJobLevels;
  }

  /**
   * Check if a job level is valid
   */
  isValidJobLevel(level: string): boolean {
    const jobLevels = this.getJobLevelsSync();
    return jobLevels.includes(level);
  }

  /**
   * Get job level index (useful for sorting/ordering)
   */
  getJobLevelIndex(level: string): number {
    const jobLevels = this.getJobLevelsSync();
    return jobLevels.indexOf(level);
  }

  /**
   * Get job levels with "All" option for filters
   */
  getJobLevelsWithAll(): Observable<string[]> {
    return this.getJobLevels().pipe(
      map(levels => ['All', ...levels])
    );
  }

  /**
   * Get job levels with "All" option synchronously
   */
  getJobLevelsWithAllSync(): string[] {
    return ['All', ...this.getJobLevelsSync()];
  }
}
