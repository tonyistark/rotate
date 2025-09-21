import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, combineLatest } from 'rxjs';
import { OpportunityService } from './opportunity.service';
import { JobLevelsService } from './job-levels.service';

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
  
  constructor(
    private http: HttpClient, 
    private opportunityService: OpportunityService,
    private jobLevelsService: JobLevelsService
  ) {}

  /**
   * Load all filter options - most from opportunity data, performance ratings from JSON files
   */
  getAllFilterOptions(): Observable<HrbpFilterOptions> {
    const staticRequests = {
      performanceRatingOptions: this.loadFilterData<string[]>('performance-rating-options.json')
    };

    return combineLatest([
      forkJoin(staticRequests),
      this.getLeadersFromOpportunities(),
      this.jobLevelsService.getJobLevelsWithAll(),
      this.getJobFamiliesFromOpportunities(),
      this.getJobProfilesFromOpportunities(),
      this.getTenureOptionsFromOpportunities(),
      this.getLocationOptionsFromOpportunities(),
      this.getAttritionResponseOptionsFromOpportunities(),
      this.getRotationLevelOptionsFromOpportunities(),
      this.getRotationLengthOptionsFromOpportunities()
    ]).pipe(
      map(([staticOptions, leaders, jobLevels, jobFamilies, jobProfiles, tenureOptions, locationOptions, attritionResponseOptions, rotationLevelOptions, rotationLengthOptions]) => ({
        ...staticOptions,
        leaders,
        jobLevels,
        jobFamilies,
        jobProfiles,
        tenureOptions,
        locationOptions,
        attritionResponseOptions,
        rotationLevelOptions,
        rotationLengthOptions
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
   * Get job levels filter options from JobLevelsService
   */
  getJobLevels(): Observable<string[]> {
    return this.jobLevelsService.getJobLevelsWithAll();
  }

  /**
   * Extract unique job levels from opportunity data
   */
  private getJobLevelsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const jobLevels = new Set<string>();
        jobLevels.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.jobLevel && opportunity.jobLevel.trim()) {
            jobLevels.add(opportunity.jobLevel.trim());
          }
        });
        
        return Array.from(jobLevels).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting job levels from opportunities:', error);
        // Fallback to static job levels if opportunity data fails
        return this.loadFilterData<string[]>('job-levels.json');
      })
    );
  }

  /**
   * Get job families filter options from uploaded opportunity data
   */
  getJobFamilies(): Observable<string[]> {
    return this.getJobFamiliesFromOpportunities();
  }

  /**
   * Extract unique job families from opportunity data
   */
  private getJobFamiliesFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const jobFamilies = new Set<string>();
        jobFamilies.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.jobFamily && opportunity.jobFamily.trim()) {
            jobFamilies.add(opportunity.jobFamily.trim());
          }
        });
        
        return Array.from(jobFamilies).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting job families from opportunities:', error);
        // Fallback to static job families if opportunity data fails
        return this.loadFilterData<string[]>('job-families.json');
      })
    );
  }

  /**
   * Get job profiles filter options from uploaded opportunity data
   */
  getJobProfiles(): Observable<string[]> {
    return this.getJobProfilesFromOpportunities();
  }

  /**
   * Extract unique job profiles from opportunity data
   */
  private getJobProfilesFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const jobProfiles = new Set<string>();
        jobProfiles.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.jobProfile && opportunity.jobProfile.trim()) {
            jobProfiles.add(opportunity.jobProfile.trim());
          }
        });
        
        return Array.from(jobProfiles).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting job profiles from opportunities:', error);
        // Fallback to static job profiles if opportunity data fails
        return this.loadFilterData<string[]>('job-profiles.json');
      })
    );
  }

  /**
   * Get tenure options filter options from uploaded opportunity data
   */
  getTenureOptions(): Observable<string[]> {
    return this.getTenureOptionsFromOpportunities();
  }

  /**
   * Extract unique tenure options from opportunity data
   */
  private getTenureOptionsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const tenureOptions = new Set<string>();
        tenureOptions.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.tenure && opportunity.tenure.trim()) {
            tenureOptions.add(opportunity.tenure.trim());
          }
        });
        
        return Array.from(tenureOptions).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting tenure options from opportunities:', error);
        // Fallback to static tenure options if opportunity data fails
        return this.loadFilterData<string[]>('tenure-options.json');
      })
    );
  }

  /**
   * Get location options filter options from uploaded opportunity data
   */
  getLocationOptions(): Observable<string[]> {
    return this.getLocationOptionsFromOpportunities();
  }

  /**
   * Extract unique location options from opportunity data
   */
  private getLocationOptionsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const locationOptions = new Set<string>();
        locationOptions.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.location && opportunity.location.trim()) {
            locationOptions.add(opportunity.location.trim());
          }
        });
        
        return Array.from(locationOptions).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting location options from opportunities:', error);
        // Fallback to static location options if opportunity data fails
        return this.loadFilterData<string[]>('location-options.json');
      })
    );
  }

  /**
   * Get attrition response options filter options from uploaded opportunity data
   */
  getAttritionResponseOptions(): Observable<string[]> {
    return this.getAttritionResponseOptionsFromOpportunities();
  }

  /**
   * Extract unique attrition response options from opportunity data
   */
  private getAttritionResponseOptionsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const attritionResponseOptions = new Set<string>();
        attritionResponseOptions.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.attritionResponse && opportunity.attritionResponse.trim()) {
            attritionResponseOptions.add(opportunity.attritionResponse.trim());
          }
        });
        
        return Array.from(attritionResponseOptions).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting attrition response options from opportunities:', error);
        // Fallback to static attrition response options if opportunity data fails
        return this.loadFilterData<string[]>('attrition-response-options.json');
      })
    );
  }

  /**
   * Get performance rating options filter options
   */
  getPerformanceRatingOptions(): Observable<string[]> {
    return this.loadFilterData<string[]>('performance-rating-options.json');
  }

  /**
   * Get rotation level options filter options from uploaded opportunity data
   */
  getRotationLevelOptions(): Observable<string[]> {
    return this.getRotationLevelOptionsFromOpportunities();
  }

  /**
   * Extract unique rotation level options from opportunity data
   */
  private getRotationLevelOptionsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const rotationLevelOptions = new Set<string>();
        rotationLevelOptions.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.rotationLevel && opportunity.rotationLevel.trim()) {
            rotationLevelOptions.add(opportunity.rotationLevel.trim());
          }
        });
        
        return Array.from(rotationLevelOptions).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting rotation level options from opportunities:', error);
        // Fallback to static rotation level options if opportunity data fails
        return this.loadFilterData<string[]>('rotation-level-options.json');
      })
    );
  }

  /**
   * Get rotation length options filter options from uploaded opportunity data
   */
  getRotationLengthOptions(): Observable<string[]> {
    return this.getRotationLengthOptionsFromOpportunities();
  }

  /**
   * Extract unique rotation length options from opportunity data
   */
  private getRotationLengthOptionsFromOpportunities(): Observable<string[]> {
    return this.opportunityService.getOpportunities().pipe(
      map(opportunities => {
        const rotationLengthOptions = new Set<string>();
        rotationLengthOptions.add('All'); // Always include 'All' option
        
        opportunities.forEach(opportunity => {
          if (opportunity.rotationLength && opportunity.rotationLength.trim()) {
            rotationLengthOptions.add(opportunity.rotationLength.trim());
          }
        });
        
        return Array.from(rotationLengthOptions).sort((a, b) => {
          // Keep 'All' at the top
          if (a === 'All') return -1;
          if (b === 'All') return 1;
          return a.localeCompare(b);
        });
      }),
      catchError(error => {
        console.error('Error extracting rotation length options from opportunities:', error);
        // Fallback to static rotation length options if opportunity data fails
        return this.loadFilterData<string[]>('rotation-length-options.json');
      })
    );
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
