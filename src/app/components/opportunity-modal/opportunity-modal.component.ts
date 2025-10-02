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
  
  // Dynamic dropdown options
  departments: string[] = [];
  jobFamilies: string[] = [];
  locations: string[] = [];
  leaders: string[] = [];
  jobProfiles: string[] = [];
  tenureOptions: string[] = [];
  attritionResponseOptions: string[] = [];
  rotationLevelOptions: string[] = [];

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
    this.loadDropdownOptions();
  }
  
  private loadDropdownOptions(): void {
    // Load dynamic dropdown options from opportunities
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        // Extract unique values for each dropdown
        this.departments = this.extractUniqueValues(opportunities, 'department');
        this.jobFamilies = this.extractUniqueValues(opportunities, 'jobFamily');
        this.locations = this.extractUniqueValues(opportunities, 'location');
        this.leaders = this.extractUniqueValues(opportunities, 'leader');
        this.jobProfiles = this.extractUniqueValues(opportunities, 'jobProfile');
        this.tenureOptions = this.extractUniqueValues(opportunities, 'tenure');
        this.attritionResponseOptions = this.extractUniqueValues(opportunities, 'attritionResponse');
        this.rotationLevelOptions = this.extractUniqueValues(opportunities, 'rotationLevel');
      });
  }
  
  private extractUniqueValues(opportunities: Opportunity[], field: keyof Opportunity): string[] {
    const values = new Set<string>();
    opportunities.forEach(opp => {
      const value = opp[field];
      if (value && typeof value === 'string' && value.trim()) {
        values.add(value.trim());
      }
    });
    return Array.from(values).sort();
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

  onEmployeeSelected(event: { value: string }): void {
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
    
    // Initialize any undefined fields with defaults
    if (!this.editableOpportunity.requiredSkills) this.editableOpportunity.requiredSkills = [];
    if (!this.editableOpportunity.preferredSkills) this.editableOpportunity.preferredSkills = [];
    if (!this.editableOpportunity.learningOutcomes) this.editableOpportunity.learningOutcomes = [];
    if (!this.editableOpportunity.previousPerformanceRatings) this.editableOpportunity.previousPerformanceRatings = [];
    if (!this.editableOpportunity.plIc) this.editableOpportunity.plIc = 'IC';
    if (!this.editableOpportunity.lossImpact) this.editableOpportunity.lossImpact = 'Medium';
    if (!this.editableOpportunity.attritionRisk) this.editableOpportunity.attritionRisk = 'Medium';
    if (this.editableOpportunity.mentorAvailable === undefined) this.editableOpportunity.mentorAvailable = false;
    if (this.editableOpportunity.remote === undefined) this.editableOpportunity.remote = false;
    if (this.editableOpportunity.dayZero === undefined) this.editableOpportunity.dayZero = false;
  }

  exitEditMode(): void {
    this.isEditMode = false;
    // Reset to original values
    this.match.opportunity = JSON.parse(JSON.stringify(this.originalOpportunity));
  }

  saveChanges(): void {
    // Ensure all fields are included in the update
    const updatedOpportunity: Opportunity = {
      id: this.editableOpportunity.id,
      title: this.editableOpportunity.title,
      department: this.editableOpportunity.department,
      description: this.editableOpportunity.description,
      requiredSkills: this.editableOpportunity.requiredSkills || [],
      preferredSkills: this.editableOpportunity.preferredSkills || [],
      timeCommitment: this.editableOpportunity.timeCommitment,
      duration: this.editableOpportunity.duration,
      learningOutcomes: this.editableOpportunity.learningOutcomes || [],
      mentorAvailable: this.editableOpportunity.mentorAvailable,
      remote: this.editableOpportunity.remote,
      level: this.editableOpportunity.level,
      applicationDeadline: this.editableOpportunity.applicationDeadline,
      startDate: this.editableOpportunity.startDate,
      submittedBy: this.editableOpportunity.submittedBy,
      leader: this.editableOpportunity.leader,
      jobLevel: this.editableOpportunity.jobLevel,
      jobFamily: this.editableOpportunity.jobFamily,
      jobProfile: this.editableOpportunity.jobProfile,
      plIc: this.editableOpportunity.plIc,
      tenure: this.editableOpportunity.tenure,
      location: this.editableOpportunity.location,
      dayZero: this.editableOpportunity.dayZero,
      lossImpact: this.editableOpportunity.lossImpact,
      attritionRisk: this.editableOpportunity.attritionRisk,
      attritionResponse: this.editableOpportunity.attritionResponse,
      previousPerformanceRatings: this.editableOpportunity.previousPerformanceRatings || [],
      rotationLevel: this.editableOpportunity.rotationLevel,
      rotationLength: this.editableOpportunity.rotationLength,
      // Preserve assignment fields if they exist
      assignedEmployeeId: this.editableOpportunity.assignedEmployeeId,
      assignedEmployee: this.editableOpportunity.assignedEmployee,
      assignmentDate: this.editableOpportunity.assignmentDate
    };

    const { id, ...opportunityData } = updatedOpportunity;
    this.opportunityService.updateOpportunity(id, opportunityData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedOpportunity) => {
          this.match.opportunity = savedOpportunity;
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

  // Chip input methods for Previous Performance Ratings
  addPerformanceRating(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.editableOpportunity.previousPerformanceRatings) {
        this.editableOpportunity.previousPerformanceRatings = [];
      }
      this.editableOpportunity.previousPerformanceRatings.push(value);
    }
    event.chipInput!.clear();
  }

  removePerformanceRating(index: number): void {
    if (this.editableOpportunity.previousPerformanceRatings && index >= 0) {
      this.editableOpportunity.previousPerformanceRatings.splice(index, 1);
    }
  }

}
