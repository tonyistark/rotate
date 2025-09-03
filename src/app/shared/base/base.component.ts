import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { UtilsService } from '../services/utils.service';
import { FilterService } from '../services/filter.service';

@Component({
  template: ''
})
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  constructor(
    protected utilsService: UtilsService,
    protected filterService: FilterService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Common date formatting
   */
  formatDate(date: string | Date): string {
    return this.utilsService.formatDate(date);
  }

  /**
   * Common color utilities
   */
  getMatchScoreColor(score: number): string {
    return this.utilsService.getMatchScoreColor(score);
  }

  getPerformanceColor(rating: string): string {
    return this.utilsService.getPerformanceColor(rating);
  }

  getAttritionRiskColor(risk: number): string {
    return this.utilsService.getAttritionRiskColor(risk);
  }

  getLevelColor(level: string): string {
    return this.utilsService.getLevelColor(level);
  }

  /**
   * Common score utilities
   */
  getMatchScoreLabel(score: number): string {
    return this.utilsService.getMatchScoreLabel(score);
  }

  getAttritionRiskClass(risk: number): string {
    return this.utilsService.getAttritionRiskClass(risk);
  }
}
