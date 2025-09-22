import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { Opportunity, Employee, Match } from '../models/employee.model';
import { MatchingService } from './matching.service';

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  constructor(private indexedDb: IndexedDbService, private matchingService: MatchingService) {}

  async exportEmployeesCSV(): Promise<string> {
    const employees: any[] = await this.indexedDb.getAllEmployees();
    const headers = [
      'EID','Full Name','Email','Job Level','Job Family','Years Experience','Recent Year End Performance','Technical SkillSet','Interests','Career Goals','Availability','Time in Role','Length of Service','Promotion Forecast','Retention Risk','TDI Zone'
    ];

    const rows = employees.map(e => [
      e.eid ?? e.id ?? '',
      e.fullName ?? e.name ?? '',
      e.email ?? '',
      e.jobLevel ?? e.level ?? '',
      e.jobFamily ?? e.department ?? '',
      e.yearsExperience ?? '',
      e.myRating ?? e.yeRating ?? e.performanceRating ?? '',
      (e.technicalSkillSet || e.skills || []).join(','),
      (e.interests || []).join(','),
      (e.careerGoals || []).join(','),
      e.availability ?? '',
      e.timeInRole ?? '',
      e.lengthOfService ?? '',
      e.promotionForecast ?? '',
      e.retentionRisk ?? '',
      e.tdiZone ?? ''
    ]);

    return this.buildCsv([headers, ...rows]);
  }

  async exportOpportunitiesCSV(): Promise<string> {
    const opportunities: Opportunity[] = await this.indexedDb.getAllOpportunities();
    const headers = [
      'id','title','department','description','requiredSkills','preferredSkills','timeCommitment','duration','learningOutcomes','mentorAvailable','remote','level','applicationDeadline','startDate','submittedBy','leader','jobLevel','jobFamily','jobProfile','plIc','tenure','location','dayZero','lossImpact','attritionRisk','attritionResponse','previousPerformanceRatings','rotationLevel','rotationLength'
    ];

    const rows = opportunities.map(o => [
      o.id,
      o.title,
      o.department,
      o.description,
      (o.requiredSkills || []).join(','),
      (o.preferredSkills || []).join(','),
      o.timeCommitment,
      o.duration,
      (o.learningOutcomes || []).join(','),
      String(o.mentorAvailable),
      String(o.remote),
      o.level,
      o.applicationDeadline,
      o.startDate,
      (o as any).submittedBy || '',
      (o as any).leader || '',
      (o as any).jobLevel || '',
      (o as any).jobFamily || '',
      (o as any).jobProfile || '',
      (o as any).plIc || '',
      (o as any).tenure || '',
      (o as any).location || '',
      String((o as any).dayZero ?? false),
      (o as any).lossImpact || '',
      (o as any).attritionRisk || '',
      (o as any).attritionResponse || '',
      ((o as any).previousPerformanceRatings || []).join(','),
      (o as any).rotationLevel || '',
      (o as any).rotationLength || ''
    ]);

    return this.buildCsv([headers, ...rows]);
  }

  async exportMatchesCSV(opportunityId?: string): Promise<string> {
    let matches = await this.indexedDb.getAllMatches();
    // If no persisted matches, compute on the fly (top 5 per employee)
    if (!matches || matches.length === 0) {
      const employees: any[] = await this.indexedDb.getAllEmployees();
      const opportunities: Opportunity[] = await this.indexedDb.getAllOpportunities();
      const computed: Array<{ id: string; employeeId: string; opportunityId: string; score: number; matchReasons: string[]; skillGaps: string[] }> = [];
      for (const emp of employees) {
        const employee: Employee = this.mapComprehensiveToEmployee(emp);
        const matchList: Match[] = this.matchingService.calculateMatches(employee, opportunities);
        matchList.slice(0, 5).forEach((m, idx) => {
          computed.push({
            id: `${employee.id || emp.eid || 'emp'}_${m.opportunity.id}_${idx}`,
            employeeId: employee.id || emp.eid || '',
            opportunityId: m.opportunity.id,
            score: m.score,
            matchReasons: m.matchReasons,
            skillGaps: m.skillGaps
          });
        });
      }
      matches = computed;
    }

    if (opportunityId) {
      matches = matches.filter(m => m.opportunityId === opportunityId);
      if (matches.length === 0) {
        throw new Error(`No matches found for opportunity ID: ${opportunityId}`);
      }
    }

    const headers = ['id','employeeId','opportunityId','score','matchReasons','skillGaps'];
    const rows = matches.map(m => [
      m.id,
      m.employeeId,
      m.opportunityId,
      String(m.score),
      (m.matchReasons || []).join('|'),
      (m.skillGaps || []).join('|')
    ]);
    return this.buildCsv([headers, ...rows]);
  }

  private mapComprehensiveToEmployee(e: any): Employee {
    return {
      id: e.eid || e.id || '',
      name: e.fullName || e.name || '',
      email: e.email || '',
      department: e.jobFamily || e.department || '',
      jobTitle: e.jobTitle || e.currentRole || '',
      currentRole: e.jobLevel || e.currentRole || '',
      yearsExperience: Number(e.yearsExperience || 0),
      performanceRating: (e.myRating || e.yeRating || e.performanceRating || 'Meets') as Employee['performanceRating'],
      skills: Array.isArray(e.technicalSkillSet) ? e.technicalSkillSet : (typeof e.technicalSkillSet === 'string' ? (e.technicalSkillSet || '').split(',').map((s: string) => s.trim()) : (e.skills || [])),
      availability: e.availability || 'Full-time',
      timeInRole: e.timeInRole || '',
      lengthOfService: e.lengthOfService || '',
      promotionForecast: e.promotionForecast || '',
      tdiZone: e.tdiZone || '',
      myRating: e.myRating || '',
      yeRating: e.yeRating || '',
      lastPromoDate: e.lastPromoDate || '',
      preparingForPromo: !!e.preparingForPromo,
      preparingForStretch: !!e.preparingForStretch,
      preparingForRotation: !!e.preparingForRotation,
      futureTalentProfile: e.futureTalentProfile || '',
      differentiatedStrength: e.differentiatedStrength || '',
      currentGapsOpportunities: e.currentGapsOpportunities || '',
      whatNeedsToBeDemonstrated: e.whatNeedsToBeDemonstrated || '',
      howToInvest: e.howToInvest || '',
      whatSupportNeeded: e.whatSupportNeeded || '',
      associateCareerAspirations: e.associateCareerAspirations || '',
      previousDifferentialInvestment: e.previousDifferentialInvestment || '',
      retentionPlanNeeded: !!e.retentionPlanNeeded,
      retentionPlanJustification: e.retentionPlanJustification || '',
      rotationStechPlanNeeded: !!e.rotationStechPlanNeeded,
      rotationStechPlanJustification: e.rotationStechPlanJustification || '',
      lastHireDate: e.lastHireDate || '',
      lastPromotedDate: e.lastPromotedDate || '',
      performanceTrend: e.performanceTrend || '',
      talentDevelopmentInventory: Array.isArray(e.talentDevelopmentInventory) ? e.talentDevelopmentInventory : [],
      attritionRisk: Number(e.attritionRisk || 0),
      skillsetExperience: Array.isArray(e.skillsetExperience) ? e.skillsetExperience : [],
      competencyStrengths: Array.isArray(e.competencyStrengths) ? e.competencyStrengths : [],
      careerInterest: Array.isArray(e.careerInterest) ? e.careerInterest : [],
      confirmedInterestInRotation: !!e.confirmedInterestInRotation,
      leadershipSupportOfRotation: !!e.leadershipSupportOfRotation
    };
  }

  private buildCsv(rows: (string | number)[][]): string {
    const escape = (val: any) => {
      const s = val == null ? '' : String(val);
      if (s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      if (s.includes(',') || s.includes('\n')) {
        return '"' + s + '"';
      }
      return s;
    };

    return rows.map(r => r.map(escape).join(',')).join('\n');
  }
}
