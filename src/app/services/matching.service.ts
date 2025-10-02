import { Injectable } from '@angular/core';
import { Employee, Opportunity, Match } from '../models/employee.model';
import { APP_CONSTANTS } from '../shared/constants/app.constants';

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
      const employeeSkillsRaw: string[] | string = employee.skills || [];
      const employeeSkillsArray: string[] = Array.isArray(employeeSkillsRaw)
        ? employeeSkillsRaw
        : String(employeeSkillsRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      const employeeSkills = employeeSkillsArray.map((s: string) => s.toLowerCase().trim());

      // Parse opportunity skills (they might be strings from CSV)
      const requiredSkillsRaw: string[] | string = opportunity.requiredSkills || [];
      const requiredSkillsArray: string[] = Array.isArray(requiredSkillsRaw)
        ? requiredSkillsRaw
        : String(requiredSkillsRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      const requiredSkills = requiredSkillsArray.map((s: string) => s.toLowerCase().trim());

      const preferredSkillsRaw: string[] | string = opportunity.preferredSkills || [];
      const preferredSkillsArray: string[] = Array.isArray(preferredSkillsRaw)
        ? preferredSkillsRaw
        : String(preferredSkillsRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      const preferredSkills = preferredSkillsArray.map((s: string) => s.toLowerCase().trim());

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

      const requiredScore = (requiredMatches.length / requiredSkills.length) * APP_CONSTANTS.SCORING_WEIGHTS.REQUIRED_SKILLS;
      const preferredScore = (preferredMatches.length / Math.max(preferredSkills.length, 1)) * APP_CONSTANTS.SCORING_WEIGHTS.PREFERRED_SKILLS;
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
        score += (interestMatches.length / employeeInterests.length) * APP_CONSTANTS.SCORING_WEIGHTS.INTEREST_ALIGNMENT;
        matchReasons.push(`Aligns with ${interestMatches.length} of your interests`);
      }

      // Performance rating bonus (15% of score)
      const rating = employee.performanceRating || 'Meets';
      const performanceMultiplier = APP_CONSTANTS.PERFORMANCE_MULTIPLIERS[rating as keyof typeof APP_CONSTANTS.PERFORMANCE_MULTIPLIERS] || 1;
      score += APP_CONSTANTS.SCORING_WEIGHTS.PERFORMANCE_RATING * performanceMultiplier;

      if (employee.performanceRating === 'Outstanding' || employee.performanceRating === 'Exceeds') {
        matchReasons.push('Strong performance rating qualifies you for this opportunity');
      }

      // Experience level matching (10% of score)
      const experienceScore = this.calculateExperienceMatch(employee.yearsExperience, opportunity.level);
      score += experienceScore;

      if (experienceScore > APP_CONSTANTS.EXPERIENCE_MATCH_SCORES.THRESHOLD_GOOD) {
        matchReasons.push('Experience level is well-suited for this role');
      }

      // Career goals alignment (10% of score)
      // Employee doesn't have careerGoals property, skip this check
      const goalAlignment = false;

      if (goalAlignment) {
        score += APP_CONSTANTS.SCORING_WEIGHTS.CAREER_GOALS;
        matchReasons.push('Supports your career development goals');
      }

      // Department diversity bonus (5% of score)
      if (employee.department !== opportunity.department) {
        score += APP_CONSTANTS.SCORING_WEIGHTS.DEPARTMENT_DIVERSITY;
        matchReasons.push('Cross-departmental opportunity for broader experience');
      }

      return {
        opportunity,
        score: Math.min(Math.round(score), APP_CONSTANTS.MAX_MATCH_SCORE),
        matchReasons,
        skillGaps
      };
    }).sort((a, b) => b.score - a.score);
  }

  private calculateExperienceMatch(yearsExperience: number, level: Opportunity['level']): number {
    const requirement = APP_CONSTANTS.LEVEL_REQUIREMENTS[level];

    // Handle unknown levels gracefully - assume Associate level as default
    if (!requirement) {
      return this.calculateExperienceMatch(yearsExperience, 'Associate');
    }

    if (yearsExperience >= requirement.min && yearsExperience <= requirement.max) {
      return APP_CONSTANTS.EXPERIENCE_MATCH_SCORES.PERFECT;
    } else if (yearsExperience >= requirement.min - APP_CONSTANTS.EXPERIENCE_TOLERANCE.CLOSE_MIN &&
               yearsExperience <= requirement.max + APP_CONSTANTS.EXPERIENCE_TOLERANCE.CLOSE_MAX) {
      return APP_CONSTANTS.EXPERIENCE_MATCH_SCORES.CLOSE;
    } else if (yearsExperience >= requirement.min - APP_CONSTANTS.EXPERIENCE_TOLERANCE.ACCEPTABLE_MIN &&
               yearsExperience <= requirement.max + APP_CONSTANTS.EXPERIENCE_TOLERANCE.ACCEPTABLE_MAX) {
      return APP_CONSTANTS.EXPERIENCE_MATCH_SCORES.ACCEPTABLE;
    }

    return APP_CONSTANTS.EXPERIENCE_MATCH_SCORES.POOR;
  }
}
