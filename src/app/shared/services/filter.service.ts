import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { Opportunity } from '../../models/employee.model';

export interface FilterState {
  searchTerm: string;
  selectedLeader: string;
  selectedJobLevel: string;
  selectedJobFamily: string;
  selectedJobProfile: string;
  selectedPlIc: string;
  selectedTenure: string;
  selectedLocation: string;
  selectedDayZero: string;
  selectedLossImpact: string;
  selectedAttritionRisk: string;
  selectedAttritionResponse: string;
  selectedPerformanceRating: string;
  selectedRotationLevel: string;
  selectedRotationLength: string;
  selectedReportsTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  constructor(private utilsService: UtilsService) {}

  /**
   * Create initial filter state
   */
  createInitialFilterState(): FilterState {
    return {
      searchTerm: '',
      selectedLeader: '',
      selectedJobLevel: '',
      selectedJobFamily: '',
      selectedJobProfile: '',
      selectedPlIc: '',
      selectedTenure: '',
      selectedLocation: '',
      selectedDayZero: '',
      selectedLossImpact: '',
      selectedAttritionRisk: '',
      selectedAttritionResponse: '',
      selectedPerformanceRating: '',
      selectedRotationLevel: '',
      selectedRotationLength: '',
      selectedReportsTo: ''
    };
  }

  /**
   * Apply filters to opportunities array
   */
  applyFilters(opportunities: Opportunity[], filterState: FilterState): Opportunity[] {
    return opportunities.filter(opportunity => {
      // Search term filter
      const matchesSearch = this.matchesSearchCriteria(opportunity, filterState.searchTerm);
      
      return matchesSearch && this.matchesAllFilters(opportunity, filterState);
    });
  }

  /**
   * Check if opportunity matches search criteria
   */
  private matchesSearchCriteria(opportunity: Opportunity, searchTerm: string): boolean {
    if (!searchTerm) return true;
    
    const searchFields = [
      opportunity.title,
      opportunity.description,
      opportunity.department
    ];
    
    return searchFields.some(field => 
      this.utilsService.matchesSearchTerm(field, searchTerm)
    );
  }

  /**
   * Check if opportunity matches all filter criteria
   */
  private matchesAllFilters(opportunity: Opportunity, filterState: FilterState): boolean {
    const filterChecks = [
      this.utilsService.matchesFilter(opportunity.leader, filterState.selectedLeader),
      this.utilsService.matchesFilter(opportunity.level, filterState.selectedJobLevel),
      this.utilsService.matchesFilter(opportunity.jobFamily, filterState.selectedJobFamily),
      this.utilsService.matchesFilter(opportunity.jobProfile, filterState.selectedJobProfile),
      this.utilsService.matchesFilter(opportunity.plIc, filterState.selectedPlIc),
      this.utilsService.matchesFilter(opportunity.tenure, filterState.selectedTenure),
      this.utilsService.matchesFilter(opportunity.location, filterState.selectedLocation),
      this.utilsService.matchesFilter(String(opportunity.dayZero), filterState.selectedDayZero),
      this.utilsService.matchesFilter(opportunity.lossImpact, filterState.selectedLossImpact),
      this.utilsService.matchesFilter(opportunity.attritionRisk, filterState.selectedAttritionRisk),
      this.utilsService.matchesFilter(opportunity.attritionResponse, filterState.selectedAttritionResponse),
      this.utilsService.matchesFilter(opportunity.rotationLevel, filterState.selectedRotationLevel),
      this.utilsService.matchesFilter(opportunity.rotationLength, filterState.selectedRotationLength)
    ];

    return filterChecks.every(check => check);
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(filterState: FilterState): boolean {
    const filterValues = Object.values(filterState);
    return filterValues.some(value => Boolean(value));
  }

  /**
   * Clear all filters
   */
  clearAllFilters(filterState: FilterState): FilterState {
    return this.createInitialFilterState();
  }

  /**
   * Clear specific filter
   */
  clearFilter(filterState: FilterState, filterType: keyof FilterState): FilterState {
    return {
      ...filterState,
      [filterType]: ''
    };
  }

  /**
   * Extract filter options from opportunities
   */
  extractFilterOptions(opportunities: Opportunity[]) {
    return {
      leaders: this.utilsService.extractUniqueValues(opportunities, 'leader'),
      jobLevels: this.utilsService.extractUniqueValues(opportunities, 'level'),
      jobFamilies: this.utilsService.extractUniqueValues(opportunities, 'jobFamily'),
      jobProfiles: this.utilsService.extractUniqueValues(opportunities, 'jobProfile'),
      tenureOptions: this.utilsService.extractUniqueValues(opportunities, 'tenure'),
      locationOptions: this.utilsService.extractUniqueValues(opportunities, 'location'),
      attritionResponseOptions: this.utilsService.extractUniqueValues(opportunities, 'attritionResponse'),
      performanceRatingOptions: this.extractPerformanceRatings(opportunities),
      rotationLevelOptions: this.utilsService.extractUniqueValues(opportunities, 'rotationLevel'),
      rotationLengthOptions: this.utilsService.extractUniqueValues(opportunities, 'rotationLength')
    };
  }

  /**
   * Extract performance ratings from opportunities (flattened array)
   */
  private extractPerformanceRatings(opportunities: Opportunity[]): string[] {
    const ratings = opportunities.flatMap(opp => opp.previousPerformanceRatings || []);
    return ['All', ...new Set(ratings)];
  }
}
