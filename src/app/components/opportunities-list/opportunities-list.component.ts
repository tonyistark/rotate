import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OpportunityService } from '../../services/opportunity.service';
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
export class OpportunitiesListComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  loading = false;
  searchTerm = '';
  selectedDepartment: string = '';
  selectedLevel: string = '';

  departments = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
  levels = ['All', 'Entry', 'Mid', 'Senior', 'Lead'];

  // Mock team data for matching - in real app this would come from a service
  teamMembers: Employee[] = [
    {
      id: 'emp1',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      department: 'Engineering',
      currentRole: 'Senior Developer',
      yearsExperience: 5,
      skills: ['TypeScript', 'Angular', 'Node.js', 'AWS', 'React', 'Python'],
      interests: ['Full-stack Development', 'Cloud Architecture'],
      careerGoals: ['Tech Lead', 'Solution Architect'],
      availability: 'Full-time',
      performanceRating: 'Outstanding',
      
      // TDI Profile fields
      timeInRole: '2 years 3 months',
      lengthOfService: '5 years 8 months',
      promotionForecast: 'YE 2025',
      retentionRisk: '12%',
      tdiZone: 'Invest Now',
      myRating: 'Strong',
      yeRating: 'Above Strong',
      lastPromoDate: '2022-08-01',
      
      // Development Focus
      preparingForPromo: true,
      preparingForStretch: false,
      preparingForRotation: true,
      
      // Future Talent Profile
      futureTalentProfile: 'Technical Leadership',
      differentiatedStrength: 'Technical Excellence',
      currentGapsOpportunities: 'Leadership experience needed',
      
      // Development needs
      whatNeedsToBeDemonstrated: 'Team leadership and mentoring skills',
      howToInvest: 'Provide tech lead opportunities and leadership training',
      whatSupportNeeded: 'Mentorship from senior engineering leaders',
      
      // Career aspirations and investment
      associateCareerAspirations: 'Solution Architect, Engineering Manager',
      previousDifferentialInvestment: 'Advanced AWS certification, leadership workshop',
      
      // Retention and rotation plans
      retentionPlanNeeded: false,
      retentionPlanJustification: '',
      rotationStechPlanNeeded: true,
      rotationStechPlanJustification: 'Cross-functional experience needed for leadership growth',
      
      // Legacy fields
      lastHireDate: '2019-03-15',
      lastPromotedDate: '2022-08-01',
      performanceTrend: 'Outstanding (YE24), Exceeds (MY24)',
      talentDevelopmentInventory: ['Dev Zone', 'Technical Leadership'],
      attritionRisk: 12,
      skillsetExperience: ['TypeScript', 'Angular', 'Node.js', 'AWS'],
      competencyStrengths: ['TypeScript', 'Angular'],
      careerInterest: ['Cloud Architecture', 'Technical Leadership'],
      confirmedInterestInRotation: true,
      leadershipSupportOfRotation: true
    },
    {
      id: 'emp2',
      name: 'Bob Smith',
      email: 'bob.smith@company.com',
      department: 'Product',
      currentRole: 'Product Manager',
      yearsExperience: 7,
      skills: ['Product Strategy', 'Data Analysis', 'Agile', 'User Research', 'SQL', 'Python'],
      interests: ['Product Strategy', 'Market Analysis'],
      careerGoals: ['Senior Product Manager', 'VP Product'],
      availability: 'Full-time',
      performanceRating: 'Exceeds',
      
      // TDI Profile fields
      timeInRole: '3 years 2 months',
      lengthOfService: '7 years 1 month',
      promotionForecast: 'YE 2026',
      retentionRisk: '8%',
      tdiZone: 'Develop',
      myRating: 'Strong',
      yeRating: 'Strong',
      lastPromoDate: '2021-01-15',
      
      // Development Focus
      preparingForPromo: true,
      preparingForStretch: true,
      preparingForRotation: true,
      
      // Future Talent Profile
      futureTalentProfile: 'Product Leadership',
      differentiatedStrength: 'Strategic Thinking',
      currentGapsOpportunities: 'Cross-functional leadership experience',
      
      // Development needs
      whatNeedsToBeDemonstrated: 'P&L ownership and strategic vision',
      howToInvest: 'Stretch assignments with revenue responsibility',
      whatSupportNeeded: 'Executive mentorship and business strategy training',
      
      // Career aspirations and investment
      associateCareerAspirations: 'VP Product, General Manager',
      previousDifferentialInvestment: 'MBA sponsorship, product leadership program',
      
      // Retention and rotation plans
      retentionPlanNeeded: false,
      retentionPlanJustification: '',
      rotationStechPlanNeeded: true,
      rotationStechPlanJustification: 'Business unit exposure for GM readiness',
      
      // Legacy fields
      lastHireDate: '2017-11-20',
      lastPromotedDate: '2021-01-15',
      performanceTrend: 'Exceeds (YE24), Exceeds (MY24)',
      talentDevelopmentInventory: ['Product Leadership', 'Strategic Planning'],
      attritionRisk: 8,
      skillsetExperience: ['Product Strategy', 'Data Analysis', 'Agile'],
      competencyStrengths: ['Product Strategy', 'User Research'],
      careerInterest: ['Product Leadership', 'Strategic Planning'],
      confirmedInterestInRotation: true,
      leadershipSupportOfRotation: true
    },
    {
      id: 'emp3',
      name: 'Carol Davis',
      email: 'carol.davis@company.com',
      department: 'Design',
      currentRole: 'UX Designer',
      yearsExperience: 4,
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe Creative Suite'],
      interests: ['User Experience', 'Design Systems'],
      careerGoals: ['Senior UX Designer', 'Design Lead'],
      availability: 'Full-time',
      performanceRating: 'Meets',
      
      // TDI Profile fields
      timeInRole: '1 year 8 months',
      lengthOfService: '4 years 6 months',
      promotionForecast: 'YE 2025',
      retentionRisk: '25%',
      tdiZone: 'Maintain',
      myRating: 'Solid',
      yeRating: 'Solid',
      lastPromoDate: '2023-03-01',
      
      // Development Focus
      preparingForPromo: false,
      preparingForStretch: true,
      preparingForRotation: false,
      
      // Future Talent Profile
      futureTalentProfile: 'Design Leadership',
      differentiatedStrength: 'User Empathy',
      currentGapsOpportunities: 'Design system leadership and team management',
      
      // Development needs
      whatNeedsToBeDemonstrated: 'Design system ownership and cross-team collaboration',
      howToInvest: 'Design system lead role and design thinking workshops',
      whatSupportNeeded: 'Senior design mentor and leadership training',
      
      // Career aspirations and investment
      associateCareerAspirations: 'Senior UX Designer, Design Manager',
      previousDifferentialInvestment: 'Design leadership course, UX certification',
      
      // Retention and rotation plans
      retentionPlanNeeded: true,
      retentionPlanJustification: 'Moderate attrition risk due to limited growth opportunities',
      rotationStechPlanNeeded: false,
      rotationStechPlanJustification: '',
      
      // Legacy fields
      lastHireDate: '2020-06-10',
      lastPromotedDate: '2023-03-01',
      performanceTrend: 'Meets (YE24), Meets (MY24)',
      talentDevelopmentInventory: ['Design Leadership', 'User Research'],
      attritionRisk: 25,
      skillsetExperience: ['Figma', 'User Research', 'Prototyping'],
      competencyStrengths: ['Figma', 'Prototyping'],
      careerInterest: ['Design Systems', 'User Research'],
      confirmedInterestInRotation: false,
      leadershipSupportOfRotation: true
    }
  ];

  constructor(
    private router: Router,
    private opportunityService: OpportunityService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
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

  formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Not set';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString();
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'Entry': return 'primary';
      case 'Mid': return 'accent';
      case 'Senior': return 'warn';
      case 'Lead': return 'primary';
      default: return 'primary';
    }
  }

  createNewOpportunity(): void {
    this.router.navigate(['/create-opportunity']);
  }

  editOpportunity(opportunity: Opportunity): void {
    this.router.navigate(['/edit-opportunity', opportunity.id]);
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
