import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntil } from 'rxjs/operators';
import { Match, Employee, Opportunity } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-opportunity-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './opportunity-modal.component.html',
  styleUrls: ['./opportunity-modal.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class OpportunityModalComponent extends BaseComponent implements OnInit {
  availableEmployees: Employee[] = [];
  selectedEmployeeId: string = '';
  
  // Edit mode properties
  isEditMode = false;
  editableOpportunity!: Opportunity;
  originalOpportunity!: Opportunity;
  
  // Chip input configuration
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  // Dropdown options
  readonly jobLevels = [
    'Associate',
    'Sr. Associate',
    'Principal Associate',
    'Manager',
    'Sr. Manager',
    'Director',
    'Sr. Director',
    'Vice President',
    'Managing VP',
    'Sr. VP',
    'Exec. VP'
  ];
  
  readonly rotationLengths = [
    '3 months',
    '6 months',
    '9 months',
    '12 months',
    '18 months',
    '24 months'
  ];

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

  // Edit mode methods
  toggleEditMode(): void {
    if (!this.isEditMode) {
      this.enterEditMode();
    } else {
      this.exitEditMode();
    }
  }

  enterEditMode(): void {
    this.isEditMode = true;
    this.editableOpportunity = JSON.parse(JSON.stringify(this.match.opportunity));
    this.originalOpportunity = JSON.parse(JSON.stringify(this.match.opportunity));
  }

  exitEditMode(): void {
    this.isEditMode = false;
    // Reset to original values
    this.match.opportunity = JSON.parse(JSON.stringify(this.originalOpportunity));
  }

  saveChanges(): void {
    const { id, ...opportunityData } = this.editableOpportunity;
    this.opportunityService.updateOpportunity(id, opportunityData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOpportunity) => {
          this.match.opportunity = updatedOpportunity;
          this.isEditMode = false;
          this.snackBar.open('Opportunity updated successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error saving opportunity:', error);
          this.snackBar.open('Failed to save changes. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  // Chip input methods for Required Skills
  addRequiredSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.editableOpportunity.requiredSkills) {
        this.editableOpportunity.requiredSkills = [];
      }
      this.editableOpportunity.requiredSkills.push(value);
    }
    event.chipInput!.clear();
  }

  removeRequiredSkill(index: number): void {
    if (this.editableOpportunity.requiredSkills && index >= 0) {
      this.editableOpportunity.requiredSkills.splice(index, 1);
    }
  }

  // Chip input methods for Preferred Skills
  addPreferredSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.editableOpportunity.preferredSkills) {
        this.editableOpportunity.preferredSkills = [];
      }
      this.editableOpportunity.preferredSkills.push(value);
    }
    event.chipInput!.clear();
  }

  removePreferredSkill(index: number): void {
    if (this.editableOpportunity.preferredSkills && index >= 0) {
      this.editableOpportunity.preferredSkills.splice(index, 1);
    }
  }

  // Chip input methods for Learning Outcomes
  addLearningOutcome(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.editableOpportunity.learningOutcomes) {
        this.editableOpportunity.learningOutcomes = [];
      }
      this.editableOpportunity.learningOutcomes.push(value);
    }
    event.chipInput!.clear();
  }

  removeLearningOutcome(index: number): void {
    if (this.editableOpportunity.learningOutcomes && index >= 0) {
      this.editableOpportunity.learningOutcomes.splice(index, 1);
    }
  }

}
