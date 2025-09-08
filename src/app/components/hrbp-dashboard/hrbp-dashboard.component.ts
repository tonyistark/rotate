import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Employee, Opportunity } from '../../models/employee.model';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { MatchingService } from '../../services/matching.service';
import { SkillsAnalyticsService } from '../../services/skills-analytics.service';
import { FilterService, FilterState } from '../../shared/services/filter.service';
import { JobLevelsService } from '../../services/job-levels.service';
import { HrbpFilterService, HrbpFilterOptions } from '../../services/hrbp-filter.service';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { SkillsInventoryComponent } from '../skills-inventory/skills-inventory.component';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import { 
  SkillsAnalytics, 
  EmployeeMatch, 
  MatchTableData, 
  DashboardState,
  SkillGap,
  MatchRecommendation
} from '../../shared/interfaces/dashboard.interfaces';

// Component-specific interfaces
interface OpportunityAdjustment {
  opportunityId: string;
  departmentBonus: string[];
  roleBonus: string[];
  experienceRequirement: number;
  adjustment: number;
}

@Component({
  selector: 'app-hrbp-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
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
        animate(APP_CONSTANTS.ANIMATIONS.SLIDE_DURATION)
      ]),
      transition('* => void', [
        animate(APP_CONSTANTS.ANIMATIONS.SLIDE_DURATION, style({transform: 'translateY(-20px)', opacity: 0}))
      ])
    ])
  ]
})
export class HrbpDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  employees: Employee[] = [];
  employeeMatches: EmployeeMatch[] = [];
  skillsAnalytics: SkillsAnalytics | null = null;

  // UI state
  dashboardState: DashboardState = {
    isLoading: false,
    error: null,
    selectedOpportunity: null,
    selectedEmployee: null,
    showEmployeePanel: false,
    showInstructionPopup: false,
    selectedTabIndex: 0
  };
  
  // Matches table configuration
  matchesDisplayedColumns: string[] = ['employee', 'opportunity', 'assignmentDate', 'duration', 'location', 'skillsMatch', 'actions'];

  // Filter state
  filterState: FilterState;
  
  // Toggle state for showing matched opportunities
  showMatchedOpportunities = true;
  
  filterOptions: HrbpFilterOptions = {
    leaders: [],
    jobLevels: [],
    jobFamilies: [],
    jobProfiles: [],
    tenureOptions: [],
    locationOptions: [],
    attritionResponseOptions: [],
    performanceRatingOptions: [],
    rotationLevelOptions: [],
    rotationLengthOptions: []
  };
  filterLabels: Record<string, string> = {
    department: 'Department',
    location: 'Location',
    skills: 'Skills',
    performanceRating: 'Performance',
    rotationInterest: 'Rotation Interest',
    rotationLength: 'Duration'
  };

  // Constants
  readonly CONSTANTS = APP_CONSTANTS;

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private skillsAnalyticsService: SkillsAnalyticsService,
    private snackBar: MatSnackBar,
    private filterService: FilterService,
    private jobLevelsService: JobLevelsService,
    private hrbpFilterService: HrbpFilterService
  ) {
    this.filterState = this.filterService.createInitialFilterState();
  }

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadEmployees();
    this.loadAllFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOpportunities(): void {
    this.dashboardState.isLoading = true;
    this.dashboardState.error = null;
    
    this.opportunityService.getOpportunities()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.dashboardState.isLoading = false)
      )
      .subscribe({
        next: opportunities => {
          this.opportunities = opportunities;
          this.applyOpportunityFilters();
          this.updateSkillsAnalytics();
        },
        error: error => {
          this.dashboardState.error = 'Failed to load opportunities. Please try again.';
          this.snackBar.open(this.dashboardState.error, 'Close', { 
            duration: this.CONSTANTS.SNACKBAR_DURATION.MEDIUM 
          });
        }
      });
  }

  loadEmployees(): void {
    this.dashboardState.isLoading = true;
    
    this.employeeService.getEmployees()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.dashboardState.isLoading = false)
      )
      .subscribe({
        next: employees => {
          this.employees = employees;
          this.updateSkillsAnalytics();
        },
        error: error => {
          this.dashboardState.error = 'Failed to load employees. Please try again.';
          this.snackBar.open(this.dashboardState.error, 'Close', { 
            duration: this.CONSTANTS.SNACKBAR_DURATION.MEDIUM 
          });
        }
      });
  }

  loadAllFilterOptions(): void {
    this.hrbpFilterService.getAllFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.filterOptions = options;
          console.log('Loaded all filter options:', options);
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.snackBar.open('Error loading filter options', 'Close', { 
            duration: this.CONSTANTS.SNACKBAR_DURATION.MEDIUM 
          });
        }
      });
  }

  /**
   * Apply filters to opportunities including the hide matched toggle
   */
  applyOpportunityFilters(): void {
    let filtered = [...this.opportunities];
    
    // Apply show matched opportunities filter
    if (!this.showMatchedOpportunities) {
      filtered = filtered.filter(opportunity => !opportunity.assignedEmployee);
    }
    
    this.filteredOpportunities = filtered;
  }

  /**
   * Handle toggle for showing/hiding matched opportunities
   */
  onToggleMatchedOpportunities(): void {
    this.applyOpportunityFilters();
  }

  updateSkillsAnalytics(): void {
    if (this.opportunities.length > 0 && this.employees.length > 0) {
      const uniqueSkills = this.extractUniqueSkills();
      const { skillDemandMap, skillSupplyMap } = this.calculateSkillMaps();
      const skillGaps = this.calculateSkillGaps(skillDemandMap, skillSupplyMap);

      this.skillsAnalytics = {
        totalUniqueSkills: uniqueSkills.size,
        totalOpportunities: this.opportunities.length,
        totalEmployees: this.employees.length,
        skillGaps,
        criticalGaps: skillGaps.filter(gap => gap.severity === 'critical')
      };
    }
  }

  private extractUniqueSkills(): Set<string> {
    const uniqueSkills = new Set<string>();
    
    this.opportunities.forEach(opp => {
      opp.requiredSkills.forEach(skill => uniqueSkills.add(skill));
      opp.preferredSkills.forEach(skill => uniqueSkills.add(skill));
    });
    
    this.employees.forEach(emp => {
      emp.skills.forEach(skill => uniqueSkills.add(skill));
    });
    
    return uniqueSkills;
  }

  private calculateSkillMaps(): { skillDemandMap: Map<string, number>, skillSupplyMap: Map<string, number> } {
    const skillDemandMap = new Map<string, number>();
    const skillSupplyMap = new Map<string, number>();

    this.opportunities.forEach(opp => {
      [...opp.requiredSkills, ...opp.preferredSkills].forEach(skill => {
        skillDemandMap.set(skill, (skillDemandMap.get(skill) || 0) + 1);
      });
    });

    this.employees.forEach(emp => {
      emp.skills.forEach(skill => {
        skillSupplyMap.set(skill, (skillSupplyMap.get(skill) || 0) + 1);
      });
    });

    return { skillDemandMap, skillSupplyMap };
  }

  private calculateSkillGaps(skillDemandMap: Map<string, number>, skillSupplyMap: Map<string, number>): SkillGap[] {
    const skillGaps: SkillGap[] = [];
    const allSkills = new Set([...skillDemandMap.keys(), ...skillSupplyMap.keys()]);
    
    allSkills.forEach(skill => {
      const demand = skillDemandMap.get(skill) || 0;
      const supply = skillSupplyMap.get(skill) || 0;
      const gap = demand - supply;
      
      let status: 'shortage' | 'balanced' | 'surplus';
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

    return skillGaps;
  }

  getSkillShortages(): number {
    if (!this.skillsAnalytics?.skillGaps) return 0;
    return this.skillsAnalytics.skillGaps.filter(gap => gap.status === 'shortage').length;
  }

  getCurrentMatches(): number {
    // Count opportunities that have been assigned to employees
    return this.opportunities.filter(opp => opp.assignedEmployeeId).length;
  }

  getUniqueAssignedEmployees(): number {
    const assignedEmployeeIds = new Set(
      this.opportunities
        .filter(opp => opp.assignedEmployeeId)
        .map(opp => opp.assignedEmployeeId)
    );
    return assignedEmployeeIds.size;
  }

  getMatchCompletionRate(): number {
    if (this.opportunities.length === 0) return 0;
    const completionRate = (this.getCurrentMatches() / this.opportunities.length) * 100;
    return Math.round(completionRate);
  }

  getMatchesTableData(): MatchTableData[] {
    return this.opportunities
      .filter(opp => opp.assignedEmployeeId && opp.assignedEmployee)
      .map(opp => {
        const employee = opp.assignedEmployee!;
        const matchingSkills = this.calculateMatchingSkills(employee, opp);
        
        return {
          opportunityId: opp.id,
          employeeId: opp.assignedEmployeeId!,
          employeeName: employee.name,
          employeeRole: employee.currentRole,
          opportunityTitle: opp.title,
          opportunityDepartment: opp.department,
          assignmentDate: opp.assignmentDate || new Date().toISOString(),
          duration: opp.duration || 'Not specified',
          location: opp.location,
          remote: opp.remote,
          matchingSkills: matchingSkills
        };
      });
  }

  private calculateMatchingSkills(employee: Employee, opportunity: Opportunity): string[] {
    const employeeSkills = new Set(employee.skills);
    const requiredSkills = opportunity.requiredSkills || [];
    const preferredSkills = opportunity.preferredSkills || [];
    const allOpportunitySkills = [...requiredSkills, ...preferredSkills];
    
    return allOpportunitySkills.filter(skill => employeeSkills.has(skill));
  }

  exportMatchesToCSV(): void {
    const matchesData = this.getMatchesTableData();
    
    if (matchesData.length === 0) {
      this.snackBar.open('No matches to export', 'Close', { 
        duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT 
      });
      return;
    }

    const csvContent = this.generateCSVContent(matchesData);
    this.downloadCSVFile(csvContent);

    this.snackBar.open('Matches exported successfully', 'Close', { 
      duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT 
    });
  }

  private generateCSVContent(matchesData: MatchTableData[]): string {
    const headers = [
      'Employee Name', 'Employee Role', 'Opportunity Title', 'Department',
      'Assignment Date', 'Duration', 'Location', 'Remote', 'Matching Skills'
    ];

    const csvRows = matchesData.map(match => [
      match.employeeName,
      match.employeeRole,
      match.opportunityTitle,
      match.opportunityDepartment,
      new Date(match.assignmentDate).toLocaleDateString(),
      match.duration,
      match.location,
      match.remote ? 'Yes' : 'No',
      match.matchingSkills.join(this.CONSTANTS.CSV_EXPORT.FIELD_SEPARATOR)
    ]);

    return [
      headers.join(','),
      ...csvRows.map(row => row.map(field => 
        `${this.CONSTANTS.CSV_EXPORT.QUOTE_CHAR}${field}${this.CONSTANTS.CSV_EXPORT.QUOTE_CHAR}`
      ).join(','))
    ].join('\n');
  }

  private downloadCSVFile(csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `matches-summary-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  viewMatchDetails(match: MatchTableData): void {
    const opportunity = this.opportunities.find(opp => opp.id === match.opportunityId);
    if (opportunity) {
      this.openOpportunityModal(opportunity);
    }
  }

  removeMatch(match: MatchTableData): void {
    const opportunity = this.opportunities.find(opp => opp.id === match.opportunityId);
    if (opportunity) {
      this.opportunityService.removeAssignment(opportunity.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Assignment removed successfully', 'Close', { 
              duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT 
            });
            this.loadOpportunities(); // Refresh data
          },
          error: (error: any) => {
            this.dashboardState.error = 'Failed to remove assignment. Please try again.';
            this.snackBar.open(this.dashboardState.error, 'Close', { 
              duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT 
            });
          }
        });
    }
  }

  getFilteredOpportunities(): Opportunity[] {
    return this.opportunities; // Simplified for now
  }

  onFilterChange(filterState?: FilterState): void {
    if (filterState) {
      this.filterState = filterState;
    }
    // Apply filters using the FilterService
    this.filteredOpportunities = this.filterService.applyFilters(this.opportunities, this.filterState);
  }

  clearAllFilters(): void {
    this.filterState = this.filterService.createInitialFilterState();
    this.onFilterChange();
  }

  clearFilter(filterType: keyof FilterState): void {
    this.filterState = this.filterService.clearFilter(this.filterState, filterType);
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return this.filterService.hasActiveFilters(this.filterState);
  }

  clearSearch(): void {
    this.filterState.searchTerm = '';
    this.onFilterChange();
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
      width: this.CONSTANTS.DIALOG_CONFIG.OPPORTUNITY_MODAL.width,
      maxWidth: this.CONSTANTS.DIALOG_CONFIG.OPPORTUNITY_MODAL.maxWidth,
      data: { match }
    });
  }

  openEmployeeModal(employee: Employee): void {
    this.dialog.open(EmployeeDetailModalComponent, {
      width: this.CONSTANTS.DIALOG_CONFIG.EMPLOYEE_DETAIL.maxWidth,
      maxWidth: this.CONSTANTS.DIALOG_CONFIG.EMPLOYEE_DETAIL.width,
      data: { employee }
    });
  }

  calculateEmployeeMatches(opportunity: Opportunity): void {
    // Filter out employees who are already assigned to other opportunities
    const availableEmployees = this.getAvailableEmployees();
    
    // Create opportunity-specific employee matches with varied results
    let potentialMatches = availableEmployees.map(employee => {
      const allSkills = [...opportunity.requiredSkills, ...opportunity.preferredSkills];
      const matchingSkills = employee.skills.filter((skill: string) => 
        allSkills.some(reqSkill => reqSkill.toLowerCase().includes(skill.toLowerCase()))
      );
      
      const missingSkills = opportunity.requiredSkills.filter((skill: string) => 
        !employee.skills.includes(skill)
      );
      
      // Calculate base match score
      let score = 0;
      
      // Skills match weight
      const skillMatchRatio = matchingSkills.length / (opportunity.requiredSkills.length + opportunity.preferredSkills.length);
      score += skillMatchRatio * this.CONSTANTS.SCORING_WEIGHTS.SKILLS_MATCH;
      
      // Performance rating weight
      const performanceScore = this.CONSTANTS.PERFORMANCE_SCORES[employee.performanceRating] || 2;
      score += (performanceScore / 5) * this.CONSTANTS.SCORING_WEIGHTS.PERFORMANCE;
      
      // Career interest alignment weight
      const interestAlignment = this.calculateInterestAlignment(employee, opportunity);
      score += interestAlignment * this.CONSTANTS.SCORING_WEIGHTS.CAREER_INTEREST;
      
      // Availability and rotation interest weight
      if (employee.confirmedInterestInRotation && employee.leadershipSupportOfRotation) {
        score += this.CONSTANTS.SCORING_WEIGHTS.AVAILABILITY;
      } else if (employee.confirmedInterestInRotation || employee.leadershipSupportOfRotation) {
        score += this.CONSTANTS.SCORING_WEIGHTS.AVAILABILITY / 2;
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
    let filteredMatches = matches.filter(match => match.matchScore > this.CONSTANTS.MATCH_SCORES.MINIMUM);
    
    // Sort by match score
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit to top matches per opportunity for variety
    const maxMatches = opportunity.id === '5' ? 
      this.CONSTANTS.MATCH_LIMITS.SPECIAL_CASE_MAX : 
      Math.min(this.CONSTANTS.MATCH_LIMITS.DEFAULT_MAX, Math.max(this.CONSTANTS.MATCH_LIMITS.DEFAULT_MIN, filteredMatches.length));
    
    return filteredMatches.slice(0, maxMatches);
  }

  getExcellentMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore >= this.CONSTANTS.MATCH_SCORES.EXCELLENT);
  }

  getOtherMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore < this.CONSTANTS.MATCH_SCORES.EXCELLENT);
  }

  /**
   * Show all available employees when no matches are found
   */
  showAllAvailableEmployees(): void {
    if (!this.dashboardState.selectedOpportunity) return;
    
    // Get all available employees (not assigned to any opportunity)
    const availableEmployees = this.getAvailableEmployees();
    
    // Create basic employee matches for display (without detailed scoring)
    this.employeeMatches = availableEmployees.map(employee => ({
      employee,
      matchScore: 0, // Set to 0 to indicate these are unscored matches
      matchingSkills: [],
      missingSkills: [],
      experienceMatch: false,
      departmentMatch: false,
      availabilityMatch: true
    }));
  }

  /**
   * Quick assign the AI recommended employee to the selected opportunity
   */
  quickAssignRecommendedEmployee(employee: Employee): void {
    if (!this.dashboardState.selectedOpportunity || !employee) return;

    this.opportunityService.assignEmployee(
      this.dashboardState.selectedOpportunity.id,
      employee.id,
      employee
    ).subscribe({
      next: (updatedOpportunity) => {
        // Update the opportunity in our local array
        const index = this.opportunities.findIndex(opp => opp.id === updatedOpportunity.id);
        if (index !== -1) {
          this.opportunities[index] = updatedOpportunity;
          this.dashboardState.selectedOpportunity = updatedOpportunity;
          this.applyOpportunityFilters();
        }
        
        // Show success message
        this.snackBar.open(
          `Successfully assigned ${employee.name} to ${updatedOpportunity.title}`,
          'Close',
          { duration: 3000 }
        );

        // Clear employee matches to refresh the recommendations
        this.employeeMatches = [];
        this.dashboardState.selectedEmployee = null;
      },
      error: (error) => {
        console.error('Error assigning employee:', error);
        this.snackBar.open(
          'Failed to assign employee. Please try again.',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  closeEmployeePanel(): void {
    this.dashboardState.showEmployeePanel = false;
    // Clear selected employee match state
  }

  toggleInstructionPopup(): void {
    this.dashboardState.showInstructionPopup = !this.dashboardState.showInstructionPopup;
  }

  onTabChange(index: number): void {
    this.dashboardState.selectedTabIndex = index;
  }

  showEmployeeDetails(employee: Employee): void {
    this.openEmployeeModal(employee);
  }

  onOpportunityClick(opportunity: Opportunity): void {
    this.dashboardState.selectedOpportunity = opportunity;
    this.calculateEmployeeMatches(opportunity);
    this.dashboardState.showEmployeePanel = true;
  }

  onEmployeeClick(employee: Employee): void {
    this.dashboardState.selectedEmployee = employee;
  }

  // Quick assignment functionality
  canQuickAssign(): boolean {
    return !!(this.dashboardState.selectedOpportunity && this.dashboardState.selectedEmployee && !this.dashboardState.selectedOpportunity.assignedEmployee);
  }

  quickAssignEmployee(): void {
    if (!this.dashboardState.selectedOpportunity || !this.dashboardState.selectedEmployee) return;
    
    this.opportunityService.assignEmployee(this.dashboardState.selectedOpportunity.id, this.dashboardState.selectedEmployee.id, this.dashboardState.selectedEmployee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Assigned ${this.dashboardState.selectedEmployee!.name} to ${this.dashboardState.selectedOpportunity!.title}`,
            'Close',
            { duration: this.CONSTANTS.SNACKBAR_DURATION.MEDIUM }
          );
          this.loadOpportunities(); // Refresh data
          this.dashboardState.selectedEmployee = null; // Clear selection
          // Recalculate matches to exclude newly assigned employee
          if (this.dashboardState.selectedOpportunity) {
            this.calculateEmployeeMatches(this.dashboardState.selectedOpportunity);
          }
        },
        error: (error) => {
          this.snackBar.open(
            'Failed to assign employee. Please try again.',
            'Close',
            { duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT }
          );
        }
      });
  }

  quickRemoveAssignment(): void {
    if (!this.dashboardState.selectedOpportunity?.assignedEmployee) return;
    
    this.opportunityService.removeAssignment(this.dashboardState.selectedOpportunity.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Removed assignment from ${this.dashboardState.selectedOpportunity!.title}`,
            'Close',
            { duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT }
          );
          this.loadOpportunities(); // Refresh data
          // Recalculate matches to include newly available employee
          if (this.dashboardState.selectedOpportunity) {
            this.calculateEmployeeMatches(this.dashboardState.selectedOpportunity);
          }
        },
        error: (error) => {
          this.snackBar.open(
            'Failed to remove assignment. Please try again.',
            'Close',
            { duration: this.CONSTANTS.SNACKBAR_DURATION.SHORT }
          );
        }
      });
  }

  getEmployeeMatchScore(employee: Employee): number {
    if (!this.dashboardState.selectedOpportunity) return 0;
    const match = this.employeeMatches.find(m => m.employee.id === employee.id);
    return match ? Math.round(match.matchScore) : 0;
  }

  getMatchScoreClass(score: number): string {
    if (score >= this.CONSTANTS.MATCH_SCORES.VERY_GOOD) return 'high-match';
    if (score >= this.CONSTANTS.MATCH_SCORES.FAIR) return 'medium-match';
    return 'low-match';
  }

  // Smart assignment suggestions
  getTopRecommendation(): EmployeeMatch | null {
    if (!this.employeeMatches.length) return null;
    return this.employeeMatches[0]; // Highest scoring match
  }

  getRecommendationConfidence(match: EmployeeMatch): 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor' {
    if (match.matchScore >= this.CONSTANTS.MATCH_SCORES.EXCELLENT) return 'Excellent';
    if (match.matchScore >= this.CONSTANTS.MATCH_SCORES.VERY_GOOD) return 'Very Good';
    if (match.matchScore >= this.CONSTANTS.MATCH_SCORES.GOOD) return 'Good';
    if (match.matchScore >= this.CONSTANTS.MATCH_SCORES.FAIR) return 'Fair';
    return 'Poor';
  }

  getRecommendationReason(match: EmployeeMatch): string {
    const reasons = [];
    
    if (match.matchingSkills.length > 0) {
      reasons.push(`${match.matchingSkills.length} matching skills`);
    }
    
    if (match.employee.performanceRating === 'Outstanding') {
      reasons.push('outstanding performance');
    } else if (match.employee.performanceRating === 'Exceeds') {
      reasons.push('exceeds expectations');
    }
    
    if (match.employee.confirmedInterestInRotation) {
      reasons.push('rotation interest');
    }
    
    if (match.employee.leadershipSupportOfRotation) {
      reasons.push('leadership support');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'basic qualifications';
  }

  shouldHighlightAsRecommended(employee: Employee): boolean {
    const topMatch = this.getTopRecommendation();
    return topMatch?.employee.id === employee.id && topMatch.matchScore >= 75;
  }

  getSkillMatchPercentage(employee: Employee): number {
    if (!this.dashboardState.selectedOpportunity) return 0;
    const match = this.employeeMatches.find(m => m.employee.id === employee.id);
    if (!match) return 0;
    
    const totalSkills = this.dashboardState.selectedOpportunity.requiredSkills.length + this.dashboardState.selectedOpportunity.preferredSkills.length;
    return totalSkills > 0 ? Math.round((match.matchingSkills.length / totalSkills) * 100) : 0;
  }

  getAvailabilityStatus(employee: Employee): string {
    if (employee.confirmedInterestInRotation && employee.leadershipSupportOfRotation) {
      return 'Fully Available';
    } else if (employee.confirmedInterestInRotation) {
      return 'Interested';
    } else if (employee.leadershipSupportOfRotation) {
      return 'Supported';
    }
    return 'Limited';
  }

  getAvailabilityClass(employee: Employee): string {
    const status = this.getAvailabilityStatus(employee);
    switch (status) {
      case 'Fully Available': return 'availability-high';
      case 'Interested': 
      case 'Supported': return 'availability-medium';
      default: return 'availability-low';
    }
  }

  // Get employees who are not currently assigned to any opportunity
  getAvailableEmployees(): Employee[] {
    const assignedEmployeeIds = new Set(
      this.opportunities
        .filter(opp => opp.assignedEmployeeId)
        .map(opp => opp.assignedEmployeeId)
    );
    
    return this.employees.filter(employee => !assignedEmployeeIds.has(employee.id));
  }

  // Get count of available employees for display
  getAvailableEmployeeCount(): number {
    return this.getAvailableEmployees().length;
  }

  // Get count of assigned employees for display
  getAssignedEmployeeCount(): number {
    const assignedEmployeeIds = new Set(
      this.opportunities
        .filter(opp => opp.assignedEmployeeId)
        .map(opp => opp.assignedEmployeeId)
    );
    return assignedEmployeeIds.size;
  }



}
