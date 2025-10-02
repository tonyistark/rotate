import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OpportunityService } from '../../services/opportunity.service';
import { JobLevelsService } from '../../services/job-levels.service';
import { EmployeeService } from '../../services/employee.service';
import { Opportunity, Match, Employee } from '../../models/employee.model';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';

interface TeamMemberMatch {
  name: string;
  matchScore: number;
  skillsMatched: string[];
}

@Component({
  selector: 'app-opportunities-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './opportunities-list.component.html',
  styleUrls: ['./opportunities-list.component.scss']
})
export class OpportunitiesListComponent extends BaseComponent implements OnInit, OnDestroy {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  loading = false;
  searchTerm = '';
  selectedDepartment: string = '';
  selectedLevel: string = '';

  departments = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
  levels: string[] = [];
  teamMembers: Employee[] = [];

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private opportunityService: OpportunityService,
    private jobLevelsService: JobLevelsService,
    private employeeService: EmployeeService,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadJobLevels();
    this.loadEmployees();
  }

  loadJobLevels(): void {
    this.jobLevelsService.getJobLevelsWithAll().subscribe({
      next: (levels) => {
        this.levels = levels;
      },
      error: () => {
        this.levels = ['All', 'Associate', 'Sr. Associate', 'Principal Associate', 'Manager', 'Sr. Manager', 'Director', 'Sr. Director', 'VP', 'Managing VP', 'Sr. VP'];
      }
    });
  }

  loadOpportunities(): void {
    this.opportunityService.getOpportunities().subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        this.filteredOpportunities = opportunities;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading opportunities:', error);
        this.snackBar.open('Error loading opportunities', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.teamMembers = employees;
      },
      error: () => {
      }
    });
  }

  applyFilters(): void {
    this.filteredOpportunities = this.opportunities.filter(opportunity => {
      const matchesSearch = !this.searchTerm || 
        opportunity.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        opportunity.requiredSkills.some(skill => skill.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesDepartment = !this.selectedDepartment || 
        this.selectedDepartment === 'All' || 
        opportunity.department === this.selectedDepartment;

      const matchesLevel = !this.selectedLevel || 
        this.selectedLevel === 'All' || 
        opportunity.level === this.selectedLevel;

      return matchesSearch && matchesDepartment && matchesLevel;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDepartmentChange(): void {
    this.applyFilters();
  }

  onLevelChange(): void {
    this.applyFilters();
  }


  viewOpportunityDetails(opportunity: Opportunity): void {
    // Create a mock match object for the modal since it expects a Match interface
    const mockMatch: Match = {
      opportunity: opportunity,
      score: 100, // Default score since we're viewing all opportunities
      matchReasons: ['Direct opportunity view'],
      skillGaps: []
    };

    const dialogRef = this.dialog.open(OpportunityModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { match: mockMatch }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'applied') {
        this.snackBar.open('Application submitted successfully!', 'Close', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manager']);
  }

  // Team matching methods
  getTeamMatches(opportunity: Opportunity): TeamMemberMatch[] {
    return this.teamMembers.map(member => {
      const matchScore = this.calculateMatchScore(member, opportunity);
      const skillsMatched = this.getMatchedSkills(member, opportunity);
      
      return {
        name: member.name,
        matchScore,
        skillsMatched
      };
    }).filter(match => match.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateMatchScore(member: Employee, opportunity: Opportunity): number {
    let score = 0;

    const requiredSkillsMatched = opportunity.requiredSkills.filter(skill =>
      member.skills.some(memberSkill => memberSkill.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    const preferredSkillsMatched = opportunity.preferredSkills.filter(skill =>
      member.skills.some(memberSkill => memberSkill.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    // Score based on required skills (higher weight)
    score += (requiredSkillsMatched / Math.max(opportunity.requiredSkills.length, 1)) * 70;
    
    // Score based on preferred skills
    score += (preferredSkillsMatched / Math.max(opportunity.preferredSkills.length, 1)) * 30;

    // Bonus for department match
    if (member.department === opportunity.department) {
      score += 10;
    }

    // Bonus for career interest alignment
    const careerAlignment = member.careerInterest.some(interest => 
      opportunity.description.toLowerCase().includes(interest.toLowerCase()) ||
      opportunity.title.toLowerCase().includes(interest.toLowerCase())
    );
    if (careerAlignment) {
      score += 15;
    }

    return Math.min(Math.round(score), 100);
  }

  getMatchedSkills(member: Employee, opportunity: Opportunity): string[] {
    const allOpportunitySkills = [...opportunity.requiredSkills, ...opportunity.preferredSkills];
    return member.skills.filter(memberSkill => 
      allOpportunitySkills.some(oppSkill => 
        memberSkill.toLowerCase().includes(oppSkill.toLowerCase())
      )
    );
  }

  getExcellentMatches(opportunity: Opportunity): TeamMemberMatch[] {
    return this.getTeamMatches(opportunity).filter(match => match.matchScore >= 80);
  }

  getGoodMatches(opportunity: Opportunity): TeamMemberMatch[] {
    return this.getTeamMatches(opportunity).filter(match => match.matchScore >= 60 && match.matchScore < 80);
  }

  getFairMatches(opportunity: Opportunity): TeamMemberMatch[] {
    return this.getTeamMatches(opportunity).filter(match => match.matchScore >= 30 && match.matchScore < 60);
  }

  getMatchQualityColor(score: number): string {
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    if (score >= 30) return 'warn';
    return 'basic';
  }

  getMatchQualityLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  }
}
