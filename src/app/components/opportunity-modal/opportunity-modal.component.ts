import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntil } from 'rxjs/operators';
import { Match, Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-opportunity-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './opportunity-modal.component.html',
  styleUrls: ['./opportunity-modal.component.scss']
})
export class OpportunityModalComponent extends BaseComponent implements OnInit {
  availableEmployees: Employee[] = [];
  selectedEmployeeId: string = '';

  constructor(
    public dialogRef: MatDialogRef<OpportunityModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: Match, availableEmployees?: Employee[] },
    private snackBar: MatSnackBar,
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.loadAvailableEmployees();
  }

  private loadAvailableEmployees(): void {
    if (this.data.availableEmployees) {
      this.availableEmployees = this.data.availableEmployees;
    } else {
      this.employeeService.getEmployees()
        .pipe(takeUntil(this.destroy$))
        .subscribe(employees => {
          this.availableEmployees = employees;
        });
    }
  }

  get match(): Match {
    return this.data.match;
  }


  onClose(): void {
    this.dialogRef.close();
  }

  onEmployeeSelected(event: any): void {
    this.selectedEmployeeId = event.value;
  }

  assignEmployee(): void {
    if (!this.selectedEmployeeId) return;

    const selectedEmployee = this.availableEmployees.find(emp => emp.id === this.selectedEmployeeId);
    if (!selectedEmployee) return;

    this.opportunityService.assignEmployee(
      this.match.opportunity.id,
      this.selectedEmployeeId,
      selectedEmployee
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedOpportunity) => {
        this.data.match.opportunity = updatedOpportunity;
        this.selectedEmployeeId = '';
        this.snackBar.open(
          `${selectedEmployee.name} has been assigned to this opportunity`,
          'Close',
          { duration: 3000 }
        );
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

  removeAssignment(): void {
    this.opportunityService.removeAssignment(this.match.opportunity.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOpportunity) => {
          this.data.match.opportunity = updatedOpportunity;
          this.snackBar.open(
            'Employee assignment has been removed',
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('Error removing assignment:', error);
          this.snackBar.open(
            'Failed to remove assignment. Please try again.',
            'Close',
            { duration: 3000 }
          );
        }
      });
  }

}
