import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  skills: string[] = [];
  interests: string[] = [];
  careerGoals: string[] = [];
  
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  departments = [
    'Engineering',
    'Marketing',
    'Sales',
    'Design',
    'Data Science',
    'Customer Success',
    'HR',
    'Finance',
    'Legal & Compliance'
  ];

  performanceRatings = [
    { value: 'Outstanding', label: 'Outstanding' },
    { value: 'Exceeds', label: 'Exceeds Expectations' },
    { value: 'Meets', label: 'Meets Expectations' },
    { value: 'Below', label: 'Below Expectations' }
  ];

  availabilityOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Project-based', label: 'Project-based' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedProfile();
    this.setupFormChangeListener();
  }

  setupFormChangeListener(): void {
    this.employeeForm.valueChanges.subscribe(() => {
      this.saveProfile();
    });
  }

  initializeForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      department: ['', [Validators.required]],
      currentRole: ['', [Validators.required]],
      yearsExperience: [0, [Validators.min(0), Validators.max(50)]],
      performanceRating: ['Meets', [Validators.required]],
      availability: ['Full-time', [Validators.required]]
    });
  }

  loadSavedProfile(): void {
    const savedProfile = localStorage.getItem('employeeProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        
        // Update form controls
        this.employeeForm.patchValue({
          name: parsedProfile.name || '',
          email: parsedProfile.email || '',
          department: parsedProfile.department || '',
          currentRole: parsedProfile.currentRole || '',
          yearsExperience: parsedProfile.yearsExperience || 0,
          performanceRating: parsedProfile.performanceRating || 'Meets',
          availability: parsedProfile.availability || 'Full-time'
        });

        // Update arrays
        this.skills = parsedProfile.skills || [];
        this.interests = parsedProfile.interests || [];
        this.careerGoals = parsedProfile.careerGoals || [];
      } catch (error) {
        console.error('Error loading saved profile:', error);
      }
    }
  }

  saveProfile(): void {
    const profileData = {
      ...this.employeeForm.value,
      skills: this.skills,
      interests: this.interests,
      careerGoals: this.careerGoals
    };
    
    if (profileData.name || profileData.email) {
      localStorage.setItem('employeeProfile', JSON.stringify(profileData));
    }
  }

  clearProfile(): void {
    localStorage.removeItem('employeeProfile');
    this.employeeForm.reset({
      name: '',
      email: '',
      department: '',
      currentRole: '',
      yearsExperience: 0,
      performanceRating: 'Meets',
      availability: 'Full-time'
    });
    this.skills = [];
    this.interests = [];
    this.careerGoals = [];
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.skills.includes(value)) {
      this.skills.push(value);
      this.saveProfile();
    }
    event.chipInput!.clear();
  }

  removeSkill(skill: string): void {
    const index = this.skills.indexOf(skill);
    if (index >= 0) {
      this.skills.splice(index, 1);
      this.saveProfile();
    }
  }

  addInterest(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.interests.includes(value)) {
      this.interests.push(value);
      this.saveProfile();
    }
    event.chipInput!.clear();
  }

  removeInterest(interest: string): void {
    const index = this.interests.indexOf(interest);
    if (index >= 0) {
      this.interests.splice(index, 1);
      this.saveProfile();
    }
  }

  addCareerGoal(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.careerGoals.includes(value)) {
      this.careerGoals.push(value);
      this.saveProfile();
    }
    event.chipInput!.clear();
  }

  removeCareerGoal(goal: string): void {
    const index = this.careerGoals.indexOf(goal);
    if (index >= 0) {
      this.careerGoals.splice(index, 1);
      this.saveProfile();
    }
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const employee: Employee = {
        id: Date.now().toString(),
        ...this.employeeForm.value,
        skills: this.skills,
        interests: this.interests,
        careerGoals: this.careerGoals
      };

      // Save the complete profile
      this.saveProfile();
      
      this.employeeService.setCurrentEmployee(employee);
      this.router.navigate(['/matches']);
    }
  }
}
