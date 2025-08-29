import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OpportunityService } from '../../services/opportunity.service';
import { Opportunity } from '../../models/employee.model';

@Component({
  selector: 'app-create-opportunity',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './create-opportunity.component.html',
  styleUrls: ['./create-opportunity.component.scss']
})
export class CreateOpportunityComponent implements OnInit {
  opportunityForm: FormGroup;
  departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
  levels = ['Entry', 'Mid', 'Senior', 'Lead'];
  timeCommitments = ['10-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
  durations = ['1-3 months', '3-6 months', '6-12 months', '12+ months'];
  
  isEditMode = false;
  opportunityId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.opportunityForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.opportunityId = params['id'];
        this.loadOpportunity(params['id']);
      }
    });
  }

  loadOpportunity(id: string): void {
    const opportunity = this.opportunityService.getOpportunityById(id);
    if (opportunity) {
      this.populateForm(opportunity);
    } else {
      this.snackBar.open('Opportunity not found', 'Close', { duration: 3000 });
      this.router.navigate(['/opportunities']);
    }
  }

  populateForm(opportunity: Opportunity): void {
    // Clear existing form arrays
    this.requiredSkills.clear();
    this.preferredSkills.clear();
    this.learningOutcomes.clear();

    // Populate basic fields
    this.opportunityForm.patchValue({
      title: opportunity.title,
      department: opportunity.department,
      description: opportunity.description,
      timeCommitment: opportunity.timeCommitment,
      duration: opportunity.duration,
      mentorAvailable: opportunity.mentorAvailable,
      remote: opportunity.remote,
      level: opportunity.level,
      applicationDeadline: new Date(opportunity.applicationDeadline),
      startDate: new Date(opportunity.startDate)
    });

    // Populate required skills
    opportunity.requiredSkills.forEach(skill => {
      this.requiredSkills.push(this.fb.control(skill, Validators.required));
    });

    // Populate preferred skills
    opportunity.preferredSkills.forEach(skill => {
      this.preferredSkills.push(this.fb.control(skill, Validators.required));
    });

    // Populate learning outcomes
    opportunity.learningOutcomes.forEach(outcome => {
      this.learningOutcomes.push(this.fb.control(outcome, Validators.required));
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      department: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      requiredSkills: this.fb.array([]),
      preferredSkills: this.fb.array([]),
      timeCommitment: ['', Validators.required],
      duration: ['', Validators.required],
      learningOutcomes: this.fb.array([]),
      mentorAvailable: [false],
      remote: [false],
      level: ['', Validators.required],
      applicationDeadline: ['', Validators.required],
      startDate: ['', Validators.required]
    });
  }

  get requiredSkills(): FormArray {
    return this.opportunityForm.get('requiredSkills') as FormArray;
  }

  get preferredSkills(): FormArray {
    return this.opportunityForm.get('preferredSkills') as FormArray;
  }

  get learningOutcomes(): FormArray {
    return this.opportunityForm.get('learningOutcomes') as FormArray;
  }

  addSkill(type: 'required' | 'preferred'): void {
    const control = this.fb.control('', Validators.required);
    if (type === 'required') {
      this.requiredSkills.push(control);
    } else {
      this.preferredSkills.push(control);
    }
  }

  removeSkill(type: 'required' | 'preferred', index: number): void {
    if (type === 'required') {
      this.requiredSkills.removeAt(index);
    } else {
      this.preferredSkills.removeAt(index);
    }
  }

  addLearningOutcome(): void {
    const control = this.fb.control('', Validators.required);
    this.learningOutcomes.push(control);
  }

  removeLearningOutcome(index: number): void {
    this.learningOutcomes.removeAt(index);
  }

  onSubmit(): void {
    if (this.opportunityForm.valid) {
      const formValue = this.opportunityForm.value;
      
      const opportunity: Omit<Opportunity, 'id'> = {
        title: formValue.title,
        department: formValue.department,
        description: formValue.description,
        requiredSkills: formValue.requiredSkills.filter((skill: string) => skill.trim()),
        preferredSkills: formValue.preferredSkills.filter((skill: string) => skill.trim()),
        timeCommitment: formValue.timeCommitment,
        duration: formValue.duration,
        learningOutcomes: formValue.learningOutcomes.filter((outcome: string) => outcome.trim()),
        mentorAvailable: formValue.mentorAvailable,
        remote: formValue.remote,
        level: formValue.level,
        applicationDeadline: formValue.applicationDeadline.toISOString().split('T')[0],
        startDate: formValue.startDate.toISOString().split('T')[0],
        // Default filter metadata fields
        leader: 'Reports to 5',
        jobLevel: 'L4',
        jobFamily: formValue.department,
        jobProfile: 'Standard',
        plIc: 'IC',
        tenure: '2+ years',
        location: formValue.remote ? 'Remote' : 'On-site',
        dayZero: false,
        lossImpact: 'Medium',
        attritionRisk: 'Medium',
        attritionResponse: 'Standard Support',
        previousPerformanceRatings: ['Meets', 'Exceeds'],
        rotationLevel: 'Department',
        rotationLength: formValue.duration
      };

      if (this.isEditMode && this.opportunityId) {
        this.opportunityService.updateOpportunity(this.opportunityId, opportunity).subscribe({
          next: (updatedOpportunity) => {
            this.snackBar.open('Opportunity updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/opportunities']);
          },
          error: (error) => {
            this.snackBar.open('Error updating opportunity. Please try again.', 'Close', { duration: 3000 });
            console.error('Error updating opportunity:', error);
          }
        });
      } else {
        this.opportunityService.createOpportunity(opportunity).subscribe({
          next: (createdOpportunity) => {
            this.snackBar.open('Opportunity created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/manager']);
          },
          error: (error) => {
            this.snackBar.open('Error creating opportunity. Please try again.', 'Close', { duration: 3000 });
            console.error('Error creating opportunity:', error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', { duration: 3000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.opportunityForm.controls).forEach(key => {
      const control = this.opportunityForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/manager']);
  }
}
