import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { takeUntil } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { BaseComponent } from '../../shared/base/base.component';
import { FilterService, FilterState } from '../../shared/services/filter.service';
import { UtilsService } from '../../shared/services/utils.service';
import { APP_CONSTANTS, FILTER_LABELS } from '../../shared/constants/app.constants';

@Component({
  selector: 'app-new-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './new-employee-list.component.html',
  styleUrls: ['./new-employee-list.component.scss'],
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
export class NewEmployeeListComponent extends BaseComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  
  // Filter state
  filterState: FilterState;
  filterOptions: any = {};
  readonly filterLabels = FILTER_LABELS;
  
  // Skills search
  selectedSkills: string[] = [];
  skillInput: string = '';
  allSkills: string[] = [];
  filteredSkillOptions: string[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  // UI state
  showAdvancedFilters: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
    this.filterState = this.filterService.createInitialFilterState();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.filteredEmployees = employees;
        this.extractFilterOptions();
        this.extractSkills();
      });
  }

  extractFilterOptions(): void {
    this.filterOptions = {
      jobLevels: ['All', ...APP_CONSTANTS.JOB_LEVELS],
      jobFamilies: ['All', ...new Set(this.employees.map(emp => emp.jobFamily || emp.department).filter(Boolean))],
      devZones: ['All', ...new Set(this.employees.map(emp => emp.tdiZone).filter(Boolean))],
      lossImpacts: ['All', 'Low', 'Medium', 'High'], // Standard loss impact levels
      attritionRisks: ['All', 'Low', 'Medium', 'High'], // Standard attrition risk levels
      roleTypes: ['All', ...new Set(this.employees.map(emp => emp.jobTitle || emp.currentRole).filter(Boolean))],
      specializations: ['All', ...new Set(this.employees.map(emp => emp.currentRole).filter(Boolean))],
      overallRatings: ['All', ...new Set(this.employees.map(emp => emp.performanceRating).filter(Boolean))],
      departments: ['All', ...new Set(this.employees.map(emp => emp.department).filter(Boolean))],
      managers: [...new Set(this.employees.map(emp => emp.reportsTo).filter(Boolean))].sort()
    };
  }
  
  extractSkills(): void {
    const skillsSet = new Set<string>();
    this.employees.forEach(emp => {
      if (emp.skills) {
        emp.skills.forEach(skill => skillsSet.add(skill));
      }
    });
    this.allSkills = Array.from(skillsSet).sort();
    this.filteredSkillOptions = [...this.allSkills];
  }

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = !this.filterState.searchTerm || 
        employee.name.toLowerCase().includes(this.filterState.searchTerm.toLowerCase()) ||
        (employee.level && employee.level.toLowerCase().includes(this.filterState.searchTerm.toLowerCase())) ||
        (employee.currentRole || '').toLowerCase().includes(this.filterState.searchTerm.toLowerCase()) ||
        (employee.department && employee.department.toLowerCase().includes(this.filterState.searchTerm.toLowerCase()));

      const matchesSkills = this.selectedSkills.length === 0 || 
        (employee.skills && this.selectedSkills.every(skill => 
          employee.skills!.some(empSkill => 
            empSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ));

      const matchesJobLevel = !this.filterState.selectedJobLevel || 
        this.filterState.selectedJobLevel === 'All' || 
        (employee.level && employee.level === this.filterState.selectedJobLevel) ||
        employee.currentRole === this.filterState.selectedJobLevel;

      const matchesJobFamily = !this.filterState.selectedJobFamily || 
        this.filterState.selectedJobFamily === 'All' || 
        employee.department === this.filterState.selectedJobFamily;

      const matchesDevZone = !this.filterState.selectedDayZero || 
        this.filterState.selectedDayZero === 'All' || 
        employee.tdiZone === this.filterState.selectedDayZero;

      const matchesLossImpact = !this.filterState.selectedLossImpact || 
        this.filterState.selectedLossImpact === 'All' || 
        this.getLossImpactFromEmployee(employee) === this.filterState.selectedLossImpact;

      const matchesAttritionRisk = !this.filterState.selectedAttritionRisk || 
        this.filterState.selectedAttritionRisk === 'All' || 
        this.getAttritionRiskFromEmployee(employee) === this.filterState.selectedAttritionRisk;

      const matchesReportsTo = !this.filterState.selectedReportsTo || 
        this.filterState.selectedReportsTo === '' || 
        employee.reportsTo === this.filterState.selectedReportsTo;

      return matchesSearch && matchesSkills && matchesJobLevel && matchesJobFamily && 
             matchesDevZone && matchesLossImpact && matchesAttritionRisk && matchesReportsTo;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.filterState.searchTerm = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return this.filterService.hasActiveFilters(this.filterState) || this.selectedSkills.length > 0;
  }

  clearFilter(filterType: keyof FilterState): void {
    this.filterState = this.filterService.clearFilter(this.filterState, filterType);
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.filterState = this.filterService.clearAllFilters(this.filterState);
    this.selectedSkills = [];
    this.skillInput = '';
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
          // Employee updated successfully
        }
      });
  }

  getDevZoneClass(zone: string): string {
    return this.utilsService.getTdiZoneClass(zone);
  }

  getRatingClass(rating: string): string {
    return this.utilsService.getRatingClass(rating);
  }

  override getAttritionRiskClass(risk: string | number): string {
    if (typeof risk === 'number') {
      return super.getAttritionRiskClass(risk);
    }
    const riskMap: { [key: string]: string } = {
      'Low': 'low-risk',
      'Medium': 'medium-risk', 
      'High': 'high-risk'
    };
    return riskMap[risk] || '';
  }

  getLossImpactClass(impact: string): string {
    const impactMap: { [key: string]: string } = {
      'Low': 'low-impact',
      'Medium': 'medium-impact',
      'High': 'high-impact'
    };
    return impactMap[impact] || '';
  }

  // Helper methods to map Employee model to expected filter values
  getLossImpactFromEmployee(employee: Employee): string {
    // Map from Employee model - could be derived from attrition risk or other fields
    if (employee.attritionRisk <= 30) return 'Low';
    if (employee.attritionRisk <= 70) return 'Medium';
    return 'High';
  }

  getAttritionRiskFromEmployee(employee: Employee): string {
    // Map from Employee model attrition risk number to string
    if (employee.attritionRisk <= 30) return 'Low';
    if (employee.attritionRisk <= 70) return 'Medium';
    return 'High';
  }
  
  // Skills search methods
  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedSkills.includes(value)) {
      this.selectedSkills.push(value);
      this.onFilterChange();
    }
    event.chipInput!.clear();
    this.skillInput = '';
  }
  
  removeSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index >= 0) {
      this.selectedSkills.splice(index, 1);
      this.onFilterChange();
    }
  }
  
  skillSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.selectedSkills.includes(value)) {
      this.selectedSkills.push(value);
      this.onFilterChange();
    }
    this.skillInput = '';
    event.option.deselect();
  }
  
  getSkillMatchCount(employee: Employee): number {
    if (!employee.skills || this.selectedSkills.length === 0) {
      return 0;
    }
    return this.selectedSkills.filter(skill => 
      employee.skills!.some(empSkill => 
        empSkill.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;
  }
  
  // UI methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }
  
  onViewModeChange(): void {
    // View mode changed - could add analytics or other logic here
  }

  async copyEmployeeName(employee: Employee, event: Event): Promise<void> {
    event.stopPropagation();
    navigator.clipboard.writeText(employee.name).then(() => {
      this.snackBar.open('Name copied to clipboard', 'Close', {
        duration: 2000
      });
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
