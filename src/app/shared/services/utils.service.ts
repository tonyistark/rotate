import { Injectable } from '@angular/core';
import { APP_CONSTANTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Format date to localized string
   */
  formatDate(date: string | Date): string {
    if (!date) return 'Not set';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Not set';
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get performance score from rating
   */
  getPerformanceScore(rating: string): number {
    return APP_CONSTANTS.PERFORMANCE_SCORES[rating as keyof typeof APP_CONSTANTS.PERFORMANCE_SCORES] || 1;
  }

  /**
   * Get match score color based on score value
   */
  getMatchScoreColor(score: number): string {
    if (score >= APP_CONSTANTS.MATCH_SCORES.EXCELLENT) return APP_CONSTANTS.COLORS.PRIMARY;
    if (score >= APP_CONSTANTS.MATCH_SCORES.GOOD) return APP_CONSTANTS.COLORS.ACCENT;
    if (score >= APP_CONSTANTS.MATCH_SCORES.FAIR) return APP_CONSTANTS.COLORS.WARN;
    return APP_CONSTANTS.COLORS.BASIC;
  }

  /**
   * Get performance rating color
   */
  getPerformanceColor(rating: string): string {
    const normalizedRating = rating.toLowerCase();
    
    if (normalizedRating.includes('outstanding') || normalizedRating.includes('exceeds') || normalizedRating.includes('above strong')) {
      return APP_CONSTANTS.COLORS.PRIMARY;
    }
    if (normalizedRating.includes('meets') || normalizedRating.includes('good') || normalizedRating.includes('strong')) {
      return APP_CONSTANTS.COLORS.ACCENT;
    }
    if (normalizedRating.includes('below') || normalizedRating.includes('needs improvement')) {
      return APP_CONSTANTS.COLORS.WARN;
    }
    return APP_CONSTANTS.COLORS.BASIC;
  }

  /**
   * Get attrition risk color based on risk percentage
   */
  getAttritionRiskColor(risk: number): string {
    if (risk <= APP_CONSTANTS.ATTRITION_RISK.LOW) return APP_CONSTANTS.COLORS.PRIMARY;
    if (risk <= APP_CONSTANTS.ATTRITION_RISK.MEDIUM) return APP_CONSTANTS.COLORS.ACCENT;
    return APP_CONSTANTS.COLORS.WARN;
  }

  /**
   * Get match score label
   */
  getMatchScoreLabel(score: number): string {
    if (score >= APP_CONSTANTS.MATCH_SCORES.EXCELLENT) return 'Excellent';
    if (score >= APP_CONSTANTS.MATCH_SCORES.GOOD) return 'Good';
    if (score >= APP_CONSTANTS.MATCH_SCORES.FAIR) return 'Fair';
    return 'Poor';
  }

  /**
   * Get attrition risk class based on risk value
   */
  getAttritionRiskClass(risk: number): string {
    if (risk <= 15) return 'low-risk';
    if (risk <= 30) return 'medium-risk';
    return 'high-risk';
  }

  /**
   * Get level color for opportunity chips
   */
  getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'senior':
      case 'lead':
        return APP_CONSTANTS.COLORS.PRIMARY;
      case 'mid':
      case 'intermediate':
        return APP_CONSTANTS.COLORS.ACCENT;
      case 'junior':
      case 'entry':
        return APP_CONSTANTS.COLORS.WARN;
      default:
        return APP_CONSTANTS.COLORS.BASIC;
    }
  }

  /**
   * Calculate interest alignment between employee and opportunity
   */
  calculateInterestAlignment(employeeInterests: string[], opportunityText: string): number {
    const alignmentScore = employeeInterests.some(interest => 
      opportunityText.toLowerCase().includes(interest.toLowerCase())
    ) ? 1 : 0.5;
    
    return alignmentScore;
  }

  /**
   * Extract filter options from opportunities
   */
  extractUniqueValues<T>(items: T[], property: keyof T): string[] {
    const values = items.map(item => String(item[property])).filter(Boolean);
    return ['All', ...new Set(values)];
  }

  /**
   * Get TDI zone CSS class
   */
  getTdiZoneClass(zone: string): string {
    if (!zone) return '';
    const lowerZone = zone.toLowerCase();
    if (lowerZone.includes('invest')) return 'invest-zone';
    if (lowerZone.includes('develop')) return 'develop-zone';
    if (lowerZone.includes('maintain')) return 'maintain-zone';
    return '';
  }

  /**
   * Get rating CSS class
   */
  getRatingClass(rating: string): string {
    if (!rating) return '';
    const lowerRating = rating.toLowerCase();
    if (lowerRating.includes('strong')) return 'strong-rating';
    if (lowerRating.includes('exceptional')) return 'exceptional-rating';
    if (lowerRating.includes('outstanding')) return 'outstanding-rating';
    return '';
  }

  /**
   * Check if filter value matches (handles 'All' case)
   */
  matchesFilter(value: any, filterValue: string): boolean {
    return !filterValue || filterValue === APP_CONSTANTS.FILTER_ALL || String(value) === filterValue;
  }

  /**
   * Normalize search term for comparison
   */
  normalizeSearchTerm(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * Check if text matches search term
   */
  matchesSearchTerm(text: string, searchTerm: string): boolean {
    if (!searchTerm) return true;
    return this.normalizeSearchTerm(text).includes(this.normalizeSearchTerm(searchTerm));
  }
}
