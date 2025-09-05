import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { SkillsAnalyticsService } from '../../services/skills-analytics.service';
import { Employee } from '../../models/employee.model';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { SkillsInventoryComponent } from '../skills-inventory/skills-inventory.component';

// Interfaces
interface Opportunity {
  id: string;
  title: string;
  department: string;
  location: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  assignedEmployeeId?: string;
  assignedEmployee?: Employee;
  assignmentDate?: string;
  remote?: boolean;
  duration?: string;
  level?: string;
}

interface SkillsAnalytics {
  totalUniqueSkills: number;
  totalOpportunities: number;
  totalEmployees: number;
  skillGaps?: any[];
  criticalGaps?: any[];
}

interface EmployeeMatch {
  employee: Employee;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

@Component({
  selector: 'app-hrbp-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTabsModule,
    FormsModule,
    SkillsInventoryComponent
  ],
  templateUrl: './hrbp-dashboard.component.html',
  styleUrls: ['./hrbp-dashboard.component.scss'],
  animations: [
    trigger('slideIn', [
      state('in', style({transform: 'translateY(0)', opacity: 1})),
      transition('void => *', [
        style({transform: 'translateY(-20px)', opacity: 0}),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({transform: 'translateY(-20px)', opacity: 0}))
      ])
    ])
  ]
})
export class HrbpDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  employees: Employee[] = [];
  selectedOpportunity: Opportunity | null = null;
  employeeMatches: EmployeeMatch[] = [];
  skillsAnalytics: SkillsAnalytics | null = null;

  // UI state
  showEmployeePanel = false;
  showInstructionPopup = false;
  selectedTabIndex = 0;

  // Filter state
  filterState: any = {
    searchTerm: '',
    selectedLeader: '',
    selectedDepartment: '',
    selectedLocation: '',
    selectedSkills: [],
    performanceRating: '',
    rotationInterest: ''
  };
  
  filterOptions: any = {};
  filterLabels: any = {
    department: 'Department',
    location: 'Location',
    skills: 'Skills',
    performanceRating: 'Performance',
    rotationInterest: 'Rotation Interest',
    rotationLength: 'Duration'
  };

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private skillsAnalyticsService: SkillsAnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOpportunities(): void {
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.opportunities = opportunities;
        this.filteredOpportunities = opportunities;
        this.updateSkillsAnalytics();
      });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.updateSkillsAnalytics();
      });
  }

  updateSkillsAnalytics(): void {
    if (this.opportunities.length > 0 && this.employees.length > 0) {
      // Calculate analytics directly from the loaded data
      const uniqueSkills = new Set<string>();
      
      // Collect all skills from opportunities
      this.opportunities.forEach(opp => {
        opp.requiredSkills.forEach(skill => uniqueSkills.add(skill));
        opp.preferredSkills.forEach(skill => uniqueSkills.add(skill));
      });
      
      // Collect all skills from employees
      this.employees.forEach(emp => {
        emp.skills.forEach(skill => uniqueSkills.add(skill));
      });
      
      // Create analytics object with actual data
      // Calculate skill gaps for consistent data
      const skillDemandMap = new Map<string, number>();
      this.opportunities.forEach(opp => {
        [...opp.requiredSkills, ...opp.preferredSkills].forEach(skill => {
          skillDemandMap.set(skill, (skillDemandMap.get(skill) || 0) + 1);
        });
      });

      const skillSupplyMap = new Map<string, number>();
      this.employees.forEach(emp => {
        emp.skills.forEach(skill => {
          skillSupplyMap.set(skill, (skillSupplyMap.get(skill) || 0) + 1);
        });
      });

      const skillGaps: any[] = [];
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

      this.skillsAnalytics = {
        totalUniqueSkills: uniqueSkills.size,
        totalOpportunities: this.opportunities.length,
        totalEmployees: this.employees.length,
        skillGaps,
        criticalGaps: skillGaps.filter(gap => gap.severity === 'critical')
      };
    }
  }

  getSkillShortages(): number {
    if (!this.skillsAnalytics?.skillGaps) return 0;
    return this.skillsAnalytics.skillGaps.filter(gap => gap.status === 'shortage').length;
  }

  getFilteredOpportunities(): Opportunity[] {
    return this.opportunities; // Simplified for now
  }

  onFilterChange(filterState?: any): void {
    if (filterState) {
      this.filterState = filterState;
    }
    this.filteredOpportunities = this.opportunities; // Simplified for now
  }

  clearAllFilters(): void {
    this.filterState = {
      searchTerm: '',
      selectedLeader: '',
      selectedDepartment: '',
      selectedLocation: '',
      selectedSkills: [],
      performanceRating: '',
      rotationInterest: ''
    };
    this.onFilterChange(this.filterState);
  }

  openOpportunityModal(opportunity: Opportunity): void {
    const match = {
      opportunity,
      employee: null,
      score: 0,
      matchingSkills: [],
      skillGaps: []
    };

    this.dialog.open(OpportunityModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { match }
    });
  }

  openEmployeeModal(employee: Employee): void {
    this.dialog.open(EmployeeDetailModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { employee }
    });
  }

  calculateEmployeeMatches(opportunity: Opportunity): void {
    // Create opportunity-specific employee matches with varied results
    let potentialMatches = this.employees.map(employee => {
      const allSkills = [...opportunity.requiredSkills, ...opportunity.preferredSkills];
      const matchingSkills = employee.skills.filter((skill: string) => 
        allSkills.some(reqSkill => reqSkill.toLowerCase().includes(skill.toLowerCase()))
      );
      
      const missingSkills = opportunity.requiredSkills.filter((skill: string) => 
        !employee.skills.includes(skill)
      );
      
      // Calculate base match score
      let score = 0;
      
      // Skills match (40% weight)
      const skillMatchRatio = matchingSkills.length / (opportunity.requiredSkills.length + opportunity.preferredSkills.length);
      score += skillMatchRatio * 40;
      
      // Performance rating (20% weight)
      const performanceScore = employee.performanceRating === 'Outstanding' ? 5 : 
                               employee.performanceRating === 'Exceeds' ? 4 : 
                               employee.performanceRating === 'Meets' ? 3 : 2;
      score += (performanceScore / 5) * 20;
      
      // Career interest alignment (20% weight)
      const interestAlignment = this.calculateInterestAlignment(employee, opportunity);
      score += interestAlignment * 20;
      
      // Availability and rotation interest (20% weight)
      if (employee.confirmedInterestInRotation && employee.leadershipSupportOfRotation) {
        score += 20;
      } else if (employee.confirmedInterestInRotation || employee.leadershipSupportOfRotation) {
        score += 10;
      }

      // Add opportunity-specific adjustments to create variety
      score += this.getOpportunitySpecificAdjustment(employee, opportunity);

      return {
        employee,
        matchScore: Math.min(100, Math.max(0, Math.round(score))),
        matchingSkills,
        missingSkills
      };
    });

    // Filter and sort based on opportunity characteristics
    this.employeeMatches = this.filterAndSortForOpportunity(potentialMatches, opportunity);
  }

  private calculateInterestAlignment(employee: Employee, opportunity: Opportunity): number {
    return 0.5; // Simplified for now
  }

  getOpportunitySpecificAdjustment(employee: Employee, opportunity: Opportunity): number {
    let adjustment = 0;
    
    // Create different match patterns based on opportunity ID
    switch (opportunity.id) {
      case '1': // Data Analytics Project Lead
        if (employee.department === 'Data Science' || employee.department === 'Engineering') adjustment += 15;
        if (employee.yearsExperience >= 4) adjustment += 10;
        break;
      case '2': // UX Research Initiative  
        if (employee.department === 'Design' || employee.department === 'Product') adjustment += 15;
        if (employee.currentRole.includes('Designer') || employee.currentRole.includes('UX')) adjustment += 10;
        break;
      case '3': // Cloud Migration Specialist
        if (employee.department === 'Engineering') adjustment += 20;
        if (employee.yearsExperience >= 5) adjustment += 10;
        break;
      case '4': // Marketing Automation Lead
        if (employee.department === 'Marketing' || employee.department === 'Sales') adjustment += 15;
        if (employee.currentRole.includes('Marketing')) adjustment += 10;
        break;
      case '5': // AI Ethics Committee Member
        // This should have low matches as requested
        adjustment -= 30;
        if (employee.yearsExperience < 7) adjustment -= 20;
        break;
      default:
        // Add some randomization based on employee ID for variety
        const employeeIdNum = parseInt(employee.id.replace('emp', ''));
        const opportunityIdNum = parseInt(opportunity.id);
        adjustment += (employeeIdNum * opportunityIdNum) % 15 - 7;
    }
    
    return adjustment;
  }

  filterAndSortForOpportunity(matches: EmployeeMatch[], opportunity: Opportunity): EmployeeMatch[] {
    // Filter out employees with very low scores and limit results
    let filteredMatches = matches.filter(match => match.matchScore > 20);
    
    // Sort by match score
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit to top 6-8 matches per opportunity for variety
    const maxMatches = opportunity.id === '5' ? 3 : Math.min(8, Math.max(5, filteredMatches.length));
    
    return filteredMatches.slice(0, maxMatches);
  }

  getExcellentMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore >= 90);
  }

  getOtherMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore < 90);
  }

  closeEmployeePanel(): void {
    this.showEmployeePanel = false;
    // Clear selected employee match state
  }

  toggleInstructionPopup(): void {
    this.showInstructionPopup = !this.showInstructionPopup;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  showEmployeeDetails(employee: Employee): void {
    this.openEmployeeModal(employee);
  }

  onOpportunityClick(opportunity: Opportunity): void {
    this.selectedOpportunity = opportunity;
    this.calculateEmployeeMatches(opportunity);
    this.showEmployeePanel = true;
  }

  clearFilter(filterKey: string): void {
    (this.filterState as any)[filterKey] = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterState.searchTerm || 
             this.filterState.selectedLeader || 
             this.filterState.selectedDepartment || 
             this.filterState.selectedLocation || 
             this.filterState.selectedSkills?.length || 
             this.filterState.performanceRating || 
             this.filterState.rotationInterest);
  }

  clearSearch(): void {
    this.filterState.searchTerm = '';
    this.onFilterChange();
  }


}
