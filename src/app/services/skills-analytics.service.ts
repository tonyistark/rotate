import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Employee, Opportunity } from '../models/employee.model';

export interface SkillDemand {
  skill: string;
  opportunityCount: number;
  opportunities: string[];
  percentage: number;
}

export interface SkillSupply {
  skill: string;
  employeeCount: number;
  employees: string[];
  percentage: number;
}

export interface SkillGap {
  skill: string;
  demand: number;
  supply: number;
  gap: number;
  gapPercentage: number;
  status: 'surplus' | 'balanced' | 'shortage';
}

export interface SkillsAnalytics {
  skillDemands: SkillDemand[];
  skillSupplies: SkillSupply[];
  skillGaps: SkillGap[];
  totalOpportunities: number;
  totalEmployees: number;
  totalUniqueSkills: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SkillsAnalyticsService {
  private analyticsSubject = new BehaviorSubject<SkillsAnalytics>({
    skillDemands: [],
    skillSupplies: [],
    skillGaps: [],
    totalOpportunities: 0,
    totalEmployees: 0,
    totalUniqueSkills: 0,
    lastUpdated: new Date()
  });

  constructor() {}

  /**
   * Get the current skills analytics observable
   */
  getAnalytics(): Observable<SkillsAnalytics> {
    return this.analyticsSubject.asObservable();
  }

  /**
   * Update analytics based on current opportunities and employees
   */
  updateAnalytics(opportunities: Opportunity[], employees: Employee[]): void {
    const analytics = this.calculateAnalytics(opportunities, employees);
    this.analyticsSubject.next(analytics);
  }

  /**
   * Calculate comprehensive skills analytics
   */
  private calculateAnalytics(opportunities: Opportunity[], employees: Employee[]): SkillsAnalytics {
    const skillDemands = this.calculateSkillDemands(opportunities);
    const skillSupplies = this.calculateSkillSupplies(employees);
    const skillGaps = this.calculateSkillGaps(skillDemands, skillSupplies);

    // Get all unique skills from both demand and supply
    const allSkills = new Set([
      ...skillDemands.map(d => d.skill),
      ...skillSupplies.map(s => s.skill)
    ]);

    return {
      skillDemands: skillDemands.sort((a, b) => b.opportunityCount - a.opportunityCount),
      skillSupplies: skillSupplies.sort((a, b) => b.employeeCount - a.employeeCount),
      skillGaps: skillGaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)),
      totalOpportunities: opportunities.length,
      totalEmployees: employees.length,
      totalUniqueSkills: allSkills.size,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate skill demand metrics from opportunities
   */
  private calculateSkillDemands(opportunities: Opportunity[]): SkillDemand[] {
    const skillMap = new Map<string, { count: number; opportunities: string[] }>();

    opportunities.forEach(opportunity => {
      if (opportunity.requiredSkills) {
        opportunity.requiredSkills.forEach((skill: string) => {
          if (!skillMap.has(skill)) {
            skillMap.set(skill, { count: 0, opportunities: [] });
          }
          const skillData = skillMap.get(skill)!;
          skillData.count++;
          skillData.opportunities.push(opportunity.title);
        });
      }
    });

    const totalOpportunities = opportunities.length;
    return Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      opportunityCount: data.count,
      opportunities: data.opportunities,
      percentage: totalOpportunities > 0 ? Math.round((data.count / totalOpportunities) * 100) : 0
    }));
  }

  /**
   * Calculate skill supply metrics from employees
   */
  private calculateSkillSupplies(employees: Employee[]): SkillSupply[] {
    const skillMap = new Map<string, { count: number; employees: string[] }>();

    employees.forEach(employee => {
      const allSkills = [
        ...(employee.skills || []),
        ...(employee.competencyStrengths || []),
        ...(employee.skillsetExperience || [])
      ];

      allSkills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { count: 0, employees: [] });
        }
        const skillData = skillMap.get(skill)!;
        skillData.count++;
        skillData.employees.push(employee.name);
      });
    });

    const totalEmployees = employees.length;
    return Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      employeeCount: data.count,
      employees: data.employees,
      percentage: totalEmployees > 0 ? Math.round((data.count / totalEmployees) * 100) : 0
    }));
  }

  /**
   * Calculate skill gaps by comparing demand vs supply
   */
  private calculateSkillGaps(demands: SkillDemand[], supplies: SkillSupply[]): SkillGap[] {
    const demandMap = new Map(demands.map(d => [d.skill, d.opportunityCount]));
    const supplyMap = new Map(supplies.map(s => [s.skill, s.employeeCount]));
    
    // Get all unique skills
    const allSkills = new Set([...demandMap.keys(), ...supplyMap.keys()]);

    return Array.from(allSkills).map(skill => {
      const demand = demandMap.get(skill) || 0;
      const supply = supplyMap.get(skill) || 0;
      const gap = supply - demand;
      
      let status: 'surplus' | 'balanced' | 'shortage';
      if (gap > 0) {
        status = 'surplus';
      } else if (gap === 0) {
        status = 'balanced';
      } else {
        status = 'shortage';
      }

      const gapPercentage = demand > 0 ? Math.round((Math.abs(gap) / demand) * 100) : 0;

      return {
        skill,
        demand,
        supply,
        gap,
        gapPercentage,
        status
      };
    });
  }

  /**
   * Get skills with highest demand
   */
  getTopDemandSkills(limit: number = 10): Observable<SkillDemand[]> {
    return this.analyticsSubject.pipe(
      map(analytics => analytics.skillDemands.slice(0, limit))
    );
  }

  /**
   * Get skills with highest supply
   */
  getTopSupplySkills(limit: number = 10): Observable<SkillSupply[]> {
    return this.analyticsSubject.pipe(
      map(analytics => analytics.skillSupplies.slice(0, limit))
    );
  }

  /**
   * Get skills with biggest gaps (shortages)
   */
  getTopSkillShortages(limit: number = 10): Observable<SkillGap[]> {
    return this.analyticsSubject.pipe(
      map(analytics => 
        analytics.skillGaps
          .filter(gap => gap.status === 'shortage')
          .slice(0, limit)
      )
    );
  }

  /**
   * Get skills with biggest surpluses
   */
  getTopSkillSurpluses(limit: number = 10): Observable<SkillGap[]> {
    return this.analyticsSubject.pipe(
      map(analytics => 
        analytics.skillGaps
          .filter(gap => gap.status === 'surplus')
          .slice(0, limit)
      )
    );
  }
}
