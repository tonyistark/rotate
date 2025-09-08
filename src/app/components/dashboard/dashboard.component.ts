import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCalendar, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { OpportunityService } from '../../services/opportunity.service';
import { Opportunity, Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';

interface TeamMetrics {
  totalMembers: number;
  activeRotations: number;
  upcomingRotations: number;
  completedRotations: number;
  averagePerformance: number;
  attritionRisk: number;
}

interface SkillInventory {
  skill: string;
  count: number;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  trend: 'up' | 'down' | 'stable';
}

interface RotationEvent {
  id: string;
  title: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  department: string;
  type: 'starting' | 'ending' | 'ongoing';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit {
  teamMetrics: TeamMetrics = {
    totalMembers: 0,
    activeRotations: 0,
    upcomingRotations: 0,
    completedRotations: 0,
    averagePerformance: 0,
    attritionRisk: 0
  };

  skillInventory: SkillInventory[] = [];
  rotationEvents: RotationEvent[] = [];
  opportunities: Opportunity[] = [];
  selectedDate: Date = new Date();
  
  // Mock team data - in real app this would come from a service
  teamMembers: Employee[] = [
    {
      id: 'emp1',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      department: 'Engineering',
      currentRole: 'Senior Developer',
      yearsExperience: 5,
      skills: ['TypeScript', 'Angular', 'Node.js', 'AWS'],
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
      skills: ['Product Strategy', 'Data Analysis', 'Agile', 'User Research'],
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
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
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
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  loadDashboardData(): void {
    this.calculateTeamMetrics();
    this.generateSkillInventory();
    this.generateRotationEvents();
    this.loadOpportunities();
  }

  calculateTeamMetrics(): void {
    this.teamMetrics = {
      totalMembers: this.teamMembers.length,
      activeRotations: 2,
      upcomingRotations: 4,
      completedRotations: 8,
      averagePerformance: this.calculateAveragePerformance(),
      attritionRisk: this.calculateAverageAttritionRisk()
    };
  }

  calculateAveragePerformance(): number {
    const performanceMap = {
      'Outstanding': 5,
      'Exceeds': 4,
      'Meets': 3,
      'Below': 2,
      'Unsatisfactory': 1
    };
    
    const total = this.teamMembers.reduce((sum, member) => {
      return sum + (performanceMap[member.performanceRating as keyof typeof performanceMap] || 3);
    }, 0);
    
    return Math.round((total / this.teamMembers.length) * 20); // Convert to percentage
  }

  calculateAverageAttritionRisk(): number {
    const total = this.teamMembers.reduce((sum, member) => sum + member.attritionRisk, 0);
    return Math.round(total / this.teamMembers.length);
  }

  generateSkillInventory(): void {
    const skillCounts: { [key: string]: number } = {};
    
    this.teamMembers.forEach(member => {
      member.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    this.skillInventory = Object.entries(skillCounts)
      .map(([skill, count]) => ({
        skill,
        count,
        proficiency: this.getSkillProficiency(count),
        trend: this.getSkillTrend()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getSkillProficiency(count: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    if (count >= 4) return 'Expert';
    if (count >= 3) return 'Advanced';
    if (count >= 2) return 'Intermediate';
    return 'Beginner';
  }

  getSkillTrend(): 'up' | 'down' | 'stable' {
    const trends = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as 'up' | 'down' | 'stable';
  }

  generateRotationEvents(): void {
    const today = new Date();
    this.rotationEvents = [
      {
        id: '1',
        title: 'Frontend Development Rotation',
        employeeName: 'Alice Johnson',
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 97 * 24 * 60 * 60 * 1000),
        department: 'Engineering',
        type: 'starting'
      },
      {
        id: '2',
        title: 'Product Strategy Rotation',
        employeeName: 'Bob Smith',
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
        department: 'Product',
        type: 'ongoing'
      },
      {
        id: '3',
        title: 'UX Research Rotation',
        employeeName: 'Carol Davis',
        startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 104 * 24 * 60 * 60 * 1000),
        department: 'Design',
        type: 'starting'
      }
    ];
  }

  loadOpportunities(): void {
    this.opportunityService.getOpportunities().subscribe(opportunities => {
      this.opportunities = opportunities;
    });
  }

  navigateToOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }


  navigateToTeamManagement(): void {
    this.router.navigate(['/manager']);
  }


  override getAttritionRiskColor(risk: number): string {
    if (risk <= 15) return 'success';
    if (risk <= 30) return 'warn';
    return 'danger';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'warn';
      default: return 'primary';
    }
  }


  getRotationTypeIcon(type: string): string {
    switch (type) {
      case 'starting': return 'play_arrow';
      case 'ending': return 'stop';
      default: return 'schedule';
    }
  }

  getRotationTypeColor(type: string): string {
    switch (type) {
      case 'starting': return 'primary';
      case 'ending': return 'warn';
      default: return 'accent';
    }
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    // Filter rotation events for selected date
  }

  getEventsForDate(date: Date): RotationEvent[] {
    return this.rotationEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }
}
