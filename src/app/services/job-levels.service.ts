import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { APP_CONSTANTS } from '../shared/constants/app.constants';

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
  private fallbackJobLevels: string[] = APP_CONSTANTS.JOB_LEVELS;

  constructor(private http: HttpClient) {
    this.loadJobLevels();
  }

  /**
   * Load job levels from constants
   */
  private loadJobLevels(): void {
    if (this.jobLevelsLoaded) {
      return;
    }

    // Use APP_CONSTANTS as the primary source
    this.jobLevelsSubject.next(APP_CONSTANTS.JOB_LEVELS);
    this.jobLevelsLoaded = true;
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
