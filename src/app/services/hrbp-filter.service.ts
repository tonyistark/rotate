import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, combineLatest } from 'rxjs';
import { OpportunityService } from './opportunity.service';

export interface HrbpFilterOptions {
  leaders: string[];
  jobLevels: string[];
  jobFamilies: string[];
  jobProfiles: string[];
  tenureOptions: string[];
  locationOptions: string[];
  attritionResponseOptions: string[];
  performanceRatingOptions: string[];
  rotationLevelOptions: string[];
  rotationLengthOptions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HrbpFilterService {
  private readonly dataPath = '/assets/data/';
  
  constructor(private http: HttpClient, private opportunityService: OpportunityService) {}

  /**
   * Load all filter options - leaders from opportunity data, others from JSON files
   */
  getAllFilterOptions(): Observable<HrbpFilterOptions> {
    const staticRequests = {
      jobLevels: this.loadFilterData<string[]>('job-levels.json'),
      jobFamilies: this.loadFilterData<string[]>('job-families.json'),
      jobProfiles: this.loadFilterData<string[]>('job-profiles.json'),
      tenureOptions: this.loadFilterData<string[]>('tenure-options.json'),
      locationOptions: this.loadFilterData<string[]>('location-options.json'),
      attritionResponseOptions: this.loadFilterData<string[]>('attrition-response-options.json'),
      performanceRatingOptions: this.loadFilterData<string[]>('performance-rating-options.json'),
      rotationLevelOptions: this.loadFilterData<string[]>('rotation-level-options.json'),
      rotationLengthOptions: this.loadFilterData<string[]>('rotation-length-options.json')
    };

    return combineLatest([
      forkJoin(staticRequests),
      this.getLeadersFromOpportunities()
    ]).pipe(
      map(([staticOptions, leaders]) => ({
        ...staticOptions,
        leaders
      })),
      catchError(error => {
        console.error('Error loading filter options:', error);
        return of(this.getFallbackFilterOptions());
      })
    );
  }

  /**
   * Load individual filter data
   */
  private loadFilterData<T>(filename: string): Observable<T> {
    return this.http.get<T>(`${this.dataPath}${filename}`).pipe(
      catchError(error => {
        console.error(`Error loading ${filename}:`, error);
        return of([] as T);
      })
    );
  }

  /**
   * Get leaders filter options from uploaded opportunity data
   */
  getLeaders(): Observable<string[]> {
    return this.getLeadersFromOpportunities();
  }

  /**
   * Extract unique leaders from opportunity data
   */
  private getLeadersFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const leaders = new Set<string>();
        leaders.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.leader && opportunity.leader.trim()) {
            leaders.add(opportunity.leader.trim());
          }
        });
        
        return Array.from(leaders).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting leaders from opportunities:', error);
        // Fallback to static leaders if opportunity data fails
        return this.loadFilterData<string[]>('leaders.json');
      })
    );
  }

  /**
   * Get job levels filter options
   */
  getJobLevels(): Observable<string[]> {
    return this.loadFilterData<string[]>('job-levels.json');
  }

  /**
   * Get job families filter options
   */
  getJobFamilies(): Observable<string[]> {
    return this.loadFilterData<string[]>('job-families.json');
  }

  /**
   * Get job profiles filter options
   */
  getJobProfiles(): Observable<string[]> {
    return this.loadFilterData<string[]>('job-profiles.json');
  }

  /**
   * Get tenure options filter options
   */
  getTenureOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('tenure-options.json');
  }

  /**
   * Get location options filter options
   */
  getLocationOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('location-options.json');
  }

  /**
   * Get attrition response options filter options
   */
  getAttritionResponseOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('attrition-response-options.json');
  }

  /**
   * Get performance rating options filter options
   */
  getPerformanceRatingOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('performance-rating-options.json');
  }

  /**
   * Get rotation level options filter options
   */
  getRotationLevelOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('rotation-level-options.json');
  }

  /**
   * Get rotation length options filter options
   */
  getRotationLengthOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('rotation-length-options.json');
  }

  /**
   * Fallback filter options in case of loading errors
   */
  private getFallbackFilterOptions(): HrbpFilterOptions {
    return {
      leaders: ['All', 'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez'],
      jobLevels: ['All', 'Associate', 'Sr. Associate', 'Principal Associate', 'Manager', 'Sr. Manager', 'Director', 'Sr. Director', 'VP', 'Managing VP', 'Sr. VP'],
      jobFamilies: ['All', 'Engineering', 'Product Management', 'Design', 'Data Science', 'Marketing', 'Sales', 'Operations', 'Human Resources', 'Finance'],
      jobProfiles: ['All', 'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist'],
      tenureOptions: ['All', '0-1 years', '1-2 years', '2-3 years', '3-5 years', '5-7 years', '7-10 years', '10+ years'],
      locationOptions: ['All', 'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'],
      attritionResponseOptions: ['All', 'Retain', 'Replace', 'Redistribute', 'Monitor', 'No Action'],
      performanceRatingOptions: ['All', 'Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations', 'Needs Improvement'],
      rotationLevelOptions: ['All', 'Associate', 'Sr. Associate', 'Principal Associate', 'Manager', 'Sr. Manager', 'Director', 'Sr. Director', 'VP', 'Managing VP', 'Sr. VP'],
      rotationLengthOptions: ['All', '3 months', '6 months', '9 months', '12 months', '18 months', '24 months']
    };
  }

  /**
   * Validate filter value against available options
   */
  isValidFilterValue(filterType: keyof HrbpFilterOptions, value: string, options: HrbpFilterOptions): boolean {
    const filterOptions = options[filterType];
    return filterOptions.includes(value) || value === '' || value === 'All';
  }

  /**
   * Get display value for filter (handles empty string as 'All')
   */
  getDisplayValue(value: string): string {
    return value === '' ? 'All' : value;
  }

  /**
   * Get filter value for backend (handles 'All' as empty string)
   */
  getFilterValue(value: string): string {
    return value === 'All' ? '' : value;
  }
}
