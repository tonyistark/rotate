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
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

import { NewEmployee } from '../../models/new-employee.model';
import { NewEmployeeService } from '../../services/new-employee.service';
import { NewEmployeeDetailModalComponent } from '../new-employee-detail-modal/new-employee-detail-modal.component';
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
    MatDialogModule
  ],
  templateUrl: './new-employee-list.component.html',
  styleUrls: ['./new-employee-list.component.scss']
})
export class NewEmployeeListComponent extends BaseComponent implements OnInit {
  employees: NewEmployee[] = [];
  filteredEmployees: NewEmployee[] = [];
  
  // Filter state
  filterState: FilterState;
  filterOptions: any = {};
  readonly filterLabels = FILTER_LABELS;

  constructor(
    private newEmployeeService: NewEmployeeService,
    private dialog: MatDialog,
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
    this.newEmployeeService.getNewEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.filteredEmployees = employees;
        this.extractFilterOptions();
      });
  }

  extractFilterOptions(): void {
    this.filterOptions = {
      jobLevels: ['All', ...new Set(this.employees.map(emp => emp.job_level))],
      jobFamilies: ['All', ...new Set(this.employees.map(emp => emp.job_family))],
      devZones: ['All', ...new Set(this.employees.map(emp => emp.dev_zone))],
      lossImpacts: ['All', ...new Set(this.employees.map(emp => emp.loss_impact))],
      attritionRisks: ['All', ...new Set(this.employees.map(emp => emp.attrition_risk))],
      roleTypes: ['All', ...new Set(this.employees.map(emp => emp.role_type))],
      specializations: ['All', ...new Set(this.employees.map(emp => emp.specialization))],
      overallRatings: ['All', ...new Set(this.employees.map(emp => emp.overall_rating))],
      departments: ['All', ...new Set(this.employees.map(emp => emp.department).filter(Boolean))]
    };
  }

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = !this.filterState.searchTerm || 
        employee.full_name.toLowerCase().includes(this.filterState.searchTerm.toLowerCase()) ||
        employee.job_level.toLowerCase().includes(this.filterState.searchTerm.toLowerCase()) ||
        employee.specialization.toLowerCase().includes(this.filterState.searchTerm.toLowerCase());

      const matchesJobLevel = !this.filterState.selectedJobLevel || 
        this.filterState.selectedJobLevel === 'All' || 
        employee.job_level === this.filterState.selectedJobLevel;

      const matchesJobFamily = !this.filterState.selectedJobFamily || 
        this.filterState.selectedJobFamily === 'All' || 
        employee.job_family === this.filterState.selectedJobFamily;

      const matchesDevZone = !this.filterState.selectedDayZero || 
        this.filterState.selectedDayZero === 'All' || 
        employee.dev_zone === this.filterState.selectedDayZero;

      const matchesLossImpact = !this.filterState.selectedLossImpact || 
        this.filterState.selectedLossImpact === 'All' || 
        employee.loss_impact === this.filterState.selectedLossImpact;

      const matchesAttritionRisk = !this.filterState.selectedAttritionRisk || 
        this.filterState.selectedAttritionRisk === 'All' || 
        employee.attrition_risk === this.filterState.selectedAttritionRisk;

      return matchesSearch && matchesJobLevel && matchesJobFamily && 
             matchesDevZone && matchesLossImpact && matchesAttritionRisk;
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

  showEmployeeDetails(employee: NewEmployee): void {
    const dialogRef = this.dialog.open(NewEmployeeDetailModalComponent, {
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
}
