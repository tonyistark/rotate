import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { takeUntil } from 'rxjs/operators';

import { Opportunity, Match, Employee } from '../../models/employee.model';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';
import { BaseComponent } from '../../shared/base/base.component';
import { FilterService, FilterState } from '../../shared/services/filter.service';
import { UtilsService } from '../../shared/services/utils.service';
import { APP_CONSTANTS, FILTER_LABELS } from '../../shared/constants/app.constants';

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
    FormsModule
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
export class HrbpDashboardComponent extends BaseComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  employees: Employee[] = [];
  selectedOpportunity: Opportunity | null = null;
  employeeMatches: EmployeeMatch[] = [];

  // UI state
  showEmployeePanel = false;
  showInstructionPopup = false;

  // Filter state
  filterState: FilterState;
  filterOptions: any = {};
  readonly filterLabels = FILTER_LABELS;

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
    this.filterState = this.filterService.createInitialFilterState();
  }

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadEmployees();
  }

  loadOpportunities(): void {
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.opportunities = opportunities;
        this.filteredOpportunities = opportunities;
        this.filterOptions = this.filterService.extractFilterOptions(opportunities);
      });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
      });
  }


  applyFilters(): void {
    this.filteredOpportunities = this.filterService.applyFilters(this.opportunities, this.filterState);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onOpportunityClick(opportunity: Opportunity): void {
    this.selectedOpportunity = opportunity;
    this.calculateEmployeeMatches(opportunity);
  }

  openOpportunityModal(opportunity: Opportunity): void {
    const match: Match = {
      opportunity,
      score: 85,
      matchReasons: [],
      skillGaps: opportunity.requiredSkills.slice(0, 2)
    };

    const dialogRef = this.dialog.open(OpportunityModalComponent, {
      ...APP_CONSTANTS.DIALOG_CONFIG.OPPORTUNITY_MODAL,
      data: { 
        match,
        availableEmployees: this.employees
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'applied') {
          console.log('Application submitted for opportunity:', opportunity.title);
        }
        // Refresh opportunities to show updated assignment status
        this.loadOpportunities();
      });
  }


  clearSearch(): void {
    this.filterState.searchTerm = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return this.filterService.hasActiveFilters(this.filterState);
  }

  clearFilter(filterType: keyof FilterState): void {
    this.filterState = this.filterService.clearFilter(this.filterState, filterType);
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.filterState = this.filterService.clearAllFilters(this.filterState);
    this.onFilterChange();
  }

  showEmployeeDetails(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailModalComponent, {
      ...APP_CONSTANTS.DIALOG_CONFIG.EMPLOYEE_DETAIL,
      data: { employee }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          console.log('Employee updated:', result);
        }
      });
  }

  calculateEmployeeMatches(opportunity: Opportunity): void {
    // Create opportunity-specific employee matches with varied results
    let potentialMatches = this.employees.map(employee => {
      const matchingSkills = employee.skills.filter(skill => 
        opportunity.requiredSkills.includes(skill) || 
        opportunity.preferredSkills.includes(skill)
      );
      
      const missingSkills = opportunity.requiredSkills.filter(skill => 
        !employee.skills.includes(skill)
      );

      // Calculate base match score
      let score = 0;
      
      // Skills match (40% weight)
      const skillMatchRatio = matchingSkills.length / (opportunity.requiredSkills.length + opportunity.preferredSkills.length);
      score += skillMatchRatio * 40;
      
      // Performance rating (20% weight)
      const performanceScore = this.utilsService.getPerformanceScore(employee.performanceRating);
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


  calculateInterestAlignment(employee: Employee, opportunity: Opportunity): number {
    const opportunityText = `${opportunity.description} ${opportunity.title}`;
    return this.utilsService.calculateInterestAlignment(employee.careerInterest, opportunityText);
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

}
