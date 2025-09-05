import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, combineLatest } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkillsAnalyticsService, SkillsAnalytics, SkillDemand, SkillSupply, SkillGap } from '../../services/skills-analytics.service';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

// Interfaces
interface Opportunity {
  id: string;
  title: string;
  department: string;
  location: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
}

@Component({
  selector: 'app-skills-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="skills-dashboard">
      <!-- Dashboard Header with KPI Cards -->
      <div class="dashboard-header">
        <h2 class="dashboard-title">
          <mat-icon>analytics</mat-icon>
          Skills Analytics Dashboard
        </h2>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="!analytics" class="loading-state">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading skills analytics...</p>
      </div>
      
      <!-- Dashboard Content -->
      <div *ngIf="analytics" class="dashboard-grid">
        
        <!-- Skills Demand Chart -->
        <mat-card class="chart-card demand-chart">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar demand">
              <mat-icon>trending_up</mat-icon>
            </div>
            <mat-card-title>Top Skills in Demand</mat-card-title>
            <mat-card-subtitle>Most requested skills across opportunities</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="horizontal-chart">
              <div *ngFor="let demand of getDisplayedDemands(); let i = index" class="chart-bar-item">
                <div class="skill-info">
                  <span class="skill-name">{{demand.skill}}</span>
                  <span class="skill-count">{{demand.opportunityCount}}</span>
                </div>
                <div class="bar-container">
                  <div class="bar demand-bar" 
                       [style.width.%]="getBarWidth(demand.opportunityCount, getMaxDemand())"
                       [attr.data-value]="demand.opportunityCount">
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Skills Supply Chart -->
        <mat-card class="chart-card supply-chart">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar supply">
              <mat-icon>people</mat-icon>
            </div>
            <mat-card-title>Employee Skill Distribution</mat-card-title>
            <mat-card-subtitle>Most common skills among employees</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="horizontal-chart">
              <div *ngFor="let supply of getDisplayedSupplies(); let i = index" class="chart-bar-item">
                <div class="skill-info">
                  <span class="skill-name">{{supply.skill}}</span>
                  <span class="skill-count">{{supply.employeeCount}}</span>
                </div>
                <div class="bar-container">
                  <div class="bar supply-bar" 
                       [style.width.%]="getBarWidth(supply.employeeCount, getMaxSupply())"
                       [attr.data-value]="supply.employeeCount">
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Skill Gap Analysis with Visual Indicators -->
        <mat-card class="chart-card gap-analysis full-width">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar gaps">
              <mat-icon>analytics</mat-icon>
            </div>
            <mat-card-title>Skill Gap Analysis</mat-card-title>
            <mat-card-subtitle>Supply vs Demand comparison</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <!-- Gap Summary Donut -->
            <div class="gap-summary-visual">
              <div class="donut-chart">
                <div class="donut-segment shortage" 
                     [style.--percentage]="getShortagePercentage() + '%'">
                </div>
                <div class="donut-center">
                  <div class="donut-value">{{getSkillShortages()}}</div>
                  <div class="donut-label">Shortages</div>
                </div>
              </div>
              
              <div class="gap-legend">
                <div class="legend-item shortage">
                  <div class="legend-color"></div>
                  <span>{{getSkillShortages()}} Skills in Shortage</span>
                </div>
                <div class="legend-item balanced">
                  <div class="legend-color"></div>
                  <span>{{getBalancedSkills()}} Balanced Skills</span>
                </div>
                <div class="legend-item surplus">
                  <div class="legend-color"></div>
                  <span>{{getSurplusSkills()}} Skills in Surplus</span>
                </div>
              </div>
            </div>
            
            <!-- Critical Gaps List -->
            <div class="critical-gaps">
              <h4>Critical Skill Gaps</h4>
              <div class="gap-items">
                <div *ngFor="let gap of getCriticalGaps(); let i = index" class="gap-item">
                  <div class="gap-skill">
                    <mat-icon [class]="getGapIconClass(gap.status)">{{getGapStatusIcon(gap.status)}}</mat-icon>
                    <span class="skill-name">{{gap.skill}}</span>
                  </div>
                  <div class="gap-metrics">
                    <div class="metric demand">
                      <span class="label">Demand:</span>
                      <span class="value">{{gap.demand}}</span>
                    </div>
                    <div class="metric supply">
                      <span class="label">Supply:</span>
                      <span class="value">{{gap.supply}}</span>
                    </div>
                    <div class="metric gap" [class]="getGapStatusClass(gap.status)">
                      <span class="label">Gap:</span>
                      <span class="value">{{getGapText(gap)}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
      </div>
    </div>
  `,
  styleUrls: ['./skills-inventory.component.scss']
})

export class SkillsInventoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  analytics: SkillsAnalytics | null = null;
  selectedTab = 0;
  opportunities: Opportunity[] = [];
  employees: Employee[] = [];
  
  // Display limits
  displayLimits = {
    demand: 15,
    supply: 15,
    gaps: 15
  };

  constructor(
    private skillsAnalyticsService: SkillsAnalyticsService,
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    // Load opportunities and employees, then calculate analytics
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.opportunities = opportunities;
        this.calculateAnalytics();
      });

    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.calculateAnalytics();
      });
  }

  private calculateAnalytics(): void {
    if (this.opportunities.length === 0 || this.employees.length === 0) return;

    // Calculate skill demands from opportunities
    const skillDemandMap = new Map<string, number>();
    this.opportunities.forEach(opp => {
      [...opp.requiredSkills, ...opp.preferredSkills].forEach(skill => {
        skillDemandMap.set(skill, (skillDemandMap.get(skill) || 0) + 1);
      });
    });

    // Calculate skill supplies from employees
    const skillSupplyMap = new Map<string, number>();
    this.employees.forEach(emp => {
      emp.skills.forEach(skill => {
        skillSupplyMap.set(skill, (skillSupplyMap.get(skill) || 0) + 1);
      });
    });

    // Create skill demands array
    const skillDemands = Array.from(skillDemandMap.entries())
      .map(([skill, count]) => ({ 
        skill, 
        opportunityCount: count,
        opportunities: [],
        percentage: (count / this.opportunities.length) * 100
      }))
      .sort((a, b) => b.opportunityCount - a.opportunityCount);

    // Create skill supplies array
    const skillSupplies = Array.from(skillSupplyMap.entries())
      .map(([skill, count]) => ({ 
        skill, 
        employeeCount: count,
        employees: [],
        percentage: (count / this.employees.length) * 100
      }))
      .sort((a, b) => b.employeeCount - a.employeeCount);

    // Calculate skill gaps
    const skillGaps: any[] = [];
    
    // Get all unique skills from both demand and supply
    const allSkills = new Set([...skillDemandMap.keys(), ...skillSupplyMap.keys()]);
    
    allSkills.forEach(skill => {
      const demand = skillDemandMap.get(skill) || 0;
      const supply = skillSupplyMap.get(skill) || 0;
      const gap = demand - supply;
      
      let status: string;
      if (gap > 0) {
        status = 'shortage';
      } else if (gap < 0) {
        status = 'surplus';
      } else {
        status = 'balanced';
      }
      
      skillGaps.push({
        skill,
        demand,
        supply,
        gap: Math.abs(gap),
        status,
        severity: Math.abs(gap) > 3 ? 'critical' : Math.abs(gap) > 1 ? 'moderate' : 'low'
      });
    });

    // Sort gaps by severity
    skillGaps.sort((a, b) => b.gap - a.gap);

    // Create analytics object
    this.analytics = {
      totalUniqueSkills: new Set([...skillDemandMap.keys(), ...skillSupplyMap.keys()]).size,
      totalOpportunities: this.opportunities.length,
      totalEmployees: this.employees.length,
      skillDemands,
      skillSupplies,
      skillGaps,
      lastUpdated: new Date()
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get displayed skill demands based on current limit
   */
  getDisplayedDemands() {
    if (!this.analytics?.skillDemands) return [];
    return this.analytics.skillDemands.slice(0, this.displayLimits.demand);
  }

  getDisplayedSupplies() {
    if (!this.analytics?.skillSupplies) return [];
    return this.analytics.skillSupplies.slice(0, this.displayLimits.supply);
  }

  getDisplayedGaps() {
    if (!this.analytics?.skillGaps) return [];
    return this.analytics.skillGaps.slice(0, this.displayLimits.gaps);
  }

  getCriticalGaps() {
    if (!this.analytics?.skillGaps) return [];
    return this.analytics.skillGaps
      .filter(gap => gap.status === 'shortage')
      .slice(0, 6);
  }

  getMaxDemand(): number {
    if (!this.analytics?.skillDemands?.length) return 1;
    return Math.max(...this.analytics.skillDemands.map(d => d.opportunityCount));
  }

  getMaxSupply(): number {
    if (!this.analytics?.skillSupplies?.length) return 1;
    return Math.max(...this.analytics.skillSupplies.map(s => s.employeeCount));
  }

  getBarWidth(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  getSkillShortages(): number {
    if (!this.analytics?.skillGaps) return 0;
    return this.analytics.skillGaps.filter(gap => gap.status === 'shortage').length;
  }

  getBalancedSkills(): number {
    if (!this.analytics?.skillGaps) return 0;
    return this.analytics.skillGaps.filter(gap => gap.status === 'balanced').length;
  }

  getSurplusSkills(): number {
    if (!this.analytics?.skillGaps) return 0;
    return this.analytics.skillGaps.filter(gap => gap.status === 'surplus').length;
  }

  getShortagePercentage(): number {
    if (!this.analytics?.skillGaps?.length) return 0;
    const shortages = this.getSkillShortages();
    return (shortages / this.analytics.skillGaps.length) * 100;
  }

  getGapStatusIcon(status: string): string {
    switch (status) {
      case 'shortage': return 'trending_down';
      case 'surplus': return 'trending_up';
      case 'balanced': return 'trending_flat';
      default: return 'help';
    }
  }

  getGapIconClass(status: string): string {
    return `gap-icon ${status}`;
  }

  getGapStatusClass(status: string): string {
    return `gap-status ${status}`;
  }

  /**
   * Get formatted gap text
   */
  getGapText(gap: SkillGap): string {
    if (gap.status === 'balanced') {
      return 'Balanced';
    } else if (gap.status === 'shortage') {
      return `${Math.abs(gap.gap)} short`;
    } else {
      return `${gap.gap} surplus`;
    }
  }


  /**
   * Format last updated time
   */
  getFormattedLastUpdated(): string {
    if (!this.analytics?.lastUpdated) return '';
    
    const now = new Date();
    const updated = new Date(this.analytics.lastUpdated);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
  }

  getProgressWidth(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  hasMore(type: string): boolean {
    if (!this.analytics) return false;
    
    switch (type) {
      case 'demand':
        return this.analytics.skillDemands.length > this.displayLimits.demand;
      case 'supply':
        return this.analytics.skillSupplies.length > this.displayLimits.supply;
      case 'gaps':
        return this.analytics.skillGaps.length > this.displayLimits.gaps;
      default:
        return false;
    }
  }

  loadMore(type: string): void {
    switch (type) {
      case 'demand':
        this.displayLimits.demand += 5;
        break;
      case 'supply':
        this.displayLimits.supply += 5;
        break;
      case 'gaps':
        this.displayLimits.gaps += 5;
        break;
    }
  }
}
