import { Injectable } from '@angular/core';
import { Employee, Opportunity, Match } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  calculateMatches(employee: Employee, opportunities: Opportunity[]): Match[] {
    return opportunities.map(opportunity => {
      let score = 0;
      const matchReasons: string[] = [];
      const skillGaps: string[] = [];

      // Skill matching (40% of score)
      // Handle both skills array and technicalSkillSet from CSV import
      let employeeSkillsRaw: any = employee.skills || [];
      
      // If technicalSkillSet is a string (from CSV), parse it as comma-separated values
      if (typeof employeeSkillsRaw === 'string') {
        employeeSkillsRaw = employeeSkillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      
      const employeeSkills = (employeeSkillsRaw as string[]).map((s: string) => s.toLowerCase().trim());
      
      // Parse opportunity skills (they might be strings from CSV)
      let requiredSkillsRaw: any = opportunity.requiredSkills || [];
      if (typeof requiredSkillsRaw === 'string') {
        requiredSkillsRaw = requiredSkillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      const requiredSkills = (requiredSkillsRaw as string[]).map((s: string) => s.toLowerCase().trim());
      
      let preferredSkillsRaw: any = opportunity.preferredSkills || [];
      if (typeof preferredSkillsRaw === 'string') {
        preferredSkillsRaw = preferredSkillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      const preferredSkills = (preferredSkillsRaw as string[]).map((s: string) => s.toLowerCase().trim());

      // Debug logging for Michelle Park specifically
      if (employee.name === 'Michelle Park' && opportunity.title.includes('Digital Transformation Lab')) {
        console.log('=== MICHELLE PARK DEBUG ===');
        console.log('Employee:', employee);
        console.log('Opportunity:', opportunity);
        console.log('Employee skills:', employeeSkills);
        console.log('Required skills:', requiredSkills);
        console.log('Preferred skills:', preferredSkills);
      }


      const requiredMatches = requiredSkills.filter(skill => 
        employeeSkills.some(empSkill => 
          empSkill === skill || 
          empSkill.includes(skill) || 
          skill.includes(empSkill)
        )
      );
      const preferredMatches = preferredSkills.filter(skill => 
        employeeSkills.some(empSkill => 
          empSkill === skill || 
          empSkill.includes(skill) || 
          skill.includes(empSkill)
        )
      );

      const requiredScore = (requiredMatches.length / requiredSkills.length) * 25;
      const preferredScore = (preferredMatches.length / Math.max(preferredSkills.length, 1)) * 15;
      score += requiredScore + preferredScore;

      if (requiredMatches.length > 0) {
        matchReasons.push(`Matches ${requiredMatches.length}/${requiredSkills.length} required skills`);
      }
      if (preferredMatches.length > 0) {
        matchReasons.push(`Matches ${preferredMatches.length}/${preferredSkills.length} preferred skills`);
      }

      // Find skill gaps
      const missingRequired = requiredSkills.filter(skill => 
        !employeeSkills.some(empSkill => empSkill.includes(skill) || skill.includes(empSkill))
      );
      skillGaps.push(...missingRequired);

      // Interest alignment (20% of score)
      const employeeInterests: string[] = []; // Employee doesn't have interests property
      const opportunityKeywords = [
        opportunity.title.toLowerCase(),
        opportunity.department.toLowerCase(),
        ...opportunity.learningOutcomes.map(l => l.toLowerCase())
      ];

      const interestMatches = employeeInterests.filter(interest =>
        opportunityKeywords.some(keyword => keyword.includes(interest) || interest.includes(keyword))
      );

      if (interestMatches.length > 0) {
        score += (interestMatches.length / employeeInterests.length) * 20;
        matchReasons.push(`Aligns with ${interestMatches.length} of your interests`);
      }

      // Performance rating bonus (15% of score)
      const performanceMultiplier: Record<string, number> = {
        'Outstanding': 1.0,
        'Exceeds': 0.8,
        'Meets': 0.6,
        'Below': 0.3
      };
      score += 15 * (performanceMultiplier[employee.performanceRating || 'Meets'] || 1);

      if (employee.performanceRating === 'Outstanding' || employee.performanceRating === 'Exceeds') {
        matchReasons.push('Strong performance rating qualifies you for this opportunity');
      }

      // Experience level matching (10% of score)
      const experienceScore = this.calculateExperienceMatch(employee.yearsExperience, opportunity.level);
      score += experienceScore;

      if (experienceScore > 5) {
        matchReasons.push('Experience level is well-suited for this role');
      }

      // Career goals alignment (10% of score)
      // Employee doesn't have careerGoals property, skip this check
      const goalAlignment = false;

      if (goalAlignment) {
        score += 10;
        matchReasons.push('Supports your career development goals');
      }

      // Department diversity bonus (5% of score)
      if (employee.department !== opportunity.department) {
        score += 5;
        matchReasons.push('Cross-departmental opportunity for broader experience');
      }

      // Debug logging for Michelle Park specifically
      if (employee.name === 'Michelle Park' && opportunity.title.includes('Digital Transformation Lab')) {
        console.log('Required matches:', requiredMatches);
        console.log('Preferred matches:', preferredMatches);
        console.log('Required score:', requiredScore);
        console.log('Preferred score:', preferredScore);
        console.log('Experience score:', experienceScore);
        console.log('Final score before rounding:', score);
        console.log('Match reasons:', matchReasons);
        console.log('=== END MICHELLE PARK DEBUG ===');
      }


      return {
        opportunity,
        score: Math.min(Math.round(score), 100),
        matchReasons,
        skillGaps
      };
    }).sort((a, b) => b.score - a.score);
  }

  private calculateExperienceMatch(yearsExperience: number, level: Opportunity['level']): number {
    const levelRequirements = {
      'Associate': { min: 0, max: 2 },
      'Senior Associate': { min: 2, max: 5 },
      'Principal Associate': { min: 3, max: 6 },
      'Manager': { min: 3, max: 8 },
      'Sr. Manager': { min: 5, max: 12 },
      'Director': { min: 6, max: 18 },
      'Sr. Director': { min: 4, max: 20 },
      'Senior Director': { min: 6, max: 20 },
      'Principal': { min: 4, max: 15 },
      'Executive': { min: 10, max: 25 }
    };

    const requirement = levelRequirements[level];
    
    // Handle unknown levels gracefully - assume Associate level as default
    if (!requirement) {
      console.warn(`Unknown level: ${level}, using Associate level requirements`);
      return this.calculateExperienceMatch(yearsExperience, 'Associate');
    }
    
    if (yearsExperience >= requirement.min && yearsExperience <= requirement.max) {
      return 10; // Perfect match
    } else if (yearsExperience >= requirement.min - 1 && yearsExperience <= requirement.max + 2) {
      return 7; // Close match
    } else if (yearsExperience >= requirement.min - 2 && yearsExperience <= requirement.max + 4) {
      return 4; // Acceptable match
    }
    
    return 0; // Poor match
  }
}
