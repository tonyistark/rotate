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
import { Employee } from '../../models/employee.model';

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
    MatCheckboxModule
  ],
  templateUrl: './employee-detail-modal.component.html',
  styleUrls: ['./employee-detail-modal.component.scss']
})
export class EmployeeDetailModalComponent {
  isEditMode = false;
  editableEmployee: Employee;
  originalEmployee: Employee;
  
  // Add skill input states
  showSkillInput: { [key: string]: boolean } = {};
  newSkillValues: { [key: string]: string } = {};

  performanceRatings = ['Outstanding', 'Exceeds', 'Meets', 'Below'];
  availabilityOptions = ['Full-time', 'Part-time'];

  constructor(
    public dialogRef: MatDialogRef<EmployeeDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public employee: Employee
  ) {
    this.originalEmployee = { ...employee };
    this.editableEmployee = { ...employee };
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

  formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Not set';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getAttritionRiskClass(risk: number): string {
    if (risk <= 15) return 'low-risk';
    if (risk <= 30) return 'medium-risk';
    return 'high-risk';
  }

  addSkill(skillType: 'skills' | 'interests' | 'careerGoals' | 'skillsetExperience' | 'competencyStrengths' | 'careerInterest' | 'talentDevelopmentInventory'): void {
    this.showSkillInput[skillType] = true;
    this.newSkillValues[skillType] = '';
  }

  confirmAddSkill(skillType: 'skills' | 'interests' | 'careerGoals' | 'skillsetExperience' | 'competencyStrengths' | 'careerInterest' | 'talentDevelopmentInventory'): void {
    const newSkill = this.newSkillValues[skillType];
    if (newSkill && newSkill.trim()) {
      this.editableEmployee[skillType].push(newSkill.trim());
    }
    this.showSkillInput[skillType] = false;
    this.newSkillValues[skillType] = '';
  }

  cancelAddSkill(skillType: 'skills' | 'interests' | 'careerGoals' | 'skillsetExperience' | 'competencyStrengths' | 'careerInterest' | 'talentDevelopmentInventory'): void {
    this.showSkillInput[skillType] = false;
    this.newSkillValues[skillType] = '';
  }

  removeSkill(skillType: 'skills' | 'interests' | 'careerGoals' | 'skillsetExperience' | 'competencyStrengths' | 'careerInterest' | 'talentDevelopmentInventory', index: number): void {
    this.editableEmployee[skillType].splice(index, 1);
  }
}
