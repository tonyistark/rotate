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
      const employeeSkills = employee.skills.map(s => s.toLowerCase());
      const requiredSkills = opportunity.requiredSkills.map(s => s.toLowerCase());
      const preferredSkills = opportunity.preferredSkills.map(s => s.toLowerCase());

      const requiredMatches = requiredSkills.filter(skill => 
        employeeSkills.some(empSkill => empSkill.includes(skill) || skill.includes(empSkill))
      );
      const preferredMatches = preferredSkills.filter(skill => 
        employeeSkills.some(empSkill => empSkill.includes(skill) || skill.includes(empSkill))
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
      const employeeInterests = employee.interests.map(i => i.toLowerCase());
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
      const performanceMultiplier = {
        'Outstanding': 1.0,
        'Exceeds': 0.8,
        'Meets': 0.6,
        'Below': 0.3
      };
      score += 15 * performanceMultiplier[employee.performanceRating];

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
      const goalAlignment = employee.careerGoals.some(goal =>
        opportunity.learningOutcomes.some(outcome =>
          goal.toLowerCase().includes(outcome.toLowerCase()) || 
          outcome.toLowerCase().includes(goal.toLowerCase())
        )
      );

      if (goalAlignment) {
        score += 10;
        matchReasons.push('Supports your career development goals');
      }

      // Department diversity bonus (5% of score)
      if (employee.department !== opportunity.department) {
        score += 5;
        matchReasons.push('Cross-departmental opportunity for broader experience');
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
      'Entry': { min: 0, max: 3 },
      'Mid': { min: 2, max: 7 },
      'Senior': { min: 5, max: 12 },
      'Lead': { min: 8, max: 20 },
      'Executive': { min: 10, max: 25 }
    };

    const requirement = levelRequirements[level];
    
    // Handle unknown levels gracefully
    if (!requirement) {
      return 0;
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
