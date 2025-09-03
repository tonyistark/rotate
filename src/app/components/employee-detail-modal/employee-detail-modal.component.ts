import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Component({
  selector: 'app-employee-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatCardModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './employee-detail-modal.component.html',
  styleUrls: ['./employee-detail-modal.component.scss']
})
export class EmployeeDetailModalComponent extends BaseComponent {
  isEditMode = false;
  editableEmployee: Employee;
  originalEmployee: Employee;
  
  // Add skill input states
  showSkillInput: { [key: string]: boolean } = {};
  newSkillValues: { [key: string]: string } = {};

  readonly performanceRatings = APP_CONSTANTS.PERFORMANCE_RATINGS;
  readonly availabilityOptions = ['Full-time', 'Part-time'];
  readonly skillTypes = [
    'skills', 'interests', 'careerGoals', 'skillsetExperience', 
    'competencyStrengths', 'careerInterest', 'talentDevelopmentInventory'
  ] as const;

  constructor(
    public dialogRef: MatDialogRef<EmployeeDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee },
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
    this.originalEmployee = { ...data.employee };
    this.editableEmployee = { ...data.employee };
    this.initializeEmployeeDefaults();
    this.ensureRatingCycles();
  }

  get employee(): Employee {
    return this.isEditMode ? this.editableEmployee : this.originalEmployee;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Reset to original values if canceling
      this.editableEmployee = { ...this.originalEmployee };
    }
  }

  saveChanges(): void {
    // Update the original employee with editable values
    Object.assign(this.originalEmployee, this.editableEmployee);
    this.isEditMode = false;
    this.dialogRef.close({ action: 'save', employee: this.editableEmployee });
  }

  cancelEdit(): void {
    this.editableEmployee = { ...this.originalEmployee };
    this.isEditMode = false;
  }



  addSkill(skillType: typeof this.skillTypes[number]): void {
    this.showSkillInput[skillType] = true;
    this.newSkillValues[skillType] = '';
  }

  confirmAddSkill(skillType: typeof this.skillTypes[number]): void {
    const newSkill = this.newSkillValues[skillType];
    if (newSkill && newSkill.trim()) {
      if (!this.editableEmployee[skillType]) {
        this.editableEmployee[skillType] = [];
      }
      this.editableEmployee[skillType].push(newSkill.trim());
    }
    this.showSkillInput[skillType] = false;
    this.newSkillValues[skillType] = '';
  }

  cancelAddSkill(skillType: typeof this.skillTypes[number]): void {
    this.showSkillInput[skillType] = false;
    this.newSkillValues[skillType] = '';
  }

  removeSkill(skillType: typeof this.skillTypes[number], index: number): void {
    if (this.editableEmployee[skillType]) {
      this.editableEmployee[skillType].splice(index, 1);
    }
  }

  private initializeEmployeeDefaults(): void {
    // Initialize arrays if they don't exist
    this.skillTypes.forEach(field => {
      if (!this.editableEmployee[field as keyof Employee]) {
        (this.editableEmployee as any)[field] = [];
      }
    });

    // Initialize rating cycles if they don't exist
    if (!this.editableEmployee.ratingCycles) {
      this.editableEmployee.ratingCycles = {
        MY24: this.editableEmployee.myRating as any || 'Strong',
        YE24: this.editableEmployee.yeRating as any || 'Strong', 
        MY25: 'Strong'
      };
    }

    // Initialize boolean fields with defaults
    const booleanFields = [
      'preparingForPromo', 'preparingForStretch', 'preparingForRotation',
      'confirmedInterestInRotation', 'leadershipSupportOfRotation',
      'retentionPlanNeeded', 'rotationStechPlanNeeded'
    ];
    booleanFields.forEach(field => {
      if (this.editableEmployee[field as keyof Employee] === undefined) {
        (this.editableEmployee as any)[field] = false;
      }
    });
  }

  getTdiZoneClass(zone: string): string {
    return this.utilsService.getTdiZoneClass(zone);
  }

  getRatingClass(rating: string): string {
    return this.utilsService.getRatingClass(rating);
  }

  private ensureRatingCycles(): void {
    // Ensure ratingCycles is always defined for both employees
    if (!this.editableEmployee.ratingCycles) {
      this.editableEmployee.ratingCycles = {
        MY24: this.editableEmployee.myRating as any || 'Strong',
        YE24: this.editableEmployee.yeRating as any || 'Strong',
        MY25: 'Strong'
      };
    }
    if (!this.originalEmployee.ratingCycles) {
      this.originalEmployee.ratingCycles = {
        MY24: this.originalEmployee.myRating as any || 'Strong',
        YE24: this.originalEmployee.yeRating as any || 'Strong',
        MY25: 'Strong'
      };
    }
  }
}
