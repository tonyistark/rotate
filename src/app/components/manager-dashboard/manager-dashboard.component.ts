import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { trigger, transition, style, animate } from '@angular/animations';
import { ManagerService, EmployeeWithMatches } from '../../services/manager.service';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { Match, Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ManagerDashboardComponent extends BaseComponent implements OnInit {
  teamMembers: EmployeeWithMatches[] = [];
  filteredTeamMembers: EmployeeWithMatches[] = [];
  loading = true;
  showAdvancedFilters = false;
  
  // Filter options
  jobLevels: string[] = [];
  departments: string[] = [];
  performanceRatings: string[] = [];
  tdiZones: string[] = [];
  retentionRisks: string[] = ['Alert', 'Monitor', 'Aware'];
  
  // Filter state
  filterState: any = {
    selectedJobLevel: '',
    selectedDepartment: '',
    selectedPerformance: '',
    selectedTdiZone: '',
    selectedRetentionRisk: ''
  };
  
  // Top skills
  topSkills: { name: string; count: number }[] = [];

  constructor(
    private managerService: ManagerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.performanceRatings = APP_CONSTANTS.RATING_CYCLE_OPTIONS;
    this.jobLevels = APP_CONSTANTS.JOB_LEVELS;
    this.loadTeamData();
  }

  loadTeamData(): void {
    this.managerService.getTeamWithMatches().subscribe(team => {
      this.teamMembers = team;
      this.filteredTeamMembers = [...team];
      this.extractFilterOptions();
      this.calculateTopSkills();
      this.loading = false;
    });
  }
  
  extractFilterOptions(): void {
    const employees = this.teamMembers.map(tm => tm.employee);
    
    // Extract unique departments
    this.departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();
    
    // Extract unique TDI zones
    this.tdiZones = [...new Set(employees.map(emp => emp.tdiZone).filter(Boolean))] as string[];
    this.tdiZones.sort();
  }
  
  onFilterChange(): void {
    this.applyFilters();
    this.calculateTopSkills();
  }
  
  applyFilters(): void {
    this.filteredTeamMembers = this.teamMembers.filter(teamMember => {
      const employee = teamMember.employee;
      
      const matchesJobLevel = !this.filterState.selectedJobLevel || 
        employee.level === this.filterState.selectedJobLevel;
        
      const matchesDepartment = !this.filterState.selectedDepartment || 
        employee.department === this.filterState.selectedDepartment;
        
      const matchesPerformance = !this.filterState.selectedPerformance || 
        employee.performanceRating === this.filterState.selectedPerformance;
        
      const matchesTdiZone = !this.filterState.selectedTdiZone || 
        employee.tdiZone === this.filterState.selectedTdiZone;
        
      const matchesRetentionRisk = !this.filterState.selectedRetentionRisk || 
        employee.retentionRisk === this.filterState.selectedRetentionRisk;
        
      return matchesJobLevel && matchesDepartment && matchesPerformance && 
             matchesTdiZone && matchesRetentionRisk;
    });
  }
  
  calculateTopSkills(): void {
    const skillCount = new Map<string, number>();
    
    // Count skills from filtered team members
    this.filteredTeamMembers.forEach(teamMember => {
      const skills = teamMember.employee.skills || [];
      skills.forEach(skill => {
        skillCount.set(skill, (skillCount.get(skill) || 0) + 1);
      });
    });
    
    // Convert to array and sort by count
    this.topSkills = Array.from(skillCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 skills
  }
  
  hasActiveFilters(): boolean {
    return this.filterState.selectedJobLevel !== '' ||
           this.filterState.selectedDepartment !== '' ||
           this.filterState.selectedPerformance !== '' ||
           this.filterState.selectedTdiZone !== '' ||
           this.filterState.selectedRetentionRisk !== '';
  }
  
  clearAllFilters(): void {
    this.filterState = {
      selectedJobLevel: '',
      selectedDepartment: '',
      selectedPerformance: '',
      selectedTdiZone: '',
      selectedRetentionRisk: ''
    };
    this.onFilterChange();
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  }



  assignOpportunity(employeeId: string, opportunityId: string, opportunityTitle: string): void {
    this.managerService.assignOpportunityToEmployee(employeeId, opportunityId);
    this.snackBar.open(
      `Assigned "${opportunityTitle}" to employee`,
      'Close',
      { duration: 3000 }
    );
  }

  removeAssignment(employeeId: string, opportunityId: string, opportunityTitle: string): void {
    this.managerService.removeAssignment(employeeId, opportunityId);
    this.snackBar.open(
      `Removed assignment "${opportunityTitle}"`,
      'Close',
      { duration: 3000 }
    );
  }

  isAssigned(employeeId: string, opportunityId: string): boolean {
    const employee = this.teamMembers.find(tm => tm.employee.id === employeeId);
    return employee?.assignments.includes(opportunityId) || false;
  }

  viewOpportunityDetails(match: Match): void {
    const dialogRef = this.dialog.open(OpportunityModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { match }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'applied') {
        // Handle if needed
      }
    });
  }

  override formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Not set';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString();
  }

  getTotalAssignments(): number {
    return this.teamMembers.reduce((total, member) => total + member.assignments.length, 0);
  }

  getHighPerformers(): number {
    return this.teamMembers.filter(member => 
      member.employee.performanceRating === 'Outstanding' || 
      member.employee.performanceRating === 'Exceeds'
    ).length;
  }

  getAverageMatchScore(): number {
    if (!this.teamMembers || this.teamMembers.length === 0) {
      return 0;
    }
    
    const allScores = this.teamMembers.flatMap(member => 
      member.topMatches?.map(match => match.score).filter(score => !isNaN(score) && score != null) || []
    );
    
    if (allScores.length === 0) {
      return 0;
    }
    
    const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    return Math.round(average);
  }

  override getAttritionRiskClass(risk: number): string {
    if (risk <= 15) return 'risk-low';
    if (risk <= 30) return 'risk-medium';
    return 'risk-high';
  }

  viewEmployeeDetails(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        // Update the employee in the team members array
        const teamMemberIndex = this.teamMembers.findIndex(tm => tm.employee.id === result.employee.id);
        if (teamMemberIndex !== -1) {
          this.teamMembers[teamMemberIndex].employee = result.employee;
          this.snackBar.open('Employee information updated successfully', 'Close', { duration: 3000 });
        }
      }
    });
  }

  copyEmployeeName(employee: Employee, event: Event): void {
    event.stopPropagation();
    const name = employee.name;
    navigator.clipboard.writeText(name).then(() => {
      this.snackBar.open(`Copied: ${name}`, 'Close', {
        duration: 2000
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.snackBar.open('Failed to copy name', 'Close', {
        duration: 2000
      });
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }


  viewAllOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }
}
