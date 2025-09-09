import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Match, Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { EmployeeService } from '../../services/employee.service';

interface TeamMemberMatch {
  name: string;
  matchScore: number;
  skillsMatched: string[];
}

@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './opportunity-card.component.html',
  styleUrls: ['./opportunity-card.component.scss']
})
export class OpportunityCardComponent extends BaseComponent implements OnInit {
  @Input() match!: Match;
  @Output() apply = new EventEmitter<Match>();
  @Output() cardClick = new EventEmitter<Match>();
  
  teamMembers: Employee[] = [];
  teamMatches: TeamMemberMatch[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private employeeService: EmployeeService,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.loadTeamMembers();
  }

  private loadTeamMembers(): void {
    this.employeeService.getEmployees().subscribe(employees => {
      this.teamMembers = employees;
      this.calculateTeamMatches();
    });
  }

  private calculateTeamMatches(): void {
    this.teamMatches = this.teamMembers.map(member => {
      const matchScore = this.calculateMatchScore(member, this.match.opportunity);
      const skillsMatched = this.getMatchedSkills(member, this.match.opportunity);
      
      return {
        name: member.name,
        matchScore,
        skillsMatched
      };
    }).filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3); // Show top 3 matches
  }

  private calculateMatchScore(member: Employee, opportunity: any): number {
    let score = 0;
    const memberSkills = member.technicalSkillSet || member.skills || [];
    const requiredSkills = opportunity.requiredSkills || [];
    const preferredSkills = opportunity.preferredSkills || [];
    
    // Required skills matching (higher weight)
    const requiredMatches = requiredSkills.filter((skill: string) => 
      memberSkills.some((memberSkill: string) => 
        memberSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(memberSkill.toLowerCase())
      )
    ).length;
    
    // Preferred skills matching (lower weight)
    const preferredMatches = preferredSkills.filter((skill: string) => 
      memberSkills.some((memberSkill: string) => 
        memberSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(memberSkill.toLowerCase())
      )
    ).length;
    
    // Calculate score
    const requiredScore = requiredSkills.length > 0 ? (requiredMatches / requiredSkills.length) * 60 : 0;
    const preferredScore = preferredSkills.length > 0 ? (preferredMatches / preferredSkills.length) * 30 : 0;
    
    score = requiredScore + preferredScore;
    
    return Math.round(score);
  }

  private getMatchedSkills(member: Employee, opportunity: any): string[] {
    const memberSkills = member.technicalSkillSet || member.skills || [];
    const allOpportunitySkills = [...(opportunity.requiredSkills || []), ...(opportunity.preferredSkills || [])];
    
    return allOpportunitySkills.filter((skill: string) => 
      memberSkills.some((memberSkill: string) => 
        memberSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(memberSkill.toLowerCase())
      )
    );
  }

  getTopTeamMatches(): TeamMemberMatch[] {
    return this.teamMatches;
  }

  getMatchQualityColor(score: number): string {
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }

  getMatchQualityLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'match-score-high';
    if (score >= 70) return 'match-score-medium';
    return 'match-score-low';
  }

  override getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'sr. vp':
      case 'managing vp':
      case 'vp':
        return 'warn';
      case 'sr. director':
      case 'director':
        return 'accent';
      case 'sr. manager':
      case 'manager':
        return 'primary';
      case 'principal associate':
      case 'sr. associate':
        return 'accent';
      case 'associate':
      default:
        return 'primary';
    }
  }

  onApply(): void {
    this.apply.emit(this.match);
    this.snackBar.open(
      `Application submitted for ${this.match.opportunity.title}!`,
      'Close',
      { duration: 3000 }
    );
  }

  onCardClick(): void {
    this.cardClick.emit(this.match);
  }

}
